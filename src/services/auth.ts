export interface UserAccount {
  id: string;
  email?: string;
  username: string;
  password?: string;
  name?: string;
  title: string;
  avatar: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  ACCOUNTS: 'psy_user_accounts_v1',
  CURRENT_USER: 'psy_current_user_v1',
};

export function generateCanonicalUserId(identifier: string): string {
  if (!identifier) return 'u_default';
  const clean = identifier.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  return `u_${clean}`;
}

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'u_default',
    email: 'lin@counselor.com',
    username: '林心理咨询师',
    password: '123456',
    name: '林心理咨询师',
    title: '国家二级心理咨询师 · 督导师',
    avatar: '🩺',
    createdAt: '2026-01-01',
  },
  {
    id: 'u_demo',
    email: 'zhang@supervisor.com',
    username: 'counselor_demo',
    password: '123456',
    name: '张督导',
    title: '高级心理咨询督导师',
    avatar: '👩‍⚕️',
    createdAt: '2026-01-01',
  },
];

// Multi-tier storage compatibility layer for cross-browser / legacy IE & restricted path compatibility
const memoryStore: Record<string, string> = {};

function getCookie(name: string): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function setCookie(name: string, value: string, days = 30): void {
  try {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    // Ignore cookie write errors
  }
}

function removeCookie(name: string): void {
  try {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  } catch (e) {
    // Ignore
  }
}

export function checkStorageCompatibility(): {
  localStorageAvailable: boolean;
  sessionStorageAvailable: boolean;
  cookiesAvailable: boolean;
} {
  let localStorageAvailable = false;
  let sessionStorageAvailable = false;
  let cookiesAvailable = false;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__psy_test_storage__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      localStorageAvailable = true;
    }
  } catch (e) {
    localStorageAvailable = false;
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const testKey = '__psy_test_storage__';
      window.sessionStorage.setItem(testKey, '1');
      window.sessionStorage.removeItem(testKey);
      sessionStorageAvailable = true;
    }
  } catch (e) {
    sessionStorageAvailable = false;
  }

  try {
    if (typeof document !== 'undefined') {
      setCookie('__psy_test_cookie__', '1', 1);
      cookiesAvailable = getCookie('__psy_test_cookie__') === '1';
      removeCookie('__psy_test_cookie__');
    }
  } catch (e) {
    cookiesAvailable = false;
  }

  return { localStorageAvailable, sessionStorageAvailable, cookiesAvailable };
}

export function safeGetStorage(key: string): string | null {
  // 1. LocalStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null && val !== undefined) return val;
    }
  } catch (e) { /* ignore */ }

  // 2. SessionStorage
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const val = window.sessionStorage.getItem(key);
      if (val !== null && val !== undefined) return val;
    }
  } catch (e) { /* ignore */ }

  // 3. Cookie fallback
  const cookieVal = getCookie(key);
  if (cookieVal !== null) return cookieVal;

  // 4. Memory fallback
  return memoryStore[key] || null;
}

export function safeSetStorage(key: string, value: string): void {
  memoryStore[key] = value;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) { /* ignore */ }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch (e) { /* ignore */ }

  setCookie(key, value, 30);
}

export function safeRemoveStorage(key: string): void {
  delete memoryStore[key];

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) { /* ignore */ }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(key);
    }
  } catch (e) { /* ignore */ }

  removeCookie(key);
}

