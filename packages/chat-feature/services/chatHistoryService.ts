
import { ChatMessageItem, AuthUser, ArchivedConversation, ChatMessageItemFile } from '../../shared-types';
import type { useTranslation } from '../../core-hooks/useTranslation';

type TFunction = ReturnType<typeof useTranslation>['t'];

const CHAT_HISTORY_LIST_KEY_PREFIX = 'chatHistoryList_';
const MAX_SAVED_CONVERSATIONS = 10; // Max number of conversations to keep per user

// Sanitizes inputFiles in messages before saving:
const sanitizeMessagesForStorage = (messages: ChatMessageItem[]): ChatMessageItem[] => {
  return messages.map(msg => {
    if (!msg.inputFiles || msg.inputFiles.length === 0) {
      return msg;
    }
    const sanitizedInputFiles = msg.inputFiles.map(file => {
      const { previewUrl, ...restOfFile } = file;
      const fileToSave: Partial<ChatMessageItemFile> = { ...restOfFile };
      if (previewUrl && !previewUrl.startsWith('blob:')) {
        fileToSave.previewUrl = previewUrl;
      }
      return fileToSave as ChatMessageItemFile;
    });
    return { ...msg, inputFiles: sanitizedInputFiles };
  });
};

// Restores/Recreates previewUrls for loaded messages
const hydrateMessagesAfterLoad = (messages: ChatMessageItem[]): ChatMessageItem[] => {
  return messages.map(msg => {
    if (!msg.inputFiles || msg.inputFiles.length === 0) {
      return msg;
    }
    const hydratedInputFiles = msg.inputFiles.map(file => {
      let newPreviewUrl = file.previewUrl;
      if (file.type.startsWith('image/') && file.base64 && (!file.previewUrl || file.previewUrl.startsWith('blob:'))) {
        newPreviewUrl = `data:${file.type};base64,${file.base64}`;
      } else if (file.previewUrl && file.previewUrl.startsWith('blob:')) {
        newPreviewUrl = undefined;
      }
      return { ...file, previewUrl: newPreviewUrl };
    });
    return { ...msg, inputFiles: hydratedInputFiles };
  });
};

export const generateConversationName = (messages: ChatMessageItem[], t: TFunction, getInitialSystemMessageKeyed: (t:TFunction)=>string ): string => {
  const initialSystemMessageText = getInitialSystemMessageKeyed(t);
  const firstUserMessage = messages.find(m => m.sender === 'user' && (m.text?.trim() || (m.inputFiles && m.inputFiles.length > 0)));

  if (firstUserMessage) {
    const textIsPresent = firstUserMessage.text && firstUserMessage.text.trim();
    const filesArePresent = firstUserMessage.inputFiles && firstUserMessage.inputFiles.length > 0;
    
    let isTextGenericFileMessage = false;
    if (textIsPresent && filesArePresent) {
        // Construct the generic "files staged" message for comparison based on the actual number of files
        const genericFileStagingMessageForComparison = t('chat.stagedFiles', { count: firstUserMessage.inputFiles!.length.toString() });
        if (firstUserMessage.text!.trim() === genericFileStagingMessageForComparison) {
            isTextGenericFileMessage = true;
        }
    }

    // If files are present AND (text is not present OR text is the generic file message), use file-based name.
    if (filesArePresent && (!textIsPresent || isTextGenericFileMessage)) {
        return t('chatHistory.fileChatName', { 
            count: firstUserMessage.inputFiles!.length.toString(), // Pass count as string for simple replacement
            fileName: firstUserMessage.inputFiles![0].name 
        });
    } 
    // Else (text is present AND it's NOT the generic file message), use text for title.
    else if (textIsPresent && !isTextGenericFileMessage) {
        const textForTitle = firstUserMessage.text!.trim();
        const words = textForTitle.split(' ');
        const needsEllipsisDueToWordCount = words.length > 5;
        
        let titleCandidate = words.slice(0, 5).join(' ');
        const MAX_TEXT_TITLE_LENGTH = 35; 

        if (titleCandidate.length > MAX_TEXT_TITLE_LENGTH) {
            titleCandidate = titleCandidate.substring(0, MAX_TEXT_TITLE_LENGTH - 3) + "...";
        } else if (needsEllipsisDueToWordCount && titleCandidate.length + 3 <= MAX_TEXT_TITLE_LENGTH) { // Add ellipsis if space allows
            titleCandidate += "...";
        }
        return titleCandidate;
    }
  }
  
  const relevantMessages = messages.filter(m => !(m.sender ==='ai' && m.text === initialSystemMessageText));
  if (relevantMessages.length === 0 || (relevantMessages.length === 1 && relevantMessages[0].sender === 'ai')) {
     return t('chatHistory.newChatName', { time: new Date().toLocaleTimeString(t('app.localeCode') || 'en-US', { hour: '2-digit', minute: '2-digit' }) });
  }

  return t('chatHistory.untitledChatName', { time: new Date(messages[messages.length-1].timestamp).toLocaleTimeString(t('app.localeCode') || 'en-US', { hour: '2-digit', minute: '2-digit' }) });
};


