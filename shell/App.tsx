
import React, { useState, useCallback, useEffect } from 'react';
import Header from './Header';
import ChatInterface from '../packages/chat-feature/components/ChatInterface';
import { useAuth } from '../packages/auth-feature/hooks/useAuth';
import LoginForm from '../packages/auth-feature/components/LoginForm'; 
import ProfileModal from '../packages/auth-feature/components/ProfileModal';
import ChatHistoryPanel from '../packages/chat-feature/components/ChatHistoryPanel'; 
import Modal from '../packages/shared-ui/components/common/Modal'; 
import LoadingSpinner from '../packages/shared-ui/components/common/LoadingSpinner';
import AlertMessage from '../packages/shared-ui/components/common/AlertMessage';
import { useTranslation } from '../packages/core-hooks/useTranslation';
import { 
  loadConversationList, 
  deleteConversation as deleteConversationFromService,
  clearAllChatHistory
} from '../packages/chat-feature/services/chatHistoryService';
import { ArchivedConversation } from '../packages/shared-types';

const generateNewUniqueId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  const { t, language, isLoaded: i18nLoaded } = useTranslation();
  const {
    user,
    isLoadingAuth,
    authError,
    setAuthError,
    login,
    logout,
    updateUserProfile,
    changePassword
  } = useAuth();

  const [chatInterfaceKey, setChatInterfaceKey] = useState<number>(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState<boolean>(false);
  const [chatHistoryList, setChatHistoryList] = useState<ArchivedConversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);


  useEffect(() => {
    if (i18nLoaded) {
      document.title = t('app.title');
      const htmlElement = document.documentElement;
      if (htmlElement) {
        htmlElement.lang = language;
      }
    }
  }, [t, language, i18nLoaded]);

  useEffect(() => {
    setIsLoadingHistory(true);
    if (user) {
      const history = loadConversationList(user.id);
      setChatHistoryList(history);
      if (history.length > 0) {
        setCurrentConversationId(history[0].id);
      } else {
        setCurrentConversationId(generateNewUniqueId());
      }
    } else {
      setCurrentConversationId(null); // Guest user or logged out
      setChatHistoryList([]);
    }
    setChatInterfaceKey(prev => prev + 1); // Force re-mount of ChatInterface
    setIsLoadingHistory(false);
  }, [user]); // Only depends on user


  const handleStartNewChat = useCallback(() => {
    if (user) {
      const newId = generateNewUniqueId();
      setCurrentConversationId(newId);
    } else {
      setCurrentConversationId(null); // For guest or if strategy changes
    }
    setChatInterfaceKey(prevKey => prevKey + 1);
    if (isHistoryPanelOpen) setIsHistoryPanelOpen(false); 
  }, [user, isHistoryPanelOpen]);

  const handleOpenLoginModal = () => {
    setAuthError(null); 
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
    setAuthError(null); 
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    // User effect will handle loading history and setting conversation ID
  };

  const handleOpenProfileModal = () => {
    setAuthError(null);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setAuthError(null);
  };

  const handleToggleHistoryPanel = async () => {
    if (!isHistoryPanelOpen && user) { 
      setIsLoadingHistory(true);
      const history = loadConversationList(user.id);
      setChatHistoryList(history);
      setIsLoadingHistory(false);
    }
    setIsHistoryPanelOpen(prev => !prev);
  };

  const handleLoadConversationFromHistory = (conversationId: string) => {
    if (user && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
      setChatInterfaceKey(prevKey => prevKey + 1);
    }
    setIsHistoryPanelOpen(false); 
  };

  const handleDeleteConversationFromHistory = (conversationIdToDelete: string) => {
    if (user) {
      setIsLoadingHistory(true);
      deleteConversationFromService(user.id, conversationIdToDelete);
      const updatedHistory = loadConversationList(user.id);
      setChatHistoryList(updatedHistory);
      
      if (conversationIdToDelete === currentConversationId) {
        if (updatedHistory.length > 0) {
          setCurrentConversationId(updatedHistory[0].id);
        } else {
          setCurrentConversationId(generateNewUniqueId());
        }
        setChatInterfaceKey(prevKey => prevKey + 1);
      }
      setIsLoadingHistory(false);
    }
  };
  
  if (!i18nLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-sky-100 flex flex-col text-neutral-800">
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const finalChatInterfaceKey = `chat-interface-${user ? user.id : 'guest'}-${currentConversationId || 'new'}-${chatInterfaceKey}`;
  const showInitialLoading = (isLoadingAuth && !isLoginModalOpen && !user && !isProfileModalOpen) || (user && currentConversationId === null && isLoadingHistory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-sky-100 flex flex-col text-neutral-800 h-screen">
      <Header
        onStartNewChat={handleStartNewChat}
        authUser={user}
        onLoginRequest={handleOpenLoginModal}
        onLogout={logout}
        isLoadingAuth={isLoadingAuth}
        onOpenProfileModal={handleOpenProfileModal}
        onToggleHistoryPanel={handleToggleHistoryPanel} 
      />
      <div className="flex flex-1 overflow-hidden"> 
        {user && (
          <ChatHistoryPanel
            isOpen={isHistoryPanelOpen}
            onClose={() => setIsHistoryPanelOpen(false)}
            conversations={chatHistoryList}
            onLoadConversation={handleLoadConversationFromHistory}
            onDeleteConversation={handleDeleteConversationFromHistory}
            isLoading={isLoadingHistory}
            currentConversationId={currentConversationId}
          />
        )}
        <main className="flex-1 flex flex-col overflow-hidden"> 
          <div className="container mx-auto p-0 sm:p-4 md:p-6 w-full max-w-3xl flex flex-col flex-grow h-full overflow-hidden">
             {showInitialLoading ? ( 
              <div className="flex-grow flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <ChatInterface 
                key={finalChatInterfaceKey} 
                authUser={user}
                conversationId={currentConversationId}
              />
            )}
          </div>
        </main>
      </div>
      <footer className="w-full text-center p-3 text-xs sm:text-sm text-gray-500 bg-gray-100 border-t border-gray-200">
        {t('app.madeBy')}
      </footer>

      {isLoginModalOpen && !user && ( 
        <Modal 
          title={t('loginForm.title')} 
          show={isLoginModalOpen} 
          onClose={handleCloseLoginModal}
          footer={
            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                form="login-form" 
                disabled={isLoadingAuth}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-teal-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {isLoadingAuth ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  t('loginForm.loginButton')
                )}
              </button>
              <button
                type="button"
                onClick={handleCloseLoginModal}
                disabled={isLoadingAuth}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
              >
                {t('loginForm.cancelButton')}
              </button>
            </div>
          }
        >
          <LoginForm
            onLoginSubmit={login}
            onLoginSuccess={handleLoginSuccess}
            authError={authError}
            setAuthErrorExt={setAuthError}
            isLoading={isLoadingAuth}
          />
        </Modal>
      )}

      {isProfileModalOpen && user && (
        <ProfileModal
          user={user}
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
          onUpdateProfile={updateUserProfile}
          onChangePassword={changePassword}
          authError={authError}
          setAuthErrorExt={setAuthError}
          isLoading={isLoadingAuth}
        />
      )}
    </div>
  );
};

export default App;
