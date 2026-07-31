import React, { useState, useRef } from 'react';
import { UserAccount, loginUser, registerUser } from '../services/auth';
import { Lock, User, UserPlus, LogIn, Shield, CheckCircle2, AlertCircle, Sun, Moon, Upload, Image as ImageIcon, X, Feather, Sparkles } from 'lucide-react';

interface AuthPortalProps {
  onLoginSuccess: (user: UserAccount) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

const AVATAR_OPTIONS = [
  '🩺', '👩‍⚕️', '👨‍⚕️', '🧠', '🌿', '🌱', '🌸', '☕',
  '🦉', '🎨', '📜', '🛡️', '💎', '☀️', '🌊', '🕯️'
];

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLoginSuccess, isDarkMode = false, onToggleTheme }) => {
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [avatar, setAvatar] = useState('🩺');

  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const [errorMsg, setErrorMsg] = useState('');

  // Handle uploading custom photo file
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegister) {
      const res = registerUser(username, password, title, avatar);
      if (!res.success) {
        setErrorMsg(res.error || '注册失败，请检查输入！');
        return;
      }
      if (res.user) {
        onLoginSuccess(res.user);
      }
    } else {
      const res = loginUser(username, password);
      if (!res.success) {
        setErrorMsg(res.error || '登录失败！');
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
      // Fallback search
      const accounts = loginUser('counselor', '123456');
      if (accounts.success && accounts.user) {
        onLoginSuccess(accounts.user);
      } else {
        setErrorMsg('演示账号登录失败');
      }
    }
  };

  const isPhotoAvatar = avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('https');

  return (
    <div className="min-h-screen bg-linear-to-br from-rose-50 via-zinc-50 to-rose-100/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      {/* 顶部主题切换按钮 */}
      {onToggleTheme && (
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border shadow-2xs ${
              isDarkMode
                ? 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700'
                : 'bg-white text-zinc-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            {isDarkMode ? (
              <>
                <Moon className="w-4 h-4 text-amber-300 fill-amber-300/30" />
                <span>深色夜间</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>浅色日间</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-8 space-y-6 transition-colors duration-300">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-rose-100 via-pink-50 to-amber-100 dark:from-rose-950 dark:via-slate-800 dark:to-slate-900 border border-rose-200/80 dark:border-slate-700 rounded-2xl text-rose-500 dark:text-rose-400 shadow-2xs mb-1">
            <Feather className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-rose-800 via-rose-900 to-zinc-800 dark:from-rose-200 dark:via-rose-100 dark:to-slate-200 bg-clip-text text-transparent">
              记了个屁
            </h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 shadow-2xs flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-rose-500" />
              <span>闹心工作台</span>
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-slate-400 font-medium">
            {isRegister ? '创建您的专属咨询工作台账号' : '请登录您的咨询师账号进入系统'}
          </p>
        </div>

        {/* Tab Toggle: Login / Register */}
        <div className="flex bg-rose-50/80 dark:bg-slate-800 p-1 rounded-2xl border border-rose-200 dark:border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              !isRegister
                ? 'bg-zinc-800 dark:bg-rose-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>账号登录</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isRegister
                ? 'bg-zinc-800 dark:bg-rose-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>注册新账号</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 p-3 rounded-xl flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-semibold animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              账户 / 用户名 <span className="text-[11px] font-normal text-zinc-500 dark:text-slate-400">(支持中文或英文样式)</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegister ? '如: 林心理咨询师 / Dr.Alex / 心语工坊' : '请输入账号/用户名'}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              访问密码
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入6位以上密码"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
              />
            </div>
          </div>

          {/* Registration extra fields */}
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
                  className="w-full px-3 py-2.5 bg-zinc-50/50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300">
                    选择工作台头像样式
                  </label>
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>上传个人照片</span>
                  </button>
                  <input
                    type="file"
                    ref={photoFileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Preset Icon Palette Gallery */}
                <div className="grid grid-cols-8 gap-1.5 mb-2">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAvatar(opt)}
                      className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center border transition cursor-pointer ${
                        avatar === opt && !isPhotoAvatar
                          ? 'bg-rose-100 dark:bg-rose-950 border-rose-500 dark:border-rose-400 scale-105 shadow-2xs ring-2 ring-rose-400/50'
                          : 'bg-zinc-50 dark:bg-slate-800 border-zinc-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Custom Photo Upload Preview / URL Option */}
                <div className="bg-rose-50/50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-rose-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                      <span>自定义工作台照片</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 underline cursor-pointer"
                    >
                      {showUrlInput ? '收起网络链接' : '输入网络照片网址'}
                    </button>
                  </div>

                  {/* Photo Preview if photo avatar selected */}
                  {isPhotoAvatar && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-rose-200 dark:border-slate-700">
                      <img
                        src={avatar}
                        alt="自定义照片预览"
                        className="w-10 h-10 rounded-full object-cover border-2 border-rose-400 shadow-2xs"
                      />
                      <div className="flex-1 text-[11px]">
                        <p className="font-bold text-rose-700 dark:text-rose-300">已选用自主上传照片</p>
                        <p className="text-zinc-500 dark:text-slate-400">将在顶部工作台与档案中展示</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAvatar('🩺')}
                        className="text-zinc-400 hover:text-rose-600 p-1"
                        title="取消自定义照片，重置为图标"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {showUrlInput && (
                    <div className="space-y-1">
                      <input
                        type="url"
                        placeholder="粘贴网络照片 URL 地址 (如 https://...)"
                        value={customPhotoUrl}
                        onChange={(e) => {
                          setCustomPhotoUrl(e.target.value);
                          if (e.target.value.trim()) {
                            setAvatar(e.target.value.trim());
                          }
                        }}
                        className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-lg text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-zinc-800 dark:bg-rose-600 hover:bg-zinc-700 dark:hover:bg-rose-500 text-white font-bold text-sm rounded-xl transition shadow-md cursor-pointer mt-2 flex items-center justify-center gap-2 active:scale-98"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{isRegister ? '立即创建账号并登录' : '登 录 工作台'}</span>
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div className="pt-2 border-t border-rose-100 dark:border-slate-800 space-y-3">
          <div className="text-center text-[11px] text-zinc-400 dark:text-slate-500 font-semibold">
            或使用测试账号快速体验
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('林心理咨询师')}
              className="py-2 px-3 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🩺 林咨询师登录</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('counselor_demo')}
              className="py-2 px-3 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>👩‍⚕️ 张督导登录</span>
            </button>
          </div>
        </div>

        {/* Security Reassurance */}
        <div className="text-center pt-1">
          <span className="text-[11px] text-zinc-400 dark:text-slate-500 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>独立账号隐私隔离与本地安全加密</span>
          </span>
        </div>

      </div>
    </div>
  );
};

