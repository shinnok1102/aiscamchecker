
import React, { useState, useEffect } from 'react';
import AlertMessage from '../../shared-ui/components/common/AlertMessage';
import { useTranslation } from '../../core-hooks/useTranslation';
import { useAuth } from '../hooks/useAuth'; // To pass 't' to login

interface LoginFormProps {
  onLoginSubmit: ReturnType<typeof useAuth>['login']; // Use the type from useAuth
  onLoginSuccess: () => void;
  authError: string | null;
  setAuthErrorExt: (error: string | null) => void; 
  isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSubmit, onLoginSuccess, authError, setAuthErrorExt, isLoading }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formSpecificError, setFormSpecificError] = useState<string | null>(null);

  useEffect(() => {
    if (username || password) { 
        setAuthErrorExt(null);
        setFormSpecificError(null);
    }
  }, [username, password, setAuthErrorExt]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSpecificError(null); 
    setAuthErrorExt(null); 

    if (!username.trim() || !password.trim()) {
      setFormSpecificError(t('loginForm.emptyFields'));
      return;
    }

    // Pass `t` to the login function from useAuth if it's designed to accept it
    // For this example, useAuth's login was updated to accept `t`
    const success = await onLoginSubmit(username, password, t);
    if (success) {
      onLoginSuccess();
    }
  };

  const displayError = authError || formSpecificError;

  return (
    <form onSubmit={handleSubmit} id="login-form" className="space-y-6 p-2">
      {displayError && (
          <AlertMessage type="error" message={displayError} title={t('loginForm.errorTitle')} />
      )}
      <div>
        <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t('loginForm.usernameLabel')}
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-50"
          autoComplete="username"
        />
      </div>
      <div>
        <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t('loginForm.passwordLabel')}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-50"
          autoComplete="current-password"
        />
      </div>
      <div className="text-xs text-gray-500">
        <p>{t('loginForm.dummyAccountInfo')}</p>
        <p>{t('loginForm.dummyUsername', { username: 'testuser' })}</p>
        <p>{t('loginForm.dummyPassword', { password: 'password123' })}</p>
      </div>
    </form>
  );
};

export default LoginForm;
