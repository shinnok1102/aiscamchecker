
import React from 'react';
import Modal from '../../shared-ui/components/common/Modal';
import { ArchivedConversation } from '../../shared-types';
import { useTranslation } from '../../core-hooks/useTranslation';
import LoadingSpinner from '../../shared-ui/components/common/LoadingSpinner';

interface ChatHistoryModalProps {
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


const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
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
    <Modal title={t('chatHistory.modalTitle')} show={isOpen} onClose={onClose}>
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && conversations.length === 0 && (
        <p className="text-center text-gray-500 py-6">{t('chatHistory.noHistoryFound')}</p>
      )}
      {!isLoading && conversations.length > 0 && (
        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {conversations.map((conv) => (
            <li 
              key={conv.id} 
              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0
                          ${conv.id === currentConversationId ? 'bg-primary/10 border-primary' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
            >
              <div className="flex-grow">
                <div className="flex items-center mb-1">
                   {conv.id === currentConversationId && <HistoryIconSmall className="w-4 h-4 mr-1.5 text-primary flex-shrink-0" />}
                  <p className={`font-semibold truncate ${conv.id === currentConversationId ? 'text-primary' : 'text-gray-800'}`} title={conv.name}>
                    {conv.name}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{t('chatHistory.lastActivity')}: {formatDate(conv.lastActivity)}</p>
              </div>
              <div className="flex-shrink-0 flex space-x-2 mt-2 sm:mt-0">
                <button
                  onClick={() => onLoadConversation(conv.id)}
                  disabled={conv.id === currentConversationId}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-teal-700 rounded-md shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  aria-label={t('chatHistory.loadButtonAria', {name: conv.name})}
                >
                  {t('chatHistory.loadButton')}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(t('chatHistory.confirmDelete', {name: conv.name}))) {
                      onDeleteConversation(conv.id);
                    }
                  }}
                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
                  aria-label={t('chatHistory.deleteButtonAria', {name: conv.name})}
                  title={t('chatHistory.deleteButtonAria', {name: conv.name})}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default ChatHistoryModal;
