export interface UserAccount {
  id: string;
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

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'u_default',
    username: '林心理咨询师',
    password: '123456',
    name: '林心理咨询师',
    title: '国家二级心理咨询师 · 督导师',
    avatar: '🩺',
    createdAt: '2026-01-01',
  },
  {
    id: 'u_demo',
    username: 'counselor_demo',
    password: '123456',
    name: '张督导',
    title: '高级心理咨询督导师',
    avatar: '👩‍⚕️',
    createdAt: '2026-01-01',
  },
];

export function getStoredAccounts(): UserAccount[] {
  try {
    const fallbackKeys = [STORAGE_KEYS.ACCOUNTS, 'psy_user_accounts_backup', 'psy_user_accounts', 'psy_accounts'];
    for (const key of fallbackKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Keep master backup updated
            localStorage.setItem('psy_user_accounts_backup', JSON.stringify(parsed));
            if (key !== STORAGE_KEYS.ACCOUNTS) {
              localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(parsed));
            }
            return parsed;
          }
        } catch (e) { /* ignore parse error */ }
      }
    }
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
    localStorage.setItem('psy_user_accounts_backup', JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveAccounts(accounts: UserAccount[]): void {
  try {
    const jsonStr = JSON.stringify(accounts);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, jsonStr);
    localStorage.setItem('psy_user_accounts_backup', jsonStr);
  } catch (err) {
    console.error('Failed to save accounts:', err);
  }
}

export function getCurrentUser(): UserAccount | null {
  try {
    const sessionKeys = [STORAGE_KEYS.CURRENT_USER, 'psy_current_user_backup', 'psy_user_session'];
    for (const key of sessionKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id) {
            localStorage.setItem('psy_current_user_backup', JSON.stringify(parsed));
            if (key !== STORAGE_KEYS.CURRENT_USER) {
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsed));
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
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
      localStorage.setItem('psy_current_user_backup', JSON.stringify(defaultUser));
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
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, str);
      localStorage.setItem('psy_current_user_backup', str);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem('psy_current_user_backup');
    }
  } catch (err) {
    console.error('Failed to set current user session:', err);
  }
}

export function loginUser(
  username: string,
  password: string
): { success: boolean; user?: UserAccount; error?: string } {
  const accounts = getStoredAccounts();
  const trimmed = username.trim().toLowerCase();
  
  const found = accounts.find(
    (a) => a.username.toLowerCase() === trimmed
  );

  if (!found) {
    return { success: false, error: '账号不存在，请先点击“注册新账号”' };
  }

  if (found.password && found.password !== password) {
    return { success: false, error: '密码错误，默认演示账号密码为 123456' };
  }

  setCurrentUserSession(found);
  return { success: true, user: found };
}

export function registerUser(
  username: string,
  password: string,
  title: string = '心理咨询师',
  avatar: string = '🩺',
  name?: string
): { success: boolean; user?: UserAccount; error?: string } {
  const accounts = getStoredAccounts();
  const trimmedUser = username.trim();

  if (!trimmedUser || trimmedUser.length < 2) {
    return { success: false, error: '账号/用户名长度至少2个字符' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: '密码长度至少为6位' };
  }

  if (accounts.some((a) => a.username.toLowerCase() === trimmedUser.toLowerCase())) {
    return { success: false, error: '该账号名称已被注册，请尝试其他账号名或直接登录' };
  }

  const newUser: UserAccount = {
    id: 'u_' + Date.now(),
    username: trimmedUser,
    password: password,
    name: name?.trim() || trimmedUser,
    title: title.trim() || '心理咨询师',
    avatar: avatar || '🩺',
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
