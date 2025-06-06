
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Modal from '../../shared-ui/components/common/Modal'; 
import { StagedFile } from '../../shared-types'; 
import { useTranslation } from '../../core-hooks/useTranslation';

interface ImageCaptureInstance {
  grabFrame(): Promise<ImageBitmap>;
}

interface ImageCaptureConstructor {
  new(track: MediaStreamTrack): ImageCaptureInstance;
}

declare global {
  interface Window {
    ImageCapture?: ImageCaptureConstructor;
    SpeechRecognition?: any; // For SpeechRecognition API
    webkitSpeechRecognition?: any; // For Safari/Chrome vendor prefix
  }
}

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onFileSelection: (files: File[]) => void; 
  onRemoveStagedFile: (previewUrl: string) => void; 
  stagedFiles: StagedFile[]; 
  isLoading: boolean;
  currentText: string;
  setCurrentText: React.Dispatch<React.SetStateAction<string>>;
  setError: (message: string | null) => void;
}

const FilePreviewItem: React.FC<{ fileItem: StagedFile; onRemove: (previewUrl: string) => void; disabled?: boolean }> = ({ fileItem, onRemove, disabled }) => {
  const { t } = useTranslation();
  const isImage = fileItem.fileType.startsWith('image/');
  const isPdf = fileItem.fileType === 'application/pdf';
  const isText = fileItem.fileType === 'text/plain';
  const isAudio = fileItem.fileType.startsWith('audio/');
  const isVideo = fileItem.fileType.startsWith('video/');

  let displayElement;
  if (isImage) {
    displayElement = <img src={fileItem.previewUrl} alt={t('chat.fileDisplay.previewAlt', { fileName: fileItem.file.name })} className="w-full h-full object-cover" />;
  } else if (isPdf) {
    displayElement = (
      <div className="w-full h-full flex flex-col items-center justify-center bg-red-100 text-red-700 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
        <span className="text-xs font-medium truncate max-w-full px-0.5" title={fileItem.file.name}>{fileItem.file.name}</span>
      </div>
    );
  } else if (isText) {
     displayElement = (
      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-100 text-blue-700 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h4.5m-4.5 0H5.625c-.621 0-1.125.504-1.125 1.125v1.125c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
        <span className="text-xs font-medium truncate max-w-full px-0.5" title={fileItem.file.name}>{fileItem.file.name}</span>
      </div>
    );
  } else if (isAudio) {
    displayElement = (
      <div className="w-full h-full flex flex-col items-center justify-center bg-purple-100 text-purple-700 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>
        <span className="text-xs font-medium truncate max-w-full px-0.5" title={fileItem.file.name}>{fileItem.file.name}</span>
      </div>
    );
  } else if (isVideo) {
    displayElement = (
      <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-100 text-indigo-700 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" /></svg>
        <span className="text-xs font-medium truncate max-w-full px-0.5" title={fileItem.file.name}>{fileItem.file.name}</span>
      </div>
    );
  }
   else {
     displayElement = ( 
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-700 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 12h6M9 15h6M9 18h6M5.625 5.25h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
        <span className="text-xs font-medium truncate max-w-full px-0.5" title={fileItem.file.name}>{fileItem.file.name}</span>
      </div>
    );
  }

  return (
    <div className="relative group w-20 h-20 sm:w-24 sm:h-24 border border-gray-300 rounded-md overflow-hidden shadow-sm flex-shrink-0">
      {displayElement}
      <button
        type="button"
        onClick={() => onRemove(fileItem.previewUrl)}
        disabled={disabled}
        className="absolute top-0.5 right-0.5 bg-black bg-opacity-50 text-white rounded-full p-0.5 hover:bg-opacity-75 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={t('chat.fileDisplay.removeFile', { fileName: fileItem.file.name })}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// Icon Definitions
const AttachmentIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5 sm:w-6 sm:h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.687 7.687a1.5 1.5 0 0 0 2.122 2.122l7.687-7.687-2.121-2.122Z" />
  </svg>
);

const UploadFileIcon: React.FC<{className?: string}> = ({className}) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>
);
const PhotoCameraIcon: React.FC<{className?: string}> = ({className}) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
);
 const VideoCameraIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" /></svg>
);
const ScreenshotIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3.035A3.375 3.375 0 0 1 3 13.5V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v8.25c0 1.006-.467 1.897-1.178 2.513M6.61 16.022S8.32 10.5 12 10.5s5.39 5.522 5.39 5.522" /></svg>
);

const InputMicrophoneIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5 sm:w-6 sm:h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3ZM7 11H5a7 7 0 0 0 7 7 7 7 0 0 0 7-7h-2a5 5 0 0 1-5 5 5 5 0 0 1-5-5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.5v3.5M10 22h4" />
  </svg>
);

const MicrophoneIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3ZM7 11H5a7 7 0 0 0 7 7 7 7 0 0 0 7-7h-2a5 5 0 0 1-5 5 5 5 0 0 1-5-5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.5v3.5M10 22h4" />
  </svg>
);


const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onFileSelection,
  onRemoveStagedFile,
  stagedFiles,
  isLoading,
  currentText,
  setCurrentText,
  setError
}) => {
  const { t, language } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const photoCaptureVideoRef = useRef<HTMLVideoElement>(null); 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isAudioRecordingModalOpen, setIsAudioRecordingModalOpen] = useState<boolean>(false);
  const [isAudioRecording, setIsAudioRecording] = useState<boolean>(false);
  const [audioRecordingTime, setAudioRecordingTime] = useState<number>(0);
  const audioRecordingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);

  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const liveVideoPreviewRef = useRef<HTMLVideoElement>(null);
  const recordedVideoPreviewRef = useRef<HTMLVideoElement>(null);
  const [isVideoRecordingModalOpen, setIsVideoRecordingModalOpen] = useState<boolean>(false);
  const [isVideoRecording, setIsVideoRecording] = useState<boolean>(false);
  const [videoRecordingTime, setVideoRecordingTime] = useState<number>(0);
  const videoRecordingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isVideoStarting, setIsVideoStarting] = useState<boolean>(false);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState<boolean>(false);

  const [isVoiceInputRecording, setIsVoiceInputRecording] = useState<boolean>(false);
  const speechRecognitionRef = useRef<any>(null); // SpeechRecognition instance
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  const textBeforeCurrentVoiceInputRef = useRef<string>('');


  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      const scrollHeight = textAreaRef.current.scrollHeight;
      const maxHeight = parseInt(getComputedStyle(textAreaRef.current).maxHeight, 10) || 128; 
      textAreaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [currentText]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };
    if (isAttachmentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachmentMenuOpen]);


  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentText(e.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length > 0) {
      onFileSelection(files);
    }
    if (fileInputRef.current) fileInputRef.current.value = ""; 
    setIsAttachmentMenuOpen(false);
  };

  const handleSend = () => {
    if (isLoading) return;
    if (!currentText.trim() && stagedFiles.length === 0) {
      return;
    }
    if (isVoiceInputRecording && speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        // The onend event will set isVoiceInputRecording to false
    }
    onSendMessage(currentText);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto'; 
      textAreaRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerFileInput = (acceptTypes?: string) => {
    if (fileInputRef.current) {
        fileInputRef.current.accept = acceptTypes || "image/jpeg, image/png, image/webp, application/pdf, text/plain, audio/*, video/*";
        fileInputRef.current.click();
    }
    setIsAttachmentMenuOpen(false);
  };

  const stopPhotoCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (photoCaptureVideoRef.current) {
      photoCaptureVideoRef.current.srcObject = null;
      photoCaptureVideoRef.current.load(); 
    }
    setIsCameraModalOpen(false);
    setIsCameraStarting(false);
  }, [cameraStream]);

  const startPhotoCamera = async () => {
    setError(null);
    setIsCameraStarting(true);
    setIsAttachmentMenuOpen(false); 
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setCameraStream(stream);
        setIsCameraModalOpen(true);
      } catch (err) {
        console.error("Error opening camera: ", err);
        let message = t('chat.modal.capturePhotoErrorCameraAccess');
        if (err instanceof Error) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") message = t('chat.modal.capturePhotoErrorDenied');
          else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") message = t('chat.modal.capturePhotoErrorNotFound');
          else if (err.name === "NotReadableError" || err.name === "TrackStartError") message = t('chat.modal.capturePhotoErrorNotReadable');
          else message = t('chat.modal.capturePhotoErrorGeneric', { message: err.message });
        }
        setError(message);
        if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
        setIsCameraStarting(false);
      }
    } else {
      setError(t('chat.modal.capturePhotoErrorBrowserSupport'));
      setIsCameraStarting(false);
    }
  };

  useEffect(() => {
    let videoElement: HTMLVideoElement | null = null;
    if (isCameraModalOpen && cameraStream && photoCaptureVideoRef.current) {
      videoElement = photoCaptureVideoRef.current;
      videoElement.srcObject = cameraStream;
      videoElement.onloadedmetadata = () => {
        videoElement?.play().then(() => setIsCameraStarting(false))
          .catch(playError => {
            setError(t('chat.modal.capturePhotoErrorVideoPlay', {message: playError.message}));
            setIsCameraStarting(false);
          });
      };
      videoElement.onerror = () => {
        setError(t('chat.modal.capturePhotoErrorVideoElement'));
        setIsCameraStarting(false);
      }
    } else if (!isCameraModalOpen && cameraStream) {
      stopPhotoCamera();
    }
    return () => {
      if (videoElement) {
        videoElement.onloadedmetadata = null;
        videoElement.onerror = null;
      }
    };
  }, [isCameraModalOpen, cameraStream, stopPhotoCamera, setError, t]);

  const handleCapturePhoto = () => {
    setError(null);
    if (photoCaptureVideoRef.current && canvasRef.current && cameraStream?.active) {
      const video = photoCaptureVideoRef.current;
      const canvas = canvasRef.current;
      if (video.readyState < video.HAVE_METADATA || video.videoWidth === 0) {
        setError(t('chat.modal.capturePhotoErrorNotReady'));
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) {
            const imageFile = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onFileSelection([imageFile]);
          } else setError(t('chat.modal.capturePhotoErrorCreateFile'));
          stopPhotoCamera(); 
        }, 'image/jpeg', 0.9);
      } else {
         setError(t('chat.modal.capturePhotoErrorCanvasContext'));
         stopPhotoCamera();
      }
    } else {
       setError(t('chat.modal.capturePhotoErrorInvalidConditions'));
       if (cameraStream && !cameraStream.active) stopPhotoCamera();
    }
  };
  
  useEffect(() => { 
    return () => { if (cameraStream) stopPhotoCamera(); };
  }, [cameraStream, stopPhotoCamera]);

  const handleScreenshot = async () => {
    setError(null);
    setIsAttachmentMenuOpen(false); 
    if (navigator.mediaDevices?.getDisplayMedia) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: "screen" } as any });
        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) throw new Error("Cannot get video track from screen stream.");
        
        if (!window.ImageCapture) {
            setError(t('chat.modal.screenshotErrorImageCaptureAPI'));
            videoTrack.stop();
            stream.getTracks().forEach(track => track.stop());
            return;
        }
        
        const imageCapture = new window.ImageCapture(videoTrack);
        const bitmap = await imageCapture.grabFrame();
        videoTrack.stop(); 
        stream.getTracks().forEach(track => track.stop()); 

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const context = canvas.getContext('2d');
          if (context) {
            context.drawImage(bitmap, 0, 0);
            canvas.toBlob(blob => {
              if (blob) {
                onFileSelection([new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' })]);
              } else setError(t('chat.modal.screenshotErrorCreateFile'));
            }, 'image/png');
          } else setError(t('chat.modal.screenshotErrorCanvasContext'));
        } else setError(t('chat.modal.screenshotErrorCanvas'));
      } catch (err) {
        console.error("Screenshot error: ", err);
        let msg = err instanceof Error ? err.message : t('chat.modal.screenshotErrorGeneric');
        if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) msg = t('chat.modal.screenshotErrorDenied');
        else if (err instanceof Error && err.message.includes("permissions policy")) msg = t('chat.modal.screenshotErrorPolicy');
        setError(t('chat.modal.screenshotError', {message: msg}));
      }
    } else setError(t('chat.modal.screenshotErrorDisplayMedia'));
  };

  const startAudioRecording = async () => {
    setError(null);
    setIsAttachmentMenuOpen(false);
    setRecordedAudioUrl(null);
    setRecordedAudioBlob(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const options = { mimeType: 'audio/webm;codecs=opus' }; 
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.warn(`${options.mimeType} is not supported, trying default.`);
            audioRecorderRef.current = new MediaRecorder(stream);
        } else {
            audioRecorderRef.current = new MediaRecorder(stream, options);
        }

        audioRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        audioRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: audioRecorderRef.current?.mimeType || 'audio/webm' });
          setRecordedAudioBlob(audioBlob);
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(audioUrl);
          stream.getTracks().forEach(track => track.stop()); 
          setIsAudioRecording(false);
          if (audioRecordingIntervalRef.current) clearInterval(audioRecordingIntervalRef.current);
        };

        audioRecorderRef.current.start();
        setIsAudioRecording(true);
        setIsAudioRecordingModalOpen(true);
        setAudioRecordingTime(0);
        audioRecordingIntervalRef.current = setInterval(() => {
          setAudioRecordingTime(prevTime => prevTime + 1);
        }, 1000);

      } catch (err) {
        console.error("Error starting audio recording: ", err);
        let message = t('chat.modal.audioRecordingErrorMicAccess');
        if (err instanceof Error) {
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") message = t('chat.modal.audioRecordingErrorDenied');
            else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") message = t('chat.modal.audioRecordingErrorNotFound');
            else message = t('chat.modal.audioRecordingErrorGeneric', { message: err.message });
        }
        setError(message);
        setIsAudioRecording(false);
      }
    } else {
      setError(t('chat.modal.audioRecordingErrorBrowserSupport'));
    }
  };

  const stopAudioRecording = () => {
    if (audioRecorderRef.current && isAudioRecording) {
      audioRecorderRef.current.stop();
    }
  };

  const handleConfirmRecordedAudio = () => {
    if (recordedAudioBlob) {
      const audioFile = new File([recordedAudioBlob], `audio-record-${Date.now()}.webm`, { type: recordedAudioBlob.type });
      onFileSelection([audioFile]);
    }
    closeAudioRecordingModal();
  };

  const closeAudioRecordingModal = () => {
    if (isAudioRecording) stopAudioRecording(); 
    if (audioRecordingIntervalRef.current) clearInterval(audioRecordingIntervalRef.current);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    
    setRecordedAudioUrl(null);
    setRecordedAudioBlob(null);
    setIsAudioRecordingModalOpen(false);
    setIsAudioRecording(false);
    setAudioRecordingTime(0);
    audioChunksRef.current = [];
    if(audioRecorderRef.current?.stream?.active) {
        audioRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    audioRecorderRef.current = null;
  };

  const startVideoRecording = async () => {
    setError(null);
    setIsAttachmentMenuOpen(false);
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    setIsVideoStarting(true);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setVideoStream(stream);
        videoChunksRef.current = [];
        
        const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
        let supportedMimeType = '';
        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                supportedMimeType = mimeType;
                break;
            }
        }
        if (!supportedMimeType) {
            console.warn("No preferred MIME type supported for video recording. Using default.");
            videoRecorderRef.current = new MediaRecorder(stream);
        } else {
            videoRecorderRef.current = new MediaRecorder(stream, { mimeType: supportedMimeType });
        }
        
        if(liveVideoPreviewRef.current) {
            liveVideoPreviewRef.current.srcObject = stream;
            liveVideoPreviewRef.current.onloadedmetadata = () => {
                 liveVideoPreviewRef.current?.play().catch(e => console.error("Live preview play error:", e));
                 setIsVideoStarting(false);
            }
        } else {
            setIsVideoStarting(false); 
        }

        videoRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data);
          }
        };

        videoRecorderRef.current.onstop = () => {
          const videoBlob = new Blob(videoChunksRef.current, { type: videoRecorderRef.current?.mimeType || 'video/webm' });
          setRecordedVideoBlob(videoBlob);
          const videoUrl = URL.createObjectURL(videoBlob);
          setRecordedVideoUrl(videoUrl);
          setIsVideoRecording(false);
          if (videoRecordingIntervalRef.current) clearInterval(videoRecordingIntervalRef.current);
        };
        
        setTimeout(() => {
            if (videoRecorderRef.current?.state === "inactive") {
                 videoRecorderRef.current.start();
                 setIsVideoRecording(true);
                 setVideoRecordingTime(0);
                 videoRecordingIntervalRef.current = setInterval(() => {
                    setVideoRecordingTime(prevTime => prevTime + 1);
                }, 1000);
            }
        }, 100);

        setIsVideoRecordingModalOpen(true);

      } catch (err) {
        console.error("Error starting video recording: ", err);
        let message = t('chat.modal.videoRecordingErrorDeviceAccess');
        if (err instanceof Error) {
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") message = t('chat.modal.videoRecordingErrorDenied');
            else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") message = t('chat.modal.videoRecordingErrorNotFound');
            else message = t('chat.modal.videoRecordingErrorGeneric', { message: err.message });
        }
        setError(message);
        setIsVideoStarting(false);
        setIsVideoRecording(false);
        if(videoStream) videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
    } else {
      setError(t('chat.modal.videoRecordingErrorBrowserSupport'));
      setIsVideoStarting(false);
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && isVideoRecording) {
      videoRecorderRef.current.stop();
    }
  };

  const handleConfirmRecordedVideo = () => {
    if (recordedVideoBlob) {
      const videoFile = new File([recordedVideoBlob], `video-record-${Date.now()}.${recordedVideoBlob.type.split('/')[1] || 'webm'}`, { type: recordedVideoBlob.type });
      onFileSelection([videoFile]);
    }
    closeVideoRecordingModal();
  };

  const closeVideoRecordingModal = () => {
    if (isVideoRecording) stopVideoRecording();
    if (videoRecordingIntervalRef.current) clearInterval(videoRecordingIntervalRef.current);
    
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    if (liveVideoPreviewRef.current) liveVideoPreviewRef.current.srcObject = null;
    if (recordedVideoPreviewRef.current) recordedVideoPreviewRef.current.srcObject = null;
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    setIsVideoRecordingModalOpen(false);
    setIsVideoRecording(false);
    setIsVideoStarting(false);
    setVideoRecordingTime(0);
    videoChunksRef.current = [];
    videoRecorderRef.current = null;
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleVoiceInput = () => {
    if (!SpeechRecognitionAPI) {
      setError(t('chat.voiceInput.errorNotSupported'));
      return;
    }

    if (isVoiceInputRecording) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    } else {
      setError(null);
      textBeforeCurrentVoiceInputRef.current = currentText; // Capture text before starting new session
      let accumulatedFinalTranscriptInSession = ""; // Accumulates final results for this session

      speechRecognitionRef.current = new SpeechRecognitionAPI();
      speechRecognitionRef.current.lang = language; 
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.continuous = true;

      speechRecognitionRef.current.onstart = () => {
        setIsVoiceInputRecording(true);
      };

      speechRecognitionRef.current.onresult = (event: any) => {
        let interimTranscriptForCurrentEvent = '';
        let newFinalSegmentInCurrentEvent = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newFinalSegmentInCurrentEvent += transcriptPiece;
          } else {
            interimTranscriptForCurrentEvent += transcriptPiece;
          }
        }
        
        if (newFinalSegmentInCurrentEvent) {
            accumulatedFinalTranscriptInSession += newFinalSegmentInCurrentEvent;
        }
        
        setCurrentText(textBeforeCurrentVoiceInputRef.current + accumulatedFinalTranscriptInSession + interimTranscriptForCurrentEvent);
      };

      speechRecognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setError(t('chat.voiceInput.errorNoSpeech'));
        } else if (event.error === 'audio-capture') {
          setError(t('chat.voiceInput.errorAudioCapture'));
        } else if (event.error === 'not-allowed') {
          setError(t('chat.voiceInput.errorNotAllowed'));
        } else {
          setError(t('chat.voiceInput.errorGeneric', { error: event.error }));
        }
        setIsVoiceInputRecording(false);
      };

      speechRecognitionRef.current.onend = () => {
        setIsVoiceInputRecording(false);
        // The text is already set with the final part from onresult.
        // If there was any final part in the last onresult, it's already incorporated.
      };
      
      try {
        speechRecognitionRef.current.start();
      } catch (e) {
        console.error("Error starting speech recognition: ", e);
        setError(t('chat.voiceInput.errorStart', { error: (e as Error).message }));
        setIsVoiceInputRecording(false);
      }
    }
  };

  // Stop STT when component unmounts or isLoading changes (e.g., message sent)
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current && isVoiceInputRecording) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [isVoiceInputRecording]);

  useEffect(() => {
      if (isLoading && isVoiceInputRecording && speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
      }
  }, [isLoading, isVoiceInputRecording]);

  
  const placeholderText = isVoiceInputRecording 
    ? t('chat.voiceInput.placeholderRecording')
    : (stagedFiles.length > 0
      ? t('chat.inputPlaceholderWithFiles')
      : t('chat.inputPlaceholder'));


  return (
    <>
      <div className="bg-gray-100 p-3 sm:p-4 border-t border-gray-300 shadow-md">
        {stagedFiles.length > 0 && (
          <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {stagedFiles.map((fileItem) => (
                <FilePreviewItem key={fileItem.previewUrl} fileItem={fileItem} onRemove={onRemoveStagedFile} disabled={isLoading} />
              ))}
            </div>
          </div>
        )}
        <div className="flex items-end space-x-1 sm:space-x-2">
          <div className="relative" ref={attachmentMenuRef}>
            <button
              type="button"
              onClick={() => setIsAttachmentMenuOpen(prev => !prev)}
              disabled={isLoading || isCameraStarting || isAudioRecording || isVideoRecording || isVideoStarting || isVoiceInputRecording}
              className="p-2 text-primary hover:text-teal-700 disabled:text-gray-400 transition-colors"
              aria-label={t('chat.attachFile')}
              title={t('chat.attachFile')}
            >
              <AttachmentIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            {isAttachmentMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-20 py-1">
                <button
                  type="button"
                  onClick={() => triggerFileInput("image/*,application/pdf,text/plain,audio/*,video/*")}
                  disabled={isLoading || isCameraStarting || isAudioRecording || isVideoRecording || isVideoStarting || isVoiceInputRecording}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  aria-label={t('chat.uploadFromFile')}
                >
                  <UploadFileIcon className="mr-3 w-5 h-5 text-gray-500"/> {t('chat.uploadFromFile')}
                </button>
                <button 
                  type="button" 
                  onClick={startAudioRecording} 
                  disabled={isLoading || isCameraStarting || isAudioRecording || isVideoRecording || isVideoStarting || isVoiceInputRecording} 
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50" 
                  aria-label={t('chat.recordAudio')}
                >
                  <MicrophoneIcon className="mr-3 w-5 h-5 text-gray-500"/> {t('chat.recordAudio')}
                </button>
                 <button 
                  type="button" 
                  onClick={startVideoRecording} 
                  disabled={isLoading || isCameraStarting || isAudioRecording || isVideoRecording || isVideoStarting || isVoiceInputRecording} 
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50" 
                  aria-label={t('chat.recordVideo')}
                >
                  <VideoCameraIcon className="mr-3 w-5 h-5 text-gray-500"/> {t('chat.recordVideo')}
                </button>
                <button 
                  type="button" 
                  onClick={startPhotoCamera} 
                  disabled={isLoading || isCameraStarting || isAudioRecording || isVideoRecording || isVideoStarting || isVoiceInputRecording} 
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50" 
                  aria-label={t('chat.capturePhoto')}
                >
                  <PhotoCameraIcon className="mr-3 w-5 h-5 text-gray-500"/> {t('chat.capturePhoto')}
                </button>
                <button 
                  type="button" 
                  onClick={handleScreenshot} 
                  disabled={isLoading || isCameraStarting || isAudioRecording || isVideoRecording || isVideoStarting || isVoiceInputRecording} 
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50" 
                  aria-label={t('chat.captureScreenshot')}
                >
                  <ScreenshotIcon className="mr-3 w-5 h-5 text-gray-500"/> {t('chat.captureScreenshot')}
                </button>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*,application/pdf,text/plain,audio/*,video/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            disabled={isLoading || isCameraStarting || isAudioRecording || isVideoRecording || isVideoStarting || isVoiceInputRecording}
            multiple
          />
          <textarea
            ref={textAreaRef}
            value={currentText}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholderText}
            className="flex-grow p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 resize-none overflow-y-auto max-h-32 text-sm sm:text-base"
            rows={1}
            disabled={isLoading || isCameraStarting || isAudioRecording || isVideoRecording || isVideoStarting || isVoiceInputRecording}
            aria-label={t('chat.inputPlaceholder')}
          />
           {SpeechRecognitionAPI && (
            <button
              type="button"
              onClick={handleToggleVoiceInput}
              disabled={isLoading || isCameraStarting || isAudioRecording || isVideoRecording || isVideoStarting}
              className={`p-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition duration-150 disabled:opacity-50 
                          ${isVoiceInputRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-primary hover:bg-teal-700 text-white'}`}
              aria-label={isVoiceInputRecording ? t('chat.voiceInput.stopRecording') : t('chat.voiceInput.startRecording')}
              title={isVoiceInputRecording ? t('chat.voiceInput.stopRecording') : t('chat.voiceInput.startRecording')}
            >
              <InputMicrophoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || isCameraStarting || isAudioRecording || isVideoRecording || isVideoStarting || (!currentText.trim() && stagedFiles.length === 0)}
            className="p-2.5 bg-primary hover:bg-teal-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition duration-150 disabled:opacity-50"
            aria-label={t('chat.sendMessage')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas> 
      
      {isCameraModalOpen && (
        <Modal title={t('chat.modal.capturePhotoTitle')} onClose={stopPhotoCamera} show={isCameraModalOpen}>
          <div className="relative">
            <video ref={photoCaptureVideoRef} playsInline className="w-full h-auto max-h-[60vh] rounded bg-gray-800 border border-gray-700"></video>
            {(isCameraStarting || (cameraStream && !cameraStream.active && !photoCaptureVideoRef.current?.played.length)) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                    <div className="text-center">
                        <svg className="animate-spin h-10 w-10 text-white mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-white text-lg">{t('chat.modal.cameraStarting')}</p>
                    </div>
                </div>
            )}
            {cameraStream?.active && !isCameraStarting && (
                 <button onClick={handleCapturePhoto} disabled={isLoading} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition duration-150 disabled:opacity-70" aria-label={t('chat.modal.capturePhotoBtn')}>{t('chat.modal.capturePhotoBtn')}</button>
            )}
          </div>
        </Modal>
      )}

      {isAudioRecordingModalOpen && (
        <Modal title={t('chat.modal.audioRecordingTitle')} onClose={closeAudioRecordingModal} show={isAudioRecordingModalOpen}>
          <div className="flex flex-col items-center space-y-4 p-4">
            {isAudioRecording && (
              <>
                <MicrophoneIcon className="w-16 h-16 text-red-500 animate-pulse" />
                <p className="text-2xl font-mono text-gray-700">{formatTime(audioRecordingTime)}</p>
                <p className="text-sm text-gray-500">{t('chat.modal.audioRecordingInProgress')}</p>
                <button
                  onClick={stopAudioRecording}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
                  aria-label={t('chat.modal.audioRecordingStopTime')}
                >
                  {t('chat.modal.audioRecordingStopTime')}
                </button>
              </>
            )}
            {!isAudioRecording && recordedAudioUrl && (
              <>
                <p className="text-lg font-semibold text-gray-700">{t('chat.modal.audioRecordingReview')}</p>
                <audio src={recordedAudioUrl} controls className="w-full rounded-md shadow" />
                <div className="flex space-x-3 mt-4">
                   <button
                    onClick={handleConfirmRecordedAudio}
                    className="px-6 py-2 bg-primary hover:bg-teal-700 text-white rounded-lg shadow-md transition-colors"
                    aria-label={t('chat.modal.audioRecordingUseThis')}
                  >
                    {t('chat.modal.audioRecordingUseThis')}
                  </button>
                  <button
                    onClick={startAudioRecording} 
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow-md transition-colors"
                    aria-label={t('chat.modal.audioRecordingRecordAgain')}
                  >
                    {t('chat.modal.audioRecordingRecordAgain')}
                  </button>
                </div>
              </>
            )}
             {!isAudioRecording && !recordedAudioUrl && !isLoading && ( 
                <p className="text-gray-600 p-4 text-center">{t('chat.modal.audioRecordingInitial')}</p>
            )}
          </div>
        </Modal>
      )}

      {isVideoRecordingModalOpen && (
        <Modal title={t('chat.modal.videoRecordingTitle')} onClose={closeVideoRecordingModal} show={isVideoRecordingModalOpen}>
            <div className="flex flex-col items-center space-y-3 p-2">
                {isVideoStarting && (
                     <div className="flex flex-col items-center justify-center p-6">
                        <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-gray-600 text-lg">{t('chat.modal.videoStarting')}</p>
                    </div>
                )}
                {!isVideoStarting && !recordedVideoUrl && (
                    <video ref={liveVideoPreviewRef} playsInline muted className="w-full h-auto max-h-[50vh] rounded bg-gray-800 border border-gray-600 shadow-md object-contain"></video>
                )}

                {isVideoRecording && !isVideoStarting && (
                    <>
                        <VideoCameraIcon className="w-12 h-12 text-red-500 animate-pulse" />
                        <p className="text-xl font-mono text-gray-700">{formatTime(videoRecordingTime)}</p>
                        <p className="text-sm text-gray-500">{t('chat.modal.videoRecordingInProgress')}</p>
                        <button
                            onClick={stopVideoRecording}
                            className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
                            aria-label={t('chat.modal.videoRecordingStopTime')}
                        >
                            {t('chat.modal.videoRecordingStopTime')}
                        </button>
                    </>
                )}

                {!isVideoStarting && !isVideoRecording && recordedVideoUrl && (
                    <>
                        <p className="text-md font-semibold text-gray-700">{t('chat.modal.videoRecordingReview')}</p>
                        <video ref={recordedVideoPreviewRef} src={recordedVideoUrl} controls className="w-full max-h-[50vh] rounded-md shadow-lg object-contain bg-gray-100 border"></video>
                        <div className="flex flex-wrap justify-center gap-3 mt-3">
                            <button
                                onClick={handleConfirmRecordedVideo}
                                className="px-5 py-2 bg-primary hover:bg-teal-700 text-white rounded-lg shadow-md transition-colors"
                                aria-label={t('chat.modal.videoRecordingUseThis')}
                            >
                                {t('chat.modal.videoRecordingUseThis')}
                            </button>
                            <button
                                onClick={startVideoRecording} 
                                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow-md transition-colors"
                                aria-label={t('chat.modal.videoRecordingRecordAgain')}
                            >
                                {t('chat.modal.videoRecordingRecordAgain')}
                            </button>
                        </div>
                    </>
                )}
                {!isVideoStarting && !isVideoRecording && !recordedVideoUrl && (
                     <p className="text-gray-600 p-4 text-center">{t('chat.modal.videoRecordingInitial')}</p>
                )}
            </div>
        </Modal>
      )}
    </>
  );
};

export default ChatInput;
