
export enum RiskLevel {
  VERY_HIGH = "VERY_HIGH",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  SAFE = "SAFE",
  UNKNOWN = "UNKNOWN"
}

export interface AnalysisResult {
  riskLevel: RiskLevel | null; // Allow null for conversational turns
  explanation: string; // For analysis: detailed breakdown. For conversational (if riskLevel is null): might be empty if text is directly in ChatMessageItem.
  suggestions: string[];
  groundingSources?: { uri: string; title: string }[];
  analyzedContentTypes?: string[]; // Optional: to know what was in the input
}

export interface GeminiAnalysisResponse { // This is the expected structure from AI's JSON output for full analysis
  riskLevel: RiskLevel;
  explanation: string;
  suggestions: string[];
}

export type MessageSender = 'user' | 'ai' | 'system';

export interface ChatMessageItemFile {
  name: string;
  type: string; // Mime type
  base64?: string; // For images or PDF for display/resending if needed
  previewUrl?: string; // For images, or an icon URL for other files
  textContent?: string; // For text files, if read client-side
}

export interface ChatMessageItem {
  id: string;
  sender: MessageSender;
  text?: string; // User's text query or AI's textual response part (especially for follow-ups)
  inputFiles?: ChatMessageItemFile[];
  analysisResult?: AnalysisResult | null; // Full analysis result or minimal for grounding in follow-ups
  isTyping?: boolean;
  timestamp: number;
}

export interface SuggestedPrompt {
  text: string;
  isForFile?: boolean; // Generic flag if prompt is suitable when files are staged
}

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

// Renamed from StagedImage to StagedFile
export interface StagedFile {
  file: File;
  fileType: string; // Mime type
  base64?: string; // For images and PDF
  previewUrl: string; // For images: object URL. For others: icon path or data URI.
  textContent?: string; // For text files
}

export interface ArchivedConversation {
  id: string; // Unique ID for this conversation
  name: string; // Display name for the conversation
  lastActivity: number; // Timestamp of the last message or save
  messages: ChatMessageItem[];
  chatTurnNumber: number;
}
