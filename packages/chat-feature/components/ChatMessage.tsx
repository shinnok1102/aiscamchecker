
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessageItem, RiskLevel } from '../../shared-types'; 
import RiskDisplay from '../../shared-ui/components/common/RiskDisplay';  
import LoadingSpinner from '../../shared-ui/components/common/LoadingSpinner'; 
import DivineEyeIcon from '../../shared-ui/components/icons/DivineEyeIcon'; 
import { useTranslation } from '../../core-hooks/useTranslation';

interface ChatMessageProps {
  message: ChatMessageItem;
}

const UserIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
  </svg>
);

const SpeakerPlayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.007 9.007 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
);

const SpeakerStopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-4 h-4"}>
        <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
    </svg>
);


type SingleInputFileType = NonNullable<ChatMessageItem['inputFiles']>[0];

const FileDisplayItem: React.FC<{file: SingleInputFileType}> = ({ file }) => {
  const { t } = useTranslation();
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const isText = file.type === 'text/plain';
  const isAudio = file.type.startsWith('audio/');
  const isVideo = file.type.startsWith('video/');


  if (isImage && file.previewUrl) {
    return (
      <img 
        src={file.previewUrl} 
        alt={t('chat.fileDisplay.previewAlt', { fileName: file.name })}
        className="max-w-full h-auto rounded-lg max-h-40 sm:max-h-48 object-contain border border-gray-300" 
      />
    );
  }

  let icon;
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-700';

  if (isPdf) {
    icon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
    bgColor = 'bg-red-50';
    textColor = 'text-red-600';
  } else if (isText) {
    icon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h4.5m-4.5 0H5.625c-.621 0-1.125.504-1.125 1.125v1.125c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
    bgColor = 'bg-blue-50';
    textColor = 'text-blue-600';
  } else if (isAudio) {
    icon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>;
    bgColor = 'bg-purple-50';
    textColor = 'text-purple-600';
  } else if (isVideo) {
    icon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" /></svg>;
    bgColor = 'bg-indigo-50';
    textColor = 'text-indigo-600';
  }
   else { 
    icon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 12h6M9 15h6M9 18h6M5.625 5.25h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>;
  }

  return (
    <div className={`flex items-center p-2 rounded-lg border ${bgColor} ${textColor} min-w-[150px] max-w-[200px]`}>
      <div className="flex-shrink-0 mr-2">{icon}</div>
      <span className="text-xs font-medium truncate" title={file.name}>{file.name}</span>
    </div>
  );
}


const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { t, language } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isUser = message.sender === 'user';
  const isAi = message.sender === 'ai';

  const messageBubbleClasses = isUser
    ? 'bg-primary text-white rounded-l-xl rounded-tr-xl self-end'
    : 'bg-gray-200 text-neutral-800 rounded-r-xl rounded-tl-xl self-start';
  
  const messageContainerClasses = isUser 
    ? 'flex justify-end' 
    : 'flex justify-start';

  const iconContainerClasses = isUser
    ? 'ml-2 bg-primary rounded-full p-1.5 shadow-sm'
    : 'mr-2 bg-secondary rounded-full p-1.5 shadow-sm';

  const Icon = isUser ? UserIcon : DivineEyeIcon;

  const handleSpeakMessage = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      alert(t('chat.tts.errorNotSupported'));
      return;
    }

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = message.text || message.analysisResult?.explanation || '';
    if (!textToSpeak.trim()) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language; 
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error('SpeechSynthesisErrorEvent Details: ', { 
          error: event.error, 
          type: typeof event.error,
          fullEventObject: event // For more comprehensive debugging if needed
      });

      let errorForAlert: string;

      if (event && event.error && typeof event.error === 'string') {
        const trimmedError = event.error.trim();
        if (trimmedError && trimmedError.toLowerCase() !== '[object object]') {
          errorForAlert = trimmedError;
        } else {
          if (trimmedError.toLowerCase() === '[object object]') {
            console.warn('SpeechSynthesis API reported event.error as the literal string "[object Object]". Using a generic error detail for the alert.');
          } else { // Empty string
             console.warn('SpeechSynthesis API reported event.error as an empty string. Using a generic error detail for the alert.');
          }
          errorForAlert = t('chat.tts.detailsUnavailable'); 
        }
      } else {
        console.warn(`SpeechSynthesis API event.error was not a valid string (type: ${typeof event?.error}, value: ${event?.error}). Using a generic error detail for the alert.`);
        errorForAlert = t('chat.tts.detailsUnavailable');
      }
      
      alert(t('chat.tts.errorGeneric', { error: errorForAlert }));
      setIsSpeaking(false);
    };
    
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);

  }, [message, language, t, isSpeaking]);

  useEffect(() => {
    return () => {
      if (utteranceRef.current && speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      setIsSpeaking(false); 
    };
  }, []);


  const canSpeak = isAi && (!!message.text?.trim() || !!message.analysisResult?.explanation?.trim());


  return (
    <div className={`flex items-end space-x-2 ${messageContainerClasses}`}>
      {!isUser && (
        <div className={`${iconContainerClasses} flex-shrink-0 self-start mt-1`}>
          <Icon />
        </div>
      )}
      <div className={`max-w-[80%] sm:max-w-[75%] md:max-w-[70%] `}>
        <div className={`${messageBubbleClasses} p-3 shadow-md`}>
          {message.isTyping && (
            <div className="flex items-center space-x-1.5">
              <LoadingSpinner size="sm" />
              <span className="text-sm italic">{message.text || t('chat.typing')}</span>
            </div>
          )}

          {message.text && !message.isTyping && (
            <p className="whitespace-pre-wrap text-sm sm:text-base">{message.text}</p>
          )}
          
          {message.inputFiles && message.inputFiles.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.inputFiles.map((file, index) => (
                <FileDisplayItem key={`${file.name}-${index}`} file={file} />
              ))}
            </div>
          )}

          {message.analysisResult && (
            <div className="mt-3 pt-3 border-t border-white/30">
              <RiskDisplay result={message.analysisResult} isInsideChat={true} />
            </div>
          )}

          {canSpeak && 'speechSynthesis' in window && (
            <button
              onClick={handleSpeakMessage}
              className={`mt-2 p-1 rounded-full transition-colors duration-150 
                ${isSpeaking 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : (isUser ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700') }`}
              aria-label={isSpeaking ? t('chat.tts.stopSpeaking') : t('chat.tts.speakMessage')}
              title={isSpeaking ? t('chat.tts.stopSpeaking') : t('chat.tts.speakMessage')}
            >
              {isSpeaking ? <SpeakerStopIcon className="w-4 h-4" /> : <SpeakerPlayIcon className="w-4 h-4" />}
            </button>
          )}
        </div>
        <p className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
        <div className={`${iconContainerClasses} flex-shrink-0`}>
          <Icon />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