export const loadConversationList = (userId: string): ArchivedConversation[] => {
  if (!userId) return [];
  try {
    const storedList = localStorage.getItem(`${CHAT_HISTORY_LIST_KEY_PREFIX}${userId}`);
    if (storedList) {
      const parsedList: ArchivedConversation[] = JSON.parse(storedList);
      if (Array.isArray(parsedList)) {
        return parsedList.map(conv => ({
          ...conv,
          messages: hydrateMessagesAfterLoad(conv.messages)
        })).sort((a, b) => b.lastActivity - a.lastActivity); 
      }
    }
  } catch (error) {
    console.error("Error loading conversation list from localStorage:", error);
  }
  return [];
};

export const loadSpecificConversation = (userId: string, conversationId: string): ArchivedConversation | null => {
  if (!userId || !conversationId) return null;
  const conversationList = loadConversationList(userId);
  const conversation = conversationList.find(c => c.id === conversationId);
  if (conversation) {
    return conversation;
  }
  return null;
};

export const saveConversation = (userId: string, conversationToSave: ArchivedConversation): void => {
  if (!userId || !conversationToSave || !conversationToSave.id) return;
  try {
    let conversationList = loadConversationList(userId); 
    
    const sanitizedConversationToSave = {
      ...conversationToSave,
      messages: sanitizeMessagesForStorage(conversationToSave.messages)
    };

    const existingIndex = conversationList.findIndex(c => c.id === sanitizedConversationToSave.id);

    if (existingIndex > -1) {
      conversationList[existingIndex] = sanitizedConversationToSave;
    } else {
      conversationList.push(sanitizedConversationToSave);
    }

    conversationList.sort((a, b) => b.lastActivity - a.lastActivity);

    if (conversationList.length > MAX_SAVED_CONVERSATIONS) {
      conversationList = conversationList.slice(0, MAX_SAVED_CONVERSATIONS);
    }
    
    localStorage.setItem(`${CHAT_HISTORY_LIST_KEY_PREFIX}${userId}`, JSON.stringify(conversationList));

  } catch (error) {
    console.error("Error saving conversation to localStorage:", error);
  }
};

export const deleteConversation = (userId: string, conversationId: string): void => {
  if (!userId || !conversationId) return;
  try {
    let conversationList = loadConversationList(userId);
    conversationList = conversationList.filter(c => c.id !== conversationId);
    localStorage.setItem(`${CHAT_HISTORY_LIST_KEY_PREFIX}${userId}`, JSON.stringify(conversationList));
  } catch (error) {
    console.error("Error deleting conversation from localStorage:", error);
  }
};

export const clearAllChatHistory = (userId: string): void => {
  if (!userId) return;
  try {
    localStorage.removeItem(`${CHAT_HISTORY_LIST_KEY_PREFIX}${userId}`);
  } catch (error) {
    console.error("Error clearing all chat history from localStorage:", error);
  }
};