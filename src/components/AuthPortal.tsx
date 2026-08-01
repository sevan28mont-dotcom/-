import React, { useState, useRef, useEffect } from 'react';
import { UserAccount, loginUser, registerUser } from '../services/auth';
import { clearAllLocalStorage, EMPTY_SYSTEM_DATA, saveDataToLocalStorage } from '../services/storage';
import {
  Lock,
  User,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Upload,
  Image as ImageIcon,
  X,
  Feather,
  Sparkles,
  Smartphone,
  Mail,
  MessageSquare,
  ShieldCheck,
  Send,
  ArrowRight,
} from 'lucide-react';

interface AuthPortalProps {
  onLoginSuccess: (user: UserAccount) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

type AuthMethod = 'phone' | 'email' | 'wechat' | 'account';

const AVATAR_OPTIONS = [
  '🩺', '👩‍⚕️', '👨‍⚕️', '🧠', '🌿', '🌱', '🌸', '☕',
  '🦉', '🎨', '📜', '🛡️', '💎', '☀️', '🌊', '🕯️'
];

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLoginSuccess, isDarkMode = false, onToggleTheme }) => {
  const [isRegister, setIsRegister] = useState(true);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');

  // Input states
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [password, setPassword] = useState('123456');
  const [title, setTitle] = useState('心理咨询师');
  const [avatar, setAvatar] = useState('🩺');

  // Options
  const [clearDefaultData, setClearDefaultData] = useState(true);

  // Verification Code Countdown
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // WeChat quick login status
  const [wechatNickname, setWechatNickname] = useState('微信心理咨询师');
  const [wechatAvatar, setWechatAvatar] = useState('🌿');

  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer effect
  useEffect(() => {
    let timer: any = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCodeSent(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = () => {
    setErrorMsg('');
    if (authMethod === 'phone' && (!phone || phone.length < 11)) {
      setErrorMsg('请输入正确的11位手机号码');
      return;
    }
    if (authMethod === 'email' && (!email || !email.includes('@'))) {
      setErrorMsg('请输入正确的电子邮箱地址');
      return;
    }

    setCodeSent(true);
    setCountdown(60);
    setVerifyCode('888888'); // Mock auto-filled verification code for smooth UX
    setSuccessMsg('验证码已发送，已为您自动填充演示验证码: 888888');
  };

  // Upload custom photo file
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('图片文件体积过大，请选择 3MB 以内的照片');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatar(dataUrl);
        setCustomPhotoUrl(dataUrl);
        setErrorMsg('');
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleWechatLogin = () => {
    setErrorMsg('');
    const targetUser = `${wechatNickname}`;
    const res = registerUser(targetUser, '123456', title, wechatAvatar, wechatNickname);
    if (res.user) {
      if (clearDefaultData) {
        saveDataToLocalStorage(EMPTY_SYSTEM_DATA, res.user.id);
      }
      onLoginSuccess(res.user);
    } else {
      // If already registered, perform login
      const loginRes = loginUser(targetUser, '123456');
      if (loginRes.user) {
        onLoginSuccess(loginRes.user);
      } else {
        setErrorMsg(loginRes.error || '微信授权登录失败');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    let finalUsername = username;
    if (authMethod === 'phone') {
      if (!phone || phone.length < 11) {
        setErrorMsg('请输入正确的手机号码');
        return;
      }
      finalUsername = `手机号_${phone.slice(-4)}`;
    } else if (authMethod === 'email') {
      if (!email || !email.includes('@')) {
        setErrorMsg('请输入正确的邮箱地址');
        return;
      }
      finalUsername = email.split('@')[0];
    }

    if (!finalUsername) {
      setErrorMsg('请填写完整的账号标识信息');
      return;
    }

    if (isRegister) {
      const res = registerUser(finalUsername, password, title, avatar);
      if (!res.success) {
        setErrorMsg(res.error || '注册失败，请检查输入！');
        return;
      }
      if (res.user) {
        if (clearDefaultData) {
          // Clear example data so user starts with a clean slate
          saveDataToLocalStorage(EMPTY_SYSTEM_DATA, res.user.id);
        }
        onLoginSuccess(res.user);
      }
    } else {
      const res = loginUser(finalUsername, password);
      if (!res.success) {
        setErrorMsg(res.error || '登录失败！请核对用户名与密码');
        return;
      }
      if (res.user) {
        onLoginSuccess(res.user);
      }
    }
  };

  const handleDemoLogin = (demoUsername: string) => {
    setErrorMsg('');
    const res = loginUser(demoUsername, '123456');
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      const fallback = loginUser('counselor', '123456');
      if (fallback.success && fallback.user) {
        onLoginSuccess(fallback.user);
      } else {
        setErrorMsg('演示账号登录失败');
      }
    }
  };

  const isPhotoAvatar = avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('https');

  return (
    <div className="min-h-screen bg-linear-to-br from-rose-50 via-zinc-50 to-rose-100/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 transition-colors duration-300 select-none">
      
      {/* Dark/Light mode toggle */}
      {onToggleTheme && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border shadow-2xs ${
              isDarkMode
                ? 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700'
                : 'bg-white text-zinc-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            {isDarkMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
                <span>深色夜间</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>浅色日间</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Responsive Mobile Vertical Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-5 sm:p-7 space-y-5 transition-colors duration-300 max-h-[92vh] flex flex-col my-auto">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-1.5 shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-rose-100 via-pink-50 to-amber-100 dark:from-rose-950 dark:via-slate-800 dark:to-slate-900 border border-rose-200/80 dark:border-slate-700 rounded-2xl text-rose-500 dark:text-rose-400 shadow-2xs">
            <Feather className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-rose-800 via-rose-900 to-zinc-800 dark:from-rose-200 dark:via-rose-100 dark:to-slate-200 bg-clip-text text-transparent">
              记了个屁
            </h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-rose-500" />
              <span>闹心工作台</span>
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-slate-400 font-medium">
            {isRegister ? '手机竖屏快速注册 · 全程账号同步' : '请登录您的心理咨询师专属工作台'}
          </p>
        </div>

        {/* Tab Toggle: Login / Register */}
        <div className="flex bg-rose-50/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-rose-200 dark:border-slate-700 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              !isRegister
                ? 'bg-zinc-800 dark:bg-rose-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>账号登录</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isRegister
                ? 'bg-zinc-800 dark:bg-rose-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>注册新账号</span>
          </button>
        </div>

        {/* Multi-Channel Method Selector */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-100 dark:bg-slate-800/60 rounded-2xl border border-zinc-200 dark:border-slate-700 text-[11px] font-bold shrink-0">
          <button
            type="button"
            onClick={() => setAuthMethod('phone')}
            className={`py-1.5 rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              authMethod === 'phone'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs font-extrabold'
                : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>手机号</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('wechat')}
            className={`py-1.5 rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              authMethod === 'wechat'
                ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>微信</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('email')}
            className={`py-1.5 rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              authMethod === 'email'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs font-extrabold'
                : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>邮箱</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('account')}
            className={`py-1.5 rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              authMethod === 'account'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs font-extrabold'
                : 'text-zinc-600 dark:text-slate-400 hover:text-zinc-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>用户名</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 p-2.5 rounded-2xl flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-semibold animate-pulse shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 p-2.5 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
          {authMethod === 'wechat' ? (
            /* WeChat One-Click Fast Auth View */
            <div className="bg-emerald-50/60 dark:bg-slate-800/80 p-4 rounded-2xl border border-emerald-200 dark:border-slate-700 space-y-4 text-center animate-fadeIn">
              <div className="inline-flex p-3 bg-emerald-600 text-white rounded-2xl shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">微信账号快速授权注册/登录</h3>
                <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">自动绑定微信身份，开启全程数据实时多端同步</p>
              </div>

              <div className="space-y-2 text-left bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-slate-300">微信昵称设置:</label>
                <input
                  type="text"
                  value={wechatNickname}
                  onChange={(e) => setWechatNickname(e.target.value)}
                  className="w-full text-xs p-2 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <button
                type="button"
                onClick={handleWechatLogin}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>微信一键授权进入工作台</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Standard / Phone / Email Form */
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Phone Field */}
              {authMethod === 'phone' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
                    手机号码
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入11位中国大陆手机号码"
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              {authMethod === 'email' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
                    电子邮箱地址
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="例如: counselor@psych.cn"
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                    />
                  </div>
                </div>
              )}

              {/* Username Field */}
              {authMethod === 'account' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
                    账户 / 用户名
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="例如: 林心理咨询师 / Dr.Alex"
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                    />
                  </div>
                </div>
              )}

              {/* Verification Code field for phone & email */}
              {(authMethod === 'phone' || authMethod === 'email') && isRegister && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
                    验证码
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="6位验证码"
                      className="flex-1 p-2.5 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      type="button"
                      disabled={codeSent && countdown > 0}
                      onClick={handleSendCode}
                      className="px-3 py-2.5 bg-rose-100 dark:bg-slate-800 hover:bg-rose-200 dark:hover:bg-slate-700 disabled:opacity-50 text-rose-800 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-slate-700 transition cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>{countdown > 0 ? `${countdown}s 后可重发` : '获取验证码'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
                  设置/验证密码
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入6位以上安全密码"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                  />
                </div>
              </div>

              {/* Registration Extra Fields */}
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
                      专业资质 / 职称头衔 <span className="text-[11px] font-normal text-zinc-400">(选填)</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="如: 国家二级心理咨询师 / 督导师"
                      className="w-full px-3 py-2 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                    />
                  </div>

                  {/* Clear Default Data Option Checkbox */}
                  <div className="p-3 bg-rose-50/80 dark:bg-slate-800/80 rounded-2xl border border-rose-200 dark:border-slate-700">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-zinc-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={clearDefaultData}
                        onChange={(e) => setClearDefaultData(e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded-md focus:ring-rose-500 border-rose-300 cursor-pointer"
                      />
                      <span>【空白卷宗】初始化清空例子，由我自主添加个案与督导</span>
                    </label>
                    <p className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1 pl-6">
                      勾选后新注册账号将清空系统初始的演示案例，提供完全干净的档案库。
                    </p>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-zinc-800 dark:bg-rose-600 hover:bg-zinc-700 dark:hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer mt-2 flex items-center justify-center gap-2 active:scale-98"
              >
                {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isRegister ? '创建新账号并开启全程同步' : '登 录 工作台'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Quick Demo Login Option */}
        <div className="pt-2 border-t border-rose-100 dark:border-slate-800 space-y-2 shrink-0">
          <div className="text-center text-[10px] text-zinc-400 dark:text-slate-500 font-semibold">
            快速体验模式
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('林心理咨询师')}
              className="py-1.5 px-2 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-slate-700 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>🩺 林咨询师体验</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('counselor_demo')}
              className="py-1.5 px-2 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-slate-700 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>👩‍⚕️ 张督导体验</span>
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="text-center pt-1 shrink-0">
          <span className="text-[10px] text-zinc-400 dark:text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>同账号全程多端实时加密同步</span>
          </span>
        </div>

      </div>
    </div>
  );
};
