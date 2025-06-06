
import React, { useState, useCallback, useEffect } from 'react';
import Header from './Header';
// Component for displaying the main chat interaction area
import ChatInterface from '../packages/chat-feature/components/ChatInterface';
import { useAuth } from '../packages/auth-feature/hooks/useAuth';
import LoginForm from '../packages/auth-feature/components/LoginForm';
import ProfileModal from '../packages/auth-feature/components/ProfileModal';
import ChatHistoryPanel from '../packages/chat-feature/components/ChatHistoryPanel';
import Modal from '../packages/shared-ui/components/common/Modal';
import LoadingSpinner from '../packages/shared-ui/components/common/LoadingSpinner';
// AlertMessage is imported but not used in this file. Consider removing if not planned for future use.
// import AlertMessage from '../packages/shared-ui/components/common/AlertMessage';
// Hook for internationalization
import { useTranslation } from '../packages/core-hooks/useTranslation';
import {
  loadConversationList,
  deleteConversation as deleteConversationFromService,
  clearAllChatHistory // clearAllChatHistory is imported but not used. Consider removing.
} from '../packages/chat-feature/services/chatHistoryService';
// Type definition for archived conversations
import { ArchivedConversation } from '../packages/shared-types';

// Generates a unique ID for new conversations.
// Combines timestamp with a random string for better uniqueness.
const generateNewUniqueId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  // i18n hook for localization, t is the translation function, language is the current language, i18nLoaded indicates if translations are loaded
  const { t, language, isLoaded: i18nLoaded } = useTranslation();
  // Authentication hook, provides user object, loading states, error states, and auth functions
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

  // State for managing the key of the ChatInterface component, used to force re-mounts.
  const [chatInterfaceKey, setChatInterfaceKey] = useState<number>(0);
  // State for controlling the visibility of the login modal.
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  // State for controlling the visibility of the profile modal.
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  
  // State for controlling the visibility of the chat history panel.
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState<boolean>(false);
  // State for storing the list of chat conversations for the current user.
  const [chatHistoryList, setChatHistoryList] = useState<ArchivedConversation[]>([]);
  // State for indicating if the chat history is currently being loaded.
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  // State for storing the ID of the currently active conversation.
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Effect to update document title and language attribute when i18n is loaded or language changes.
  useEffect(() => {
    if (i18nLoaded) {
      document.title = t('app.title'); // Sets the document title using translated string.
      const htmlElement = document.documentElement;
      if (htmlElement) {
        htmlElement.lang = language; // Sets the lang attribute of the HTML element.
      }
    }
  }, [t, language, i18nLoaded]); // Dependencies: translation function, current language, and i18n load status.

  // Effect to load chat history and set initial conversation when the user logs in or out.
  useEffect(() => {
    setIsLoadingHistory(true);
    if (user) {
      // If a user is logged in, load their conversation list.
      const history = loadConversationList(user.id);
      setChatHistoryList(history);
      if (history.length > 0) {
        // If history exists, set the first conversation as current.
        setCurrentConversationId(history[0].id);
      } else {
        // If no history, generate a new ID for a new conversation.
        setCurrentConversationId(generateNewUniqueId());
      }
    } else {
      // If no user is logged in (guest or logged out), clear conversation ID and history.
      setCurrentConversationId(null);
      setChatHistoryList([]);
    }
    // Increment chatInterfaceKey to force a re-mount of the ChatInterface component.
    // This ensures the ChatInterface resets its internal state for the new user/conversation.
    setChatInterfaceKey(prev => prev + 1);
    setIsLoadingHistory(false);
  }, [user]); // Dependency: user object. This effect runs when the user state changes.


  // Callback to handle starting a new chat session.
  const handleStartNewChat = useCallback(() => {
    if (user) {
      // If a user is logged in, generate a new unique ID for the new conversation.
      const newId = generateNewUniqueId();
      setCurrentConversationId(newId);
    } else {
      // For guest users or if the strategy for handling guest chats changes.
      // Currently sets to null, which might mean guests don't have persistent new chats or a different UI flow.
      setCurrentConversationId(null);
    }
    // Force re-mount of ChatInterface to ensure it starts fresh for the new chat.
    setChatInterfaceKey(prevKey => prevKey + 1);
    // Close the history panel if it's open, as a new chat is being started.
    if (isHistoryPanelOpen) setIsHistoryPanelOpen(false); 
  }, [user, isHistoryPanelOpen]); // Dependencies: user object and history panel visibility state.

  // Opens the login modal and clears any existing auth errors.
  const handleOpenLoginModal = () => {
    setAuthError(null); 
    setIsLoginModalOpen(true);
  };

  // Closes the login modal and clears any auth errors.
  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
    setAuthError(null); 
  };

  // Handles successful login. Closes the login modal.
  // The useEffect hook dependent on 'user' will handle loading history and setting the conversation ID.
  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
  };

  // Opens the profile modal and clears any existing auth errors.
  const handleOpenProfileModal = () => {
    setAuthError(null);
    setIsProfileModalOpen(true);
  };

  // Closes the profile modal and clears any auth errors.
  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setAuthError(null);
  };

  // Toggles the visibility of the chat history panel.
  // If opening the panel and a user is logged in, it reloads the chat history.
  const handleToggleHistoryPanel = async () => {
    if (!isHistoryPanelOpen && user) { 
      setIsLoadingHistory(true);
      const history = loadConversationList(user.id); // Load history for the logged-in user.
      setChatHistoryList(history);
      setIsLoadingHistory(false);
    }
    setIsHistoryPanelOpen(prev => !prev); // Toggle panel visibility.
  };

  // Loads a selected conversation from the history panel into the main ChatInterface.
  const handleLoadConversationFromHistory = (conversationId: string) => {
    if (user && conversationId !== currentConversationId) {
      // Only proceed if a user is logged in and the selected conversation is different from the current one.
      setCurrentConversationId(conversationId); // Set the selected conversation as active.
      // Force re-mount of ChatInterface to load the selected conversation.
      setChatInterfaceKey(prevKey => prevKey + 1);
    }
    setIsHistoryPanelOpen(false); // Close the history panel after selection.
  };

  // Deletes a conversation from the history.
  const handleDeleteConversationFromHistory = (conversationIdToDelete: string) => {
    if (user) {
      setIsLoadingHistory(true);
      // Call service to delete the conversation.
      deleteConversationFromService(user.id, conversationIdToDelete);
      // Reload the conversation list.
      const updatedHistory = loadConversationList(user.id);
      setChatHistoryList(updatedHistory);
      
      // If the deleted conversation was the currently active one, load a different one or start a new one.
      if (conversationIdToDelete === currentConversationId) {
        if (updatedHistory.length > 0) {
          // If other conversations exist, load the first one.
          setCurrentConversationId(updatedHistory[0].id);
        } else {
          // If no conversations are left, start a new one.
          setCurrentConversationId(generateNewUniqueId());
        }
        // Force re-mount of ChatInterface.
        setChatInterfaceKey(prevKey => prevKey + 1);
      }
      setIsLoadingHistory(false);
    }
  };
  
  // Display a loading spinner if i18n translations are not yet loaded.
  // This prevents rendering the app with untranslated text or incorrect layout.
  if (!i18nLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-sky-100 flex flex-col text-neutral-800">
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Construct a unique key for the ChatInterface.
  // This key changes when user, conversationId, or the manual key state changes, forcing a re-render.
  const finalChatInterfaceKey = `chat-interface-${user ? user.id : 'guest'}-${currentConversationId || 'new'}-${chatInterfaceKey}`;

  // Determine if the initial loading spinner for the chat area should be shown.
  // This covers cases like initial auth check, or user logged in but history/conversation ID is still loading.
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
      {/* Main content area, flex layout to manage history panel and chat interface */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conditional rendering of ChatHistoryPanel only if a user is logged in */}
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
        {/* Main chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="container mx-auto p-0 sm:p-4 md:p-6 w-full max-w-3xl flex flex-col flex-grow h-full overflow-hidden">
             {/* Show loading spinner in chat area if initial data is loading */}
             {showInitialLoading ? (
              <div className="flex-grow flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              // Otherwise, render the ChatInterface
              <ChatInterface
                key={finalChatInterfaceKey} // Key to control re-renders
                authUser={user}
                conversationId={currentConversationId} // Pass current conversation ID
              />
            )}
          </div>
        </main>
      </div>
      <footer className="w-full text-center p-3 text-xs sm:text-sm text-gray-500 bg-gray-100 border-t border-gray-200">
        {t('app.madeBy')}
      </footer>

      {/* Login Modal: shown if isLoginModalOpen is true and no user is logged in */}
      {isLoginModalOpen && !user && (
        <Modal
          title={t('loginForm.title')}
          show={isLoginModalOpen}
          onClose={handleCloseLoginModal}
          footer={
            // Custom footer for the login modal with submit and cancel buttons
            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                form="login-form" // Associates button with the LoginForm
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
            setAuthErrorExt={setAuthError} // Prop to allow LoginForm to set auth errors in App state
            isLoading={isLoadingAuth}
          />
        </Modal>
      )}

      {/* Profile Modal: shown if isProfileModalOpen is true and a user is logged in */}
      {isProfileModalOpen && user && (
        <ProfileModal
          user={user}
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
          onUpdateProfile={updateUserProfile}
          onChangePassword={changePassword}
          authError={authError}
          setAuthErrorExt={setAuthError} // Prop to allow ProfileModal to set auth errors in App state
          isLoading={isLoadingAuth}
        />
      )}
    </div>
  );
};

export default App;
