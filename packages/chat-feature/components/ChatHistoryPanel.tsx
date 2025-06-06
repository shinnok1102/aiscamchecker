
import React from 'react';
import { ArchivedConversation } from '../../shared-types';
import { useTranslation } from '../../core-hooks/useTranslation';
import LoadingSpinner from '../../shared-ui/components/common/LoadingSpinner';

interface ChatHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ArchivedConversation[];
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isLoading?: boolean;
  currentConversationId?: string | null;
}

const HistoryIconSmall: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.24.032 3.22.094M7.094 3.5c-.717H4.747a1.737 1.737 0 0 0-1.736 1.736v.952c0 .963.784 1.736 1.736 1.736h14.506c.952 0 1.736-.773 1.736-1.736v-.952a1.737 1.737 0 0 0-1.736-1.736H16.906M14.25 5.25h-4.5" />
    </svg>
);

const CloseIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  isOpen,
  onClose,
  conversations,
  onLoadConversation,
  onDeleteConversation,
  isLoading = false,
  currentConversationId,
}) => {
  const { t, language } = useTranslation();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(language, { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 h-full
        w-full max-w-xs sm:w-72 md:w-80 lg:w-96 
        bg-white border-r border-gray-200 shadow-xl 
        transform transition-transform duration-300 ease-in-out 
        flex flex-col
        md:static md:translate-x-0 md:h-auto md:shadow-none md:border-r
        ${isOpen ? 'translate-x-0 md:flex' : '-translate-x-full md:hidden'} 
        ${!isOpen && 'hidden'}
      `}
      aria-label={t('chatHistory.panelTitle')}
      role="complementary"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-800">{t('chatHistory.panelTitle')}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1 md:hidden" 
          aria-label={t('chat.modal.close')}
          title={t('chat.modal.close')}
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {isLoading && (
        <div className="flex-grow flex justify-center items-center p-4">
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && conversations.length === 0 && (
        <p className="flex-grow text-center text-gray-500 p-6">{t('chatHistory.noHistoryFound')}</p>
      )}
      {!isLoading && conversations.length > 0 && (
        <ul className="flex-grow space-y-2 p-3 overflow-y-auto">
          {conversations.map((conv) => (
            <li 
              key={conv.id} 
              className={`p-3 rounded-lg border flex flex-col group
                          ${conv.id === currentConversationId ? 'bg-primary/10 border-primary shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:shadow-sm'}`}
            >
              <div 
                   className="flex-grow mb-1.5 cursor-pointer" 
                   onClick={() => conv.id !== currentConversationId && onLoadConversation(conv.id)}
                   onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && conv.id !== currentConversationId) onLoadConversation(conv.id);}}
                   role="button" 
                   tabIndex={conv.id !== currentConversationId ? 0 : -1} 
                   aria-disabled={conv.id === currentConversationId}
                   aria-label={t('chatHistory.loadButtonAria', {name: conv.name})}
              >
                <div className="flex items-center mb-1">
                   {conv.id === currentConversationId && <HistoryIconSmall className="w-4 h-4 mr-1.5 text-primary flex-shrink-0" />}
                  <p className={`font-semibold truncate ${conv.id === currentConversationId ? 'text-primary' : 'text-gray-800 group-hover:text-primary/80'}`} title={conv.name}>
                    {conv.name}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{t('chatHistory.lastActivity')}: {formatDate(conv.lastActivity)}</p>
              </div>
              <div className="flex-shrink-0 flex items-center justify-end">
                <button
                  onClick={() => {
                    if (window.confirm(t('chatHistory.confirmDelete', {name: conv.name}))) {
                      onDeleteConversation(conv.id);
                    }
                  }}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors"
                  aria-label={t('chatHistory.deleteButtonAria', {name: conv.name})}
                  title={t('chatHistory.deleteButtonAria', {name: conv.name})}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default ChatHistoryPanel;
