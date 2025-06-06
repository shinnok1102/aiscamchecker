import { useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../../shared-types';
// Import t function or use context. For simplicity, we'll assume t is available if error messages are complex.
// For this example, we'll keep it simple, but in a larger app, you might pass `t` or use a global t.

const USER_SESSION_KEY = 'localUserSession';

// Make DUMMY_USER mutable for this mock setup, or simulate backend data
let DUMMY_USER_DATA = {
  id: 'testuser',
  username: 'testuser',
  password: 'password123', 
  email: 'testuser@example.com'
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true); 
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_SESSION_KEY);
      if (storedUser) {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        // Sync DUMMY_USER_DATA's username if a session exists, to reflect updates across sessions for the mock
        if (parsedUser && parsedUser.username) {
            DUMMY_USER_DATA.username = parsedUser.username;
        }
        if (parsedUser && parsedUser.id && parsedUser.username) {
           setUser(parsedUser);
        } else {
          localStorage.removeItem(USER_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error("Error reading user session from localStorage:", error);
      localStorage.removeItem(USER_SESSION_KEY); 
    }
    setIsLoadingAuth(false);
  }, []);

  const login = useCallback(async (usernameInput: string, passwordInput: string, t?: (key: string) => string): Promise<boolean> => {
    setIsLoadingAuth(true);
    setAuthError(null);

    await new Promise(resolve => setTimeout(resolve, 500));
    
    const tFunc = t || ((key: string) => key); // Basic fallback for t

    // Use the potentially updated DUMMY_USER_DATA for login check
    if (usernameInput === DUMMY_USER_DATA.username && passwordInput === DUMMY_USER_DATA.password) {
      const loggedInUser: AuthUser = {
        id: DUMMY_USER_DATA.id,
        username: DUMMY_USER_DATA.username,
        email: DUMMY_USER_DATA.email,
      };
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setIsLoadingAuth(false);
      return true;
    } else {
      setAuthError(tFunc('auth.errorInvalidCredentials'));
      setIsLoadingAuth(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_SESSION_KEY);
    setUser(null);
    setAuthError(null); 
  }, []);
  
  const updateUserProfile = useCallback(async (newUsername: string, t?: (key: string) => string): Promise<boolean> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    const tFunc = t || ((key: string) => key);

    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call

    if (!newUsername.trim()) {
        setAuthError(tFunc('profile.errorUsernameRequired'));
        setIsLoadingAuth(false);
        return false;
    }

    if (user) {
        const updatedUser: AuthUser = { ...user, username: newUsername };
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
        DUMMY_USER_DATA.username = newUsername; // Update our mock "database"
        setIsLoadingAuth(false);
        return true;
    }
    setAuthError(tFunc('profile.errorUserNotFound'));
    setIsLoadingAuth(false);
    return false;
  }, [user]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string, t?: (key: string) => string): Promise<boolean> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    const tFunc = t || ((key: string, vars?: object) => key);


    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call

    if (currentPassword !== DUMMY_USER_DATA.password) {
        setAuthError(tFunc('profile.errorCurrentPasswordIncorrect'));
        setIsLoadingAuth(false);
        return false;
    }
    if (newPassword.length < 6) { // Basic validation
        setAuthError(tFunc('profile.errorNewPasswordShort'));
        setIsLoadingAuth(false);
        return false;
    }

    DUMMY_USER_DATA.password = newPassword; // Update our mock "database" password
    // No need to update localStorage for password as it's not stored there, but good to know it's "changed"
    setIsLoadingAuth(false);
    return true;
  }, []);


  const startNewConversation = () => {
    // console.log("Auth hook: New conversation action triggered.");
  };

  return {
    user,
    isLoadingAuth,
    authError,
    setAuthError, 
    login,
    logout,
    updateUserProfile,
    changePassword,
    startNewConversation 
  };
};