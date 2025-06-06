
import { GoogleGenAI, GenerateContentResponse, Part, GroundingChunk, Content } from "@google/genai";
import { AnalysisResult, GeminiAnalysisResponse, RiskLevel } from '../../shared-types'; 
import { GEMINI_MODEL_NAME } from '../../shared-constants'; 
import type { useTranslation } from '../../core-hooks/useTranslation';

type TFunction = ReturnType<typeof useTranslation>['t'];

// Declare global APP_CONFIG for TypeScript
declare global {
  interface Window {
    APP_CONFIG?: {
      API_KEY?: string;
    };
  }
}

const KNOWN_INVALID_PLACEHOLDERS = [
  "RUNTIME_API_KEY_NOT_SET",
  "MISSING_API_KEY_PLACEHOLDER",
  "FALLBACK_INVALID_KEY_RUNTIME",
  "" // Empty string is also invalid
];

const getApiKey = (): string | undefined => {
  // 1. Prioritize API_KEY from window.APP_CONFIG (for Docker runtime injection)
  if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_KEY) {
    const keyFromWindow = window.APP_CONFIG.API_KEY;
    if (keyFromWindow && !KNOWN_INVALID_PLACEHOLDERS.includes(keyFromWindow)) {
      return keyFromWindow;
    }
    if (keyFromWindow && KNOWN_INVALID_PLACEHOLDERS.includes(keyFromWindow)) {
        console.warn(`Gemini API Key from window.APP_CONFIG is a placeholder ('${keyFromWindow}'). Ensure it's correctly set in the .env file for Docker.`);
    }
  }

  // 2. Fallback for process.env (e.g., local Node.js dev or build-time replacement by tools like Vite/Webpack)
  // This is less likely to be effective with the current esm.sh setup without a build step.
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    const keyFromEnv = process.env.API_KEY;
    if (keyFromEnv && !KNOWN_INVALID_PLACEHOLDERS.includes(keyFromEnv)) {
      // console.info("Using Gemini API Key from process.env."); // Optional: for debugging
      return keyFromEnv;
    }
  }
  return undefined;
};

const EFFECTIVE_API_KEY = getApiKey();

const ai = new GoogleGenAI({ apiKey: EFFECTIVE_API_KEY || "FALLBACK_INVALID_KEY_RUNTIME" }); // Must pass a string

const parseGeminiResponse = (responseText: string, t: TFunction): Omit<AnalysisResult, 'groundingSources' | 'analyzedContentTypes'> => {
  const originalTrimmedResponse = responseText.trim(); 
  let contentToParse = originalTrimmedResponse;

  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = originalTrimmedResponse.match(fenceRegex);
  if (match && match[1]) {
    contentToParse = match[1].trim(); 
  }

  try {
    const parsedData = JSON.parse(contentToParse) as GeminiAnalysisResponse;
    if (parsedData && parsedData.riskLevel && parsedData.explanation !== undefined && Array.isArray(parsedData.suggestions)) {
       return {
        riskLevel: parsedData.riskLevel as RiskLevel,
        explanation: parsedData.explanation,
        suggestions: parsedData.suggestions,
      };
    }
    console.error("Parsed JSON does not match expected structure:", parsedData);
    const displayableStructErrorResponse = originalTrimmedResponse.substring(0, 150) + (originalTrimmedResponse.length > 150 ? '...' : '');
    return {
        riskLevel: RiskLevel.UNKNOWN,
        explanation: t('gemini.errorAIResponseFormatInvalidContent', { responseText: displayableStructErrorResponse }),
        suggestions: [t('gemini.suggestionRetryClearer'), t('gemini.suggestionEnsureJsonFormatUser')]
    };

  } catch (error) { 
    console.error("Failed to parse JSON response from Gemini:", error);
    console.error("Original response text for parsing error:", responseText); 

    if (!match && !originalTrimmedResponse.startsWith("{") && !originalTrimmedResponse.startsWith("[")) {
        return {
            riskLevel: RiskLevel.UNKNOWN,
            explanation: originalTrimmedResponse, 
            suggestions: [t('gemini.suggestionProvideMoreDetails'), t('gemini.suggestionRetryClearer')]
        };
    }

    const displayableGenericErrorResponse = originalTrimmedResponse.substring(0, 150) + (originalTrimmedResponse.length > 150 ? '...' : '');
    return {
      riskLevel: RiskLevel.UNKNOWN,
      explanation: t('gemini.errorParseResponseGeneric', { responseText: displayableGenericErrorResponse }),
      suggestions: [t('gemini.suggestionRetryLater'), t('gemini.suggestionCheckInput')],
    };
  }
};

const generateSystemGuidanceForAnalysis = (userQueryForPrompt: string, t: TFunction): string => {
  const query = userQueryForPrompt || t('gemini.systemPromptAnalysis.userRequestFallback');
  return t('gemini.systemPromptAnalysis.base', { query });
};

const generateSystemGuidanceForFollowUp = (userQueryForPrompt: string, t: TFunction): string => {
  return t('gemini.systemPromptFollowUp.base', { query: userQueryForPrompt });
};


export const analyzeOrChat = async (
  contentPartsFromUser: Part[], 
  userQuery: string, 
  inputContentTypes: string[],
  isFollowUp: boolean,
  chatHistoryForContext?: Content[],
  language?: string, 
  t?: TFunction 
): Promise<AnalysisResult | { text: string; groundingSources?: { uri: string; title: string }[] }> => {
  
  const currentT = t || ((key: string, vars?: object) => { 
    let tempKey = key;
    if (vars) {
      for(const optKey in vars) {
        tempKey = tempKey.replace(new RegExp(`{${optKey}}`, 'g'), String(vars[optKey]));
      }
    }
    return tempKey;
  });

  if (!EFFECTIVE_API_KEY || KNOWN_INVALID_PLACEHOLDERS.includes(EFFECTIVE_API_KEY)) { 
    const errorMsg = currentT('errors.configErrorApiKey');
    console.error("Gemini API Key is not configured or is a placeholder. Aborting API call.");
    if (isFollowUp) return { text: errorMsg, groundingSources: [] };
    return { 
      riskLevel: RiskLevel.UNKNOWN, 
      explanation: errorMsg, 
      suggestions: [currentT('errors.contactAdmin')],
      analyzedContentTypes: inputContentTypes
    };
  }

  try {
    let systemInstructionText: string;
    const genAIConfig: any = { 
        tools: [{ googleSearch: {} }], 
    };

    const currentConversationContents: Content[] = [];

    if (isFollowUp) {
      systemInstructionText = generateSystemGuidanceForFollowUp(userQuery, currentT);
      if (chatHistoryForContext) {
        currentConversationContents.push(...chatHistoryForContext);
      }
      currentConversationContents.push({ role: "user", parts: contentPartsFromUser });
    } else { 
      systemInstructionText = generateSystemGuidanceForAnalysis(userQuery, currentT);
      currentConversationContents.push({ role: "user", parts: contentPartsFromUser });
    }
    
    genAIConfig.systemInstruction = systemInstructionText;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME, 
        contents: currentConversationContents,
        config: genAIConfig,
    });
    
    const groundingSources: { uri: string; title: string }[] = [];
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    if (groundingMetadata && Array.isArray(groundingMetadata.groundingChunks)) {
        groundingMetadata.groundingChunks.forEach((chunk: GroundingChunk) => {
            if (chunk.web && chunk.web.uri) {
                groundingSources.push({
                    uri: chunk.web.uri,
                    title: chunk.web.title || chunk.web.uri, 
                });
            }
        });
    }

    if (isFollowUp) {
      return { 
        text: response.text,
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
      };
    } else { 
      const parsedCoreAnalysis = parseGeminiResponse(response.text, currentT);
      return { 
        ...parsedCoreAnalysis,
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
        analyzedContentTypes: inputContentTypes,
      };
    }

  } catch (error) {
    console.error(`Error during AI call (isFollowUp: ${isFollowUp}, lang: ${language}):`, error);
    const errorMessage = error instanceof Error ? error.message : currentT('errors.generalApiError');
    if (isFollowUp) {
        return { text: `${currentT('chat.errorPrefix') || 'Sorry, I encountered an issue:'} ${errorMessage}` };
    }
    return {
      riskLevel: RiskLevel.UNKNOWN,
      explanation: currentT('chat.errorAIAnalysis', { errorMessage }),
      suggestions: [currentT('gemini.suggestionCheckConnection'), currentT('gemini.suggestionRetryLaterShort')],
      analyzedContentTypes: inputContentTypes,
    };
  }
};


export const analyzeText = async (text: string, tFn?: TFunction): Promise<AnalysisResult> => {
  const tForService = tFn || ((key: string, options?:Record<string,string|number>) => {
    let tempKey = key;
    if (options) {
      for(const optKey in options) {
        tempKey = tempKey.replace(new RegExp(`{${optKey}}`, 'g'), String(options[optKey]));
      }
    }
    return tempKey;
  });

  const result = await analyzeOrChat(
    [{ text }], 
    text, 
    ['text/plain'], 
    false, 
    undefined, 
    undefined, 
    tForService 
  );
  return result as AnalysisResult; 
};


export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      if (result && result.includes(',')) {
        resolve(result.split(',')[1]); 
      } else {
        reject(new Error("Could not convert file to base64: invalid format."));
      }
    };
    reader.onerror = (error) => reject(new Error(`Error reading file: ${error}`));
  });
};

export const fileToText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > 4 * 1024 * 1024) { 
        return reject(new Error("Text file size is too large (max 4MB)."));
    }
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(new Error(`Error reading text file: ${error}`)));
  });
};
