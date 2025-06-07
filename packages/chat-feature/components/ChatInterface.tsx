
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessageItem, RiskLevel, AnalysisResult, SuggestedPrompt, StagedFile, AuthUser, ArchivedConversation } from '../../shared-types';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import SuggestedPromptsDisplay from './SuggestedPromptsDisplay';
import { analyzeOrChat, fileToBase64, fileToText } from '../services/geminiService'; 
import { 
  getInitialSystemMessage, 
  getGeneralSuggestedPrompts, 
  getFileSuggestedPrompts, 
  getDefaultFileAnalysisPrompt 
} from '../../shared-constants'; 
import AlertMessage from '../../shared-ui/components/common/AlertMessage';
import { Part, Content } from '@google/genai';
import { useTranslation } from '../../core-hooks/useTranslation';
import { 
  loadSpecificConversation, 
  saveConversation,
  generateConversationName
} from '../services/chatHistoryService';

interface ChatInterfaceProps {
  authUser: AuthUser | null;
  conversationId: string | null; // ID of the conversation to load/manage
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ authUser, conversationId }) => {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInputText, setCurrentInputText] = useState<string>('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]); 
  const [chatTurnNumber, setChatTurnNumber] = useState<number>(0);

  const stagedFilesRef = useRef(stagedFiles); 
  useEffect(() => {
    stagedFilesRef.current = stagedFiles;
  }, [stagedFiles]);

  // Effect to load chat history or initialize based on conversationId
  useEffect(() => {
    setIsLoading(true);
    let loaded = false;
    if (authUser && conversationId) {
      const loadedConversation = loadSpecificConversation(authUser.id, conversationId);
      if (loadedConversation) {
        setMessages(loadedConversation.messages);
        setChatTurnNumber(loadedConversation.chatTurnNumber);
        setError(null);
        setCurrentInputText('');
        setStagedFiles([]);
        loaded = true;
      }
    }
    
    if (!loaded) {
      internalInitializeChat();
    }
    setIsLoading(false); // Ensure isLoading is false after init or load attempt
  }, [authUser, conversationId, t]); // t dependency for getInitialSystemMessage

  // Effect to save chat history when messages or chatTurnNumber change
  useEffect(() => {
    if (authUser && conversationId && messages.length > 0) {
      const initialSystemMsg = getInitialSystemMessage(t);
      if (messages.length === 1 && messages[0].sender === 'ai' && messages[0].text === initialSystemMsg && chatTurnNumber === 0) {
        const hasUserInteraction = messages.some(m => m.sender === 'user') || chatTurnNumber > 0;
        if (!hasUserInteraction) return;
      }

      const conversationToSave: ArchivedConversation = {
        id: conversationId,
        name: generateConversationName(messages, t, getInitialSystemMessage),
        lastActivity: Date.now(),
        messages: messages,
        chatTurnNumber: chatTurnNumber,
      };
      saveConversation(authUser.id, conversationToSave);
    }
  }, [messages, chatTurnNumber, authUser, conversationId, t]);


  useEffect(() => {
    return () => {
      stagedFilesRef.current.forEach(sf => {
        if (sf.previewUrl && sf.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(sf.previewUrl);
        }
      });
    };
  }, []); 

  const addMessage = useCallback((message: Omit<ChatMessageItem, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...message, id: Date.now().toString() + Math.random(), timestamp: Date.now() }]);
  }, []);

  const internalInitializeChat = useCallback(() => {
    setMessages([
      {
        id: `sys-init-${Date.now()}`,
        sender: 'ai',
        text: getInitialSystemMessage(t),
        timestamp: Date.now(),
      },
    ]);
    stagedFilesRef.current.forEach(sf => {
        if (sf.previewUrl && sf.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(sf.previewUrl);
        }
    });
    setStagedFiles([]); 
    setCurrentInputText('');
    setError(null);
    setChatTurnNumber(0); 
    // setIsLoading(false); // Moved to the loading effect to ensure it's set after any load attempt
  }, [t]);


  const handleFileSelection = async (selectedNativeFiles: File[]) => {
    if (selectedNativeFiles.length === 0) return;
    setIsLoading(true); // <--- ADDED
    setError(null);

    try { // <--- ADDED
      const newFilesProcessing: Promise<StagedFile | null>[] = selectedNativeFiles.map(async (file) => {
        try {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(t('chat.errorFileTooLarge', { fileName: file.name }));
        }
        
        let base64Data: string | undefined = undefined;
        let textContentData: string | undefined = undefined;
        let previewUrlData: string;

        const fileType = file.type || 'application/octet-stream'; 

        if (fileType.startsWith('image/')) {
          base64Data = await fileToBase64(file);
          previewUrlData = URL.createObjectURL(file);
        } else if (fileType === 'application/pdf') {
          base64Data = await fileToBase64(file); 
          previewUrlData = ''; 
        } else if (fileType === 'text/plain') {
          textContentData = await fileToText(file);
          previewUrlData = ''; 
        } else if (fileType.startsWith('audio/')) {
          base64Data = await fileToBase64(file);
          previewUrlData = '';
        } else if (fileType.startsWith('video/')) {
          base64Data = await fileToBase64(file);
          previewUrlData = '';
        }
         else {
            throw new Error(t('chat.errorUnsupportedFileType', { fileType }));
        }

        return { file, fileType, base64: base64Data, textContent: textContentData, previewUrl: previewUrlData };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Error processing file ${file.name}:`, err);
        setError(prevError => `${prevError ? prevError + '\n' : ''}${t('chat.errorProcessingFile', { fileName: file.name, error: errorMessage })}`);
        return null;
      }
    });

    const results = await Promise.all(newFilesProcessing);
    const successfullyProcessedFiles = results.filter((sf): sf is StagedFile => sf !== null);

    if (successfullyProcessedFiles.length > 0) {
      setStagedFiles(prevStaged => [...prevStaged, ...successfullyProcessedFiles]);
    }
  } finally { // <--- ADDED
    setIsLoading(false); // <--- ADDED
  }
};

  const removeStagedFile = (previewUrlToRemove: string) => {
    setStagedFiles(prevStaged => {
      const fileToRemove = prevStaged.find(sf => sf.previewUrl === previewUrlToRemove);
      if (fileToRemove && fileToRemove.previewUrl && fileToRemove.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prevStaged.filter(sf => sf.previewUrl !== previewUrlToRemove);
    });
  };

  const constructChatHistoryForGemini = (): Content[] => {
    const initialSystemMessageText = getInitialSystemMessage(t);
    const relevantMessages = messages.filter(msg => !(msg.sender === 'ai' && msg.text === initialSystemMessageText && messages.length > 1 && msg.id === messages[0].id));
      
    return relevantMessages
      .filter(msg => msg.sender === 'user' || (msg.sender === 'ai' && (msg.text || msg.analysisResult)))
      .map(msg => {
        const geminiParts: Part[] = [];
        if (msg.text) {
          geminiParts.push({ text: msg.text });
        }
        if (msg.sender === 'ai' && msg.analysisResult && msg.analysisResult.riskLevel !== null && msg.analysisResult.explanation) {
            if (!msg.text || !msg.text.includes(msg.analysisResult.explanation)) {
                 geminiParts.push({ text: `[${t('chat.riskDisplay.detailedAnalysis')}]: ${msg.analysisResult.explanation}` });
            }
        }
        return {
          role: msg.sender === 'user' ? 'user' : 'model', 
          parts: geminiParts.length > 0 ? geminiParts : [{ text: `(${t('chat.emptyContent') || 'Empty content'})` }] 
        };
      })
      .filter(content => content.parts.length > 0 && content.parts.some(p => p.text || p.inlineData)); 
  };


  const handleSendMessage = async (text: string) => {
    setError(null);
    const userText = text.trim();
    const currentStagedFiles = [...stagedFiles]; 

    if (!userText && currentStagedFiles.length === 0) {
      setError(t('chat.errorNoInput'));
      return;
    }

    const userMessageFilesForDisplay = currentStagedFiles.map(sf => ({
        name: sf.file.name,
        type: sf.fileType,
        base64: (sf.fileType.startsWith('image/') || sf.fileType === 'application/pdf' || sf.fileType.startsWith('audio/') || sf.fileType.startsWith('video/')) ? sf.base64 : undefined, 
        previewUrl: sf.previewUrl, 
        textContent: sf.textContent 
    }));
    
    const messageTextForUser = userText || (currentStagedFiles.length > 0 ? t('chat.stagedFiles', { count: currentStagedFiles.length.toString() }) : undefined);
    
    setMessages(prevMessages => {
      if (prevMessages.length === 1 && prevMessages[0].sender === 'ai' && prevMessages[0].text === getInitialSystemMessage(t)) {
        return [{
          sender: 'user',
          text: messageTextForUser,
          inputFiles: userMessageFilesForDisplay.length > 0 ? userMessageFilesForDisplay : undefined,
          id: Date.now().toString() + Math.random(), 
          timestamp: Date.now()
        }];
      }
      return [...prevMessages, {
        sender: 'user',
        text: messageTextForUser,
        inputFiles: userMessageFilesForDisplay.length > 0 ? userMessageFilesForDisplay : undefined,
        id: Date.now().toString() + Math.random(), 
        timestamp: Date.now()
      }];
    });
    
    const currentTurnNumber = chatTurnNumber;
    setChatTurnNumber(prev => prev + 1); 

    setCurrentInputText('');
    setStagedFiles([]); 

    setIsLoading(true);
    addMessage({ sender: 'ai', isTyping: true, text: t('chat.typing') });

    try {
      const currentTurnParts: Part[] = [];
      let actualUserQueryForPrompt = userText;

      if (!userText && currentStagedFiles.length > 0) {
        actualUserQueryForPrompt = getDefaultFileAnalysisPrompt(t); 
      }
      
      if(actualUserQueryForPrompt) {
        currentTurnParts.push({ text: actualUserQueryForPrompt });
      }

      for (const sf of currentStagedFiles) {
        if ((sf.fileType.startsWith('image/') || sf.fileType === 'application/pdf' || sf.fileType.startsWith('audio/') || sf.fileType.startsWith('video/')) && sf.base64) {
          currentTurnParts.push({ inlineData: { mimeType: sf.fileType, data: sf.base64 } });
        } else if (sf.fileType === 'text/plain' && sf.textContent) {
          if (currentTurnParts.length > 0 || currentStagedFiles.length > 1) {
             currentTurnParts.push({text: `\n\n--- ${t('chat.fileContentTitle', { fileName: sf.file.name })} ---`});
          }
          currentTurnParts.push({ text: sf.textContent });
           if (currentTurnParts.length > 0 || currentStagedFiles.length > 1) {
             currentTurnParts.push({text: `--- ${t('chat.fileContentEnd', { fileName: sf.file.name })} ---`});
          }
        }
      }
      
      if (currentTurnParts.length === 0) {
         throw new Error(t('chat.errorNoContentToSend'));
      }
      
      const isFollowUp = currentTurnNumber >= 1 || (messages.length > 1 && messages[0].sender === 'user');
      const chatHistory = isFollowUp ? constructChatHistoryForGemini() : undefined;
      
      const aiResponse = await analyzeOrChat(
        currentTurnParts, 
        actualUserQueryForPrompt, 
        currentStagedFiles.map(sf => sf.fileType),
        isFollowUp,
        chatHistory,
        language, 
        t 
      );
      
      setMessages(prev => prev.filter(m => !m.isTyping));

      if ('riskLevel' in aiResponse) { 
        const analysis = aiResponse as AnalysisResult;
        addMessage({ sender: 'ai', analysisResult: analysis });
        if (analysis.riskLevel === RiskLevel.UNKNOWN && analysis.explanation.startsWith(t('errors.errorPrefix') || "Lỗi")) {
          setError(analysis.explanation);
        }
      } else { 
        const conversationalResponse = aiResponse as { text: string; groundingSources?: any[] };
        const messageToAdd: Omit<ChatMessageItem, 'id' | 'timestamp'> = {
            sender: 'ai',
            text: conversationalResponse.text,
        };
        if (conversationalResponse.groundingSources && conversationalResponse.groundingSources.length > 0) {
            messageToAdd.analysisResult = { 
                riskLevel: null, 
                explanation: '', 
                suggestions: [],
                groundingSources: conversationalResponse.groundingSources
            };
        }
        addMessage(messageToAdd);
      }

    } catch (err) {
      console.error("Error during API call:", err);
      const errorMsg = err instanceof Error ? err.message : t('chat.errorAIApi');
      setMessages(prev => prev.filter(m => !m.isTyping));
      addMessage({ sender: 'ai', text: `${t('chat.errorPrefix') || 'Xin lỗi, tôi gặp sự cố:'} ${errorMsg}` });
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      currentStagedFiles.forEach(sf => {
        if (sf.previewUrl && sf.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(sf.previewUrl);
        }
      });
    }
  };

  const handlePromptClick = (prompt: SuggestedPrompt) => {
    if (prompt.isForFile && stagedFilesRef.current.length === 0) {
      setError(t('chat.suggestedPrompts.errorFilePrompt'));
      return;
    }
    setCurrentInputText(prompt.text);
  };
  
  const getSuggestedPromptsList = () => {
    if (isLoading) return [];

    const initialSystemMessageText = getInitialSystemMessage(t);
    const isInitialState = messages.length <= 1 && (messages.length === 0 || messages[0].text === initialSystemMessageText);

    if (isInitialState && chatTurnNumber === 0) {
        return [];
    }
    
    if (stagedFilesRef.current.length > 0) {
        return getFileSuggestedPrompts(t);
    }
    
    return getGeneralSuggestedPrompts(t);
  };

  return (
    <>
      {error && (
        <div className="p-2 sticky top-0 z-10 bg-red-100/90 backdrop-blur-sm rounded-b-md">
          <AlertMessage type="error" title={t('errors.errorTitle') || "Thông báo lỗi"} message={error} />
        </div>
      )}
      <ChatWindow messages={messages} />
      <SuggestedPromptsDisplay
        prompts={getSuggestedPromptsList()}
        onPromptClick={handlePromptClick}
        disabled={isLoading}
      />
      <ChatInput
        onSendMessage={handleSendMessage}
        onFileSelection={handleFileSelection} 
        onRemoveStagedFile={removeStagedFile} 
        stagedFiles={stagedFiles} 
        isLoading={isLoading}
        currentText={currentInputText}
        setCurrentText={setCurrentInputText}
        setError={setError}
      />
    </>
  );
};

export default ChatInterface;
