
import React from 'react';
import { SuggestedPrompt } from '../../shared-types'; 
import { useTranslation } from '../../core-hooks/useTranslation';

interface SuggestedPromptsProps {
  prompts: SuggestedPrompt[];
  onPromptClick: (prompt: SuggestedPrompt) => void;
  disabled?: boolean;
}

const SuggestedPromptsDisplay: React.FC<SuggestedPromptsProps> = ({ prompts, onPromptClick, disabled }) => {
  const { t } = useTranslation();

  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <div className="p-2 bg-gray-50 border-t border-gray-200">
      <p className="text-xs text-gray-600 mb-1 px-2">{t('chat.suggestedPromptsTitle')}</p>
      <div className="flex flex-wrap gap-2 px-1">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt)}
            disabled={disabled}
            className="px-3 py-1.5 text-xs sm:text-sm bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-300 rounded-full transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label={`${t('chat.suggestedPromptsTitle')} ${prompt.text}`}
          >
            {prompt.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPromptsDisplay;
