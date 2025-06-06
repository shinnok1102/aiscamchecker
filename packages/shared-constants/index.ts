
import { RiskLevel, SuggestedPrompt } from '../shared-types'; 
import type { useTranslation } from '../core-hooks/useTranslation'; // Import type for `t` function

type TFunction = ReturnType<typeof useTranslation>['t'];

export const getRiskLevelDetails = (t: TFunction): Record<RiskLevel, { text: string; textColor: string; bgColor: string; borderColor: string }> => ({
  [RiskLevel.VERY_HIGH]: { text: t('chat.riskLevels.VERY_HIGH'), textColor: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-500" },
  [RiskLevel.HIGH]: { text: t('chat.riskLevels.HIGH'), textColor: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-500" },
  [RiskLevel.MEDIUM]: { text: t('chat.riskLevels.MEDIUM'), textColor: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-500" },
  [RiskLevel.LOW]: { text: t('chat.riskLevels.LOW'), textColor: "text-sky-700", bgColor: "bg-sky-50", borderColor: "border-sky-500" },
  [RiskLevel.SAFE]: { text: t('chat.riskLevels.SAFE'), textColor: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-500" },
  [RiskLevel.UNKNOWN]: { text: t('chat.riskLevels.UNKNOWN'), textColor: "text-gray-700", bgColor: "bg-gray-100", borderColor: "border-gray-400" },
});

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const getInitialSystemMessage = (t: TFunction): string => t('chat.initialSystemMessage');

export const getGeneralSuggestedPrompts = (t: TFunction): SuggestedPrompt[] => [
  { text: t('chat.suggestedPrompts.general1') },
  { text: t('chat.suggestedPrompts.general2') },
  { text: t('chat.suggestedPrompts.general3') },
];

export const getFileSuggestedPrompts = (t: TFunction): SuggestedPrompt[] => [
  { text: t('chat.suggestedPrompts.file1'), isForFile: true },
  { text: t('chat.suggestedPrompts.file2'), isForFile: true },
  { text: t('chat.suggestedPrompts.file3'), isForFile: true },
  { text: t('chat.suggestedPrompts.file4'), isForFile: true },
];

export const getDefaultFileAnalysisPrompt = (t: TFunction): string => t('chat.defaultFileAnalysisPrompt');
