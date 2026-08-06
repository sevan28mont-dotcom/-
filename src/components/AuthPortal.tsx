import React, { useState } from 'react';
import { UserAccount, loginUser, loginUserAsync, registerUserAsync, saveDeviceInfo } from '../services/auth';
import { EMPTY_SYSTEM_DATA, fetchBackendData, getDefaultSampleSystemData, saveDataToLocalStorage } from '../services/storage';
import {
  Lock,
  User,
  Mail,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Feather,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AuthPortalProps {
  onLoginSuccess: (user: UserAccount) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLoginSuccess, isDarkMode = false, onToggleTheme }) => {
  const [isRegister, setIsRegister] = useState(false);

  // Input states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [title, setTitle] = useState('心理咨询师');

  // Load demo data by default for new registrations
  const [includeDemoData, setIncludeDemoData] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Compute Password Strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '未输入', color: 'bg-zinc-200', text: 'text-zinc-400' };
    if (pass.length < 6) return { score: 1, label: '弱', color: 'bg-rose-500', text: 'text-rose-500' };
    
    let score = 1;
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);

    if (hasLetters && hasNumbers) score = 2;
    if (pass.length >= 8 && hasLetters && hasNumbers && hasSpecial) score = 3;

    if (score === 3) return { score: 3, label: '高强度安全', color: 'bg-emerald-500', text: 'text-emerald-600' };
    if (score === 2) return { score: 2, label: '中等强度', color: 'bg-amber-500', text: 'text-amber-600' };
    return { score: 1, label: '较弱', color: 'bg-rose-500', text: 'text-rose-500' };
  };

  const passStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    setIsLoading(true);

    try {
      if (isRegister) {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedUsername = username.trim();

        if (!trimmedEmail || !trimmedEmail.includes('@')) {
          setErrorMsg('请填写格式正确的电子邮箱（如 test@example.com）');
          setIsLoading(false);
          return;
        }

        if (!trimmedUsername || trimmedUsername.length < 2) {
          setErrorMsg('请填写账户名/姓名（至少2位）');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('密码强度不足：密码长度至少需要 6 位字符！');
          setIsLoading(false);
          return;
        }

        const regRes = await registerUserAsync(trimmedEmail, trimmedUsername, password, title);
        if (!regRes.success) {
          setErrorMsg(regRes.error || '注册失败，该邮箱或账户名已被注册，请直接登录');
          setIsLoading(false);
          return;
        }

        if (regRes.user) {
          saveDeviceInfo();
          // Check if server already has user's cloud backup
          const existingCloudData = await fetchBackendData(regRes.user.id);
          if (existingCloudData) {
            saveDataToLocalStorage(existingCloudData, regRes.user.id);
          } else {
            saveDataToLocalStorage(
              includeDemoData ? getDefaultSampleSystemData() : EMPTY_SYSTEM_DATA,
              regRes.user.id
            );
          }
          setSuccessMsg('账号注册成功！已写入当前设备标识，正在进入工作台...');
          setTimeout(() => {
            onLoginSuccess(regRes.user!);
          }, 400);
        }
      } else {
        // Login flow with cross-device backend verification
        const trimmedInput = username.trim();
        if (!trimmedInput) {
          setErrorMsg('请输入正确的登录邮箱或账户名');
          setIsLoading(false);
          return;
        }

        const loginRes = await loginUserAsync(trimmedInput, password);
        if (!loginRes.success) {
          setErrorMsg(loginRes.error || '登录失败！请检查邮箱/账户名或密码');
          setIsLoading(false);
          return;
        }

        if (loginRes.user) {
          saveDeviceInfo();
          // Fetch cloud backup for this canonical user ID
          const cloudData = await fetchBackendData(loginRes.user.id);
          if (cloudData) {
            saveDataToLocalStorage(cloudData, loginRes.user.id);
          }
          setSuccessMsg('登录成功！已识别并写入当前设备环境，已对齐云端数据');
          setTimeout(() => {
            onLoginSuccess(loginRes.user!);
          }, 300);
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMsg('登录请求出现网络与连接异常，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoUsername: string) => {
    setErrorMsg('');
    const res = loginUser(demoUsername, '123456');
    if (res.success && res.user) {
      saveDeviceInfo();
      onLoginSuccess(res.user);
    } else {
      const fallback = loginUser('counselor', '123456');
      if (fallback.success && fallback.user) {
        saveDeviceInfo();
        onLoginSuccess(fallback.user);
      } else {
        setErrorMsg('演示账号登录失败');
      }
    }
  };

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

      {/* Main Responsive Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-5 sm:p-7 space-y-4 transition-colors duration-300 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-1 shrink-0">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br from-rose-100 via-pink-50 to-amber-100 dark:from-rose-950 dark:via-slate-800 dark:to-slate-900 border border-rose-200/80 dark:border-slate-700 rounded-2xl text-rose-500 dark:text-rose-400 shadow-2xs">
            <Feather className="w-5 h-5" />
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
            {isRegister ? '填写邮箱、账户名与密码注册并极速跨端同步' : '使用注册邮箱或账户名登录您的心理咨询工作台'}
          </p>
        </div>

        {/* Primary Tab Toggle: Login / Register */}
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
            <span>密码登录</span>
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
            <span>用户注册</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 p-2.5 rounded-2xl flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-semibold shrink-0">
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3 flex-1 overflow-y-auto pr-1">
          {/* Email Input (Visible for Register) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
                电子邮箱 (多端同步唯一标识) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="如: myname@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                />
              </div>
            </div>
          )}

          {/* Username / Login Identifier Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              {isRegister ? '账户名 / 咨询师姓名 *' : '登录邮箱 / 账户名 *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegister ? "如: 林心理咨询师 或 张咨询" : "请输入您的注册邮箱或账户名"}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              />
            </div>
          </div>

          {/* Password Input & Strength Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300">
                密码 *
              </label>
              {isRegister && (
                <span className={`text-[10px] font-bold ${passStrength.text}`}>
                  密码强度: {passStrength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入 6 位以上密码"
                className="w-full pl-9 pr-8 py-2 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Password Strength Progress Bar & Tips */}
            {isRegister && password.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="h-1 w-full bg-zinc-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full transition-all duration-300 flex-1 ${passStrength.score >= 1 ? passStrength.color : 'opacity-20'}`} />
                  <div className={`h-full transition-all duration-300 flex-1 ${passStrength.score >= 2 ? passStrength.color : 'opacity-20'}`} />
                  <div className={`h-full transition-all duration-300 flex-1 ${passStrength.score >= 3 ? passStrength.color : 'opacity-20'}`} />
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-slate-500">
                  建议包含字母、数字及特殊符号，长度至少 6 位以保障档案安全性。
                </p>
              </div>
            )}
          </div>

          {/* Registration Extra Fields */}
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
                  专业资质 / 头衔 <span className="text-[11px] font-normal text-zinc-400">(选填)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="如: 国家二级心理咨询师 · 精神分析取向"
                  className="w-full px-3 py-1.5 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                />
              </div>

              {/* Include Demo Data Option Checkbox */}
              <div className="p-2.5 bg-rose-50/80 dark:bg-slate-800/80 rounded-2xl border border-rose-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={includeDemoData}
                    onChange={(e) => setIncludeDemoData(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded-md focus:ring-rose-500 border-rose-300 cursor-pointer"
                  />
                  <span>【推荐】初始化包含预设示范来访个案与督导记录</span>
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-zinc-800 dark:bg-rose-600 hover:bg-zinc-700 dark:hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer mt-1 flex items-center justify-center gap-2 active:scale-98"
          >
            {isLoading ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : isRegister ? (
              <UserPlus className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>
              {isLoading
                ? '处理中...'
                : isRegister
                ? '完成注册并开启工作台'
                : '登 录 工作台'}
            </span>
          </button>
        </form>

        {/* Quick Demo Login Option: Single clean button */}
        <div className="pt-2 border-t border-rose-100 dark:border-slate-800 space-y-2 shrink-0">
          <button
            type="button"
            onClick={() => handleDemoLogin('林心理咨询师')}
            className="w-full py-2.5 px-3 bg-rose-50/90 dark:bg-slate-800/90 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-slate-700 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>免注册演示账号直接体验</span>
          </button>
        </div>

        {/* Security Footer */}
        <div className="text-center pt-0.5 shrink-0">
          <span className="text-[10px] text-zinc-400 dark:text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>全网络加密存储 & 网页/手机/Pad 跨设备同账号全量无缝同步</span>
          </span>
        </div>

      </div>
    </div>
  );
};