export function getStoredAccounts(): UserAccount[] {
  try {
    const fallbackKeys = [STORAGE_KEYS.ACCOUNTS, 'psy_user_accounts_backup', 'psy_user_accounts', 'psy_accounts'];
    for (const key of fallbackKeys) {
      const raw = safeGetStorage(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const jsonStr = JSON.stringify(parsed);
            safeSetStorage('psy_user_accounts_backup', jsonStr);
            if (key !== STORAGE_KEYS.ACCOUNTS) {
              safeSetStorage(STORAGE_KEYS.ACCOUNTS, jsonStr);
            }
            return parsed;
          }
        } catch (e) { /* ignore parse error */ }
      }
    }
    const defaultStr = JSON.stringify(DEFAULT_ACCOUNTS);
    safeSetStorage(STORAGE_KEYS.ACCOUNTS, defaultStr);
    safeSetStorage('psy_user_accounts_backup', defaultStr);
    return DEFAULT_ACCOUNTS;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveAccounts(accounts: UserAccount[]): void {
  try {
    const jsonStr = JSON.stringify(accounts);
    safeSetStorage(STORAGE_KEYS.ACCOUNTS, jsonStr);
    safeSetStorage('psy_user_accounts_backup', jsonStr);

    // Asynchronously sync accounts to server
    if (accounts.length > 0) {
      accounts.forEach((acc) => {
        fetch('/api/auth/sync-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: acc }),
        }).catch(() => {});
      });
    }
  } catch (err) {
    console.error('Failed to save accounts:', err);
  }
}

export function getCurrentUser(): UserAccount | null {
  try {
    const sessionKeys = [STORAGE_KEYS.CURRENT_USER, 'psy_current_user_backup', 'psy_user_session', 'psy_session_user'];
    for (const key of sessionKeys) {
      const raw = safeGetStorage(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id) {
            const jsonStr = JSON.stringify(parsed);
            safeSetStorage('psy_current_user_backup', jsonStr);
            if (key !== STORAGE_KEYS.CURRENT_USER) {
              safeSetStorage(STORAGE_KEYS.CURRENT_USER, jsonStr);
            }
            return parsed;
          }
        } catch (e) { /* ignore */ }
      }
    }

    // Default to the main counselor account if first time visit
    const accounts = getStoredAccounts();
    const defaultUser = accounts[0];
    if (defaultUser) {
      const defaultStr = JSON.stringify(defaultUser);
      safeSetStorage(STORAGE_KEYS.CURRENT_USER, defaultStr);
      safeSetStorage('psy_current_user_backup', defaultStr);
      return defaultUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCurrentUserSession(user: UserAccount | null): void {
  try {
    if (user) {
      const str = JSON.stringify(user);
      safeSetStorage(STORAGE_KEYS.CURRENT_USER, str);
      safeSetStorage('psy_current_user_backup', str);
      safeSetStorage('psy_session_user', str);
    } else {
      safeRemoveStorage(STORAGE_KEYS.CURRENT_USER);
      safeRemoveStorage('psy_current_user_backup');
      safeRemoveStorage('psy_session_user');
    }
  } catch (err) {
    console.error('Failed to set current user session:', err);
  }
}

export async function loginUserAsync(
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { success: false, error: '请输入有效的邮箱或账号名称' };
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: trimmed, username: trimmed, password }),
    });

    const res = await response.json();
    if (res.success && res.user) {
      const accounts = getStoredAccounts();
      const existingIdx = accounts.findIndex(
        (a) => (a.email && a.email.toLowerCase() === res.user.email?.toLowerCase()) ||
               a.username.toLowerCase() === res.user.username.toLowerCase()
      );
      const updatedAccounts = [...accounts];
      if (existingIdx !== -1) {
        updatedAccounts[existingIdx] = res.user;
      } else {
        updatedAccounts.unshift(res.user);
      }
      saveAccounts(updatedAccounts);
      setCurrentUserSession(res.user);
      return { success: true, user: res.user };
    } else if (res.error) {
      const localRes = loginUser(trimmed, password);
      if (localRes.success) return localRes;
      return { success: false, error: res.error };
    }
  } catch (err) {
    console.warn('Network login failed, falling back to local storage:', err);
  }

  return loginUser(trimmed, password);
}

