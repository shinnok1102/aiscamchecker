
import React, { useState, useEffect, useRef } from 'react';
import DivineEyeIcon from '../packages/shared-ui/components/icons/DivineEyeIcon';
import RefreshIcon from '../packages/shared-ui/components/icons/RefreshIcon';
import { AuthUser } from '../packages/shared-types';
import { useTranslation } from '../packages/core-hooks/useTranslation';

interface HeaderProps {
  onStartNewChat: () => void;
  authUser: AuthUser | null;
  onLoginRequest: () => void;
  onLogout: () => void;
  isLoadingAuth: boolean;
  onOpenProfileModal: () => void;
  onToggleHistoryPanel: () => void; // Changed from onOpenChatHistoryModal
}

const LoginIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  </svg>
);

const LogoutIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

const LanguageIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
  </svg>
);

const ProfileIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const HistoryIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);


const UserAvatarPlaceholder: React.FC<{username: string, className?: string}> = ({ username, className }) => {
  const initial = username?.charAt(0).toUpperCase() || '?';
  return (
    <div className={`flex items-center justify-center rounded-full bg-secondary text-white font-semibold ${className || 'w-8 h-8 sm:w-10 sm:h-10 text-lg sm:text-xl'}`} title={username}>
      {initial}
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ onStartNewChat, authUser, onLoginRequest, onLogout, isLoadingAuth, onOpenProfileModal, onToggleHistoryPanel }) => {
  const { t, language, changeLanguage } = useTranslation();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    if (isLangDropdownOpen) setIsLangDropdownOpen(false);
  }
  const toggleLangDropdown = () => {
    setIsLangDropdownOpen(!isLangDropdownOpen);
    if (isUserDropdownOpen) setIsUserDropdownOpen(false);
  }

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setIsLangDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    if (isUserDropdownOpen || isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen, isLangDropdownOpen]);

  const handleLogout = () => {
    onLogout();
    setIsUserDropdownOpen(false); 
  }

  const handleOpenProfile = () => {
    onOpenProfileModal();
    setIsUserDropdownOpen(false);
  }

  return (
    <header className="w-full bg-gradient-to-r from-primary to-secondary shadow-lg p-4 sm:p-6 text-white sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between">
        
        <div className="relative flex-shrink-0" ref={langDropdownRef}>
            <button
              onClick={toggleLangDropdown}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-150"
              aria-label={t('header.selectLanguage')}
              title={t('header.selectLanguage')}
            >
              <LanguageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>
            {isLangDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-xl py-1 z-50 text-neutral-700">
                <button
                  onClick={() => handleLanguageChange('vi')}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${language === 'vi' ? 'font-semibold text-primary' : 'text-gray-700'} hover:bg-gray-100 focus:bg-gray-100 focus:outline-none`}
                  role="menuitem"
                  aria-label={t('header.vietnamese')}
                >
                  {t('header.vietnamese')} {language === 'vi' && <span className="ml-auto">✓</span>}
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${language === 'en' ? 'font-semibold text-primary' : 'text-gray-700'} hover:bg-gray-100 focus:bg-gray-100 focus:outline-none`}
                  role="menuitem"
                  aria-label={t('header.english')}
                >
                  {t('header.english')} {language === 'en' && <span className="ml-auto">✓</span>}
                </button>
              </div>
            )}
          </div>


        <div className="flex-grow flex justify-center items-center space-x-3 text-center">
          <DivineEyeIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white flex-shrink-0" />
          <div className="sm:text-left">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold">{t('header.mainTitle')}</h1>
            <p className="text-xs sm:text-md text-sky-100">{t('header.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {!isLoadingAuth && (
            authUser ? (
            <>
              {authUser && (
                <button
                  onClick={onToggleHistoryPanel}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors duration-150"
                  aria-label={t('header.chatHistory')}
                  title={t('header.chatHistory')}
                >
                  <HistoryIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </button>
              )}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className="rounded-full border-2 border-white hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
                  aria-label={t('header.userMenuButton')}
                  title={authUser.username}
                >
                  <UserAvatarPlaceholder username={authUser.username} className="w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-lg" />
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl py-1 z-50 text-neutral-700" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold truncate" title={authUser.username}>{authUser.username}</p>
                      {authUser.email && <p className="text-xs text-gray-500 truncate" title={authUser.email}>{authUser.email}</p>}
                    </div>
                    <button
                      onClick={handleOpenProfile}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="menuitem"
                      aria-label={t('header.profile')}
                    >
                      <ProfileIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                      {t('header.profile')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:outline-none"
                      role="menuitem"
                      aria-label={t('header.logout')}
                    >
                      <LogoutIcon className="w-4 h-4 mr-2.5" />
                      {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onLoginRequest}
              className="flex items-center text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 rounded-md bg-white/20 hover:bg-white/30 transition-colors duration-150"
              aria-label={t('header.login')}
              title={t('header.login')}
            >
              <LoginIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
              {t('header.login')}
            </button>
          )
          )}
           {isLoadingAuth && (
             <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
             </div>
           )}

          <button
            onClick={onStartNewChat}
            className="p-2 rounded-full hover:bg-white/20 transition-colors duration-150"
            aria-label={t('header.startNewChat')}
            title={t('header.startNewChat')}
          >
            <RefreshIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