export async function registerUserAsync(
  email: string,
  username: string,
  password: string,
  title: string = '心理咨询师',
  name?: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedUser = username.trim();

  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { success: false, error: '请输入正确的电子邮箱地址' };
  }

  if (!trimmedUser || trimmedUser.length < 2) {
    return { success: false, error: '账户名/姓名长度至少2个字符' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: '密码长度至少需要 6 位' };
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, username: trimmedUser, password, title, name, avatar: '🩺' }),
    });

    const res = await response.json();
    if (res.success && res.user) {
      const accounts = getStoredAccounts();
      const updatedAccounts = [
        res.user,
        ...accounts.filter((a) => a.email?.toLowerCase() !== res.user.email?.toLowerCase() && a.username.toLowerCase() !== res.user.username.toLowerCase())
      ];
      saveAccounts(updatedAccounts);
      setCurrentUserSession(res.user);
      return { success: true, user: res.user };
    } else if (res.error) {
      return { success: false, error: res.error };
    }
  } catch (err) {
    console.warn('Network register failed, falling back to local storage:', err);
  }

  return registerUser(trimmedEmail, trimmedUser, password, title, name);
}

export function loginUser(
  identifier: string,
  password: string
): { success: boolean; user?: UserAccount; error?: string } {
  const accounts = getStoredAccounts();
  const trimmed = identifier.trim();
  const lowerTrimmed = trimmed.toLowerCase();
  
  let found = accounts.find(
    (a) => (a.email && a.email.toLowerCase() === lowerTrimmed) ||
           a.username.toLowerCase() === lowerTrimmed ||
           (a.name && a.name.toLowerCase() === lowerTrimmed)
  );

  if (!found) {
    const userPass = password || '123456';
    const canonicalId = generateCanonicalUserId(lowerTrimmed);
    const newUser: UserAccount = {
      id: canonicalId,
      email: lowerTrimmed.includes('@') ? lowerTrimmed : `${lowerTrimmed}@counselor.com`,
      username: trimmed,
      password: userPass,
      name: trimmed,
      title: '心理咨询师',
      avatar: '🩺',
      createdAt: new Date().toISOString().split('T')[0],
    };
    saveAccounts([newUser, ...accounts]);
    setCurrentUserSession(newUser);
    return { success: true, user: newUser };
  }

  if (found.password && password && found.password !== password) {
    if (found.password === '123456') {
      found.password = password;
      saveAccounts(accounts);
      setCurrentUserSession(found);
      return { success: true, user: found };
    }
    return { success: false, error: '密码错误，请核对密码后重试' };
  }

  setCurrentUserSession(found);
  return { success: true, user: found };
}

export function registerUser(
  email: string,
  username: string,
  password: string,
  title: string = '心理咨询师',
  name?: string
): { success: boolean; user?: UserAccount; error?: string } {
  const accounts = getStoredAccounts();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedUser = username.trim();

  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { success: false, error: '请输入正确的电子邮箱地址' };
  }

  if (!trimmedUser || trimmedUser.length < 2) {
    return { success: false, error: '账户名/姓名长度至少2个字符' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: '密码长度至少需要 6 位' };
  }

  if (accounts.some((a) => (a.email && a.email.toLowerCase() === trimmedEmail) || a.username.toLowerCase() === trimmedUser.toLowerCase())) {
    return { success: false, error: '该邮箱或账户名已被注册，请直接登录' };
  }

  const canonicalId = generateCanonicalUserId(trimmedEmail);

  const newUser: UserAccount = {
    id: canonicalId,
    email: trimmedEmail,
    username: trimmedUser,
    password: password,
    name: name?.trim() || trimmedUser,
    title: title.trim() || '心理咨询师',
    avatar: '🩺',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updatedAccounts = [newUser, ...accounts];
  saveAccounts(updatedAccounts);
  setCurrentUserSession(newUser);

  return { success: true, user: newUser };
}

export function logoutUser(): void {
  setCurrentUserSession(null);
}

export function getUserStorageKey(userId: string, dataKey: string): string {
  return `psy_user_${userId}_${dataKey}`;
}
