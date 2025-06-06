
import React from 'react';
import { AnalysisResult, RiskLevel } from '../../../shared-types'; 
import { getRiskLevelDetails } from '../../../shared-constants'; 
import { useTranslation } from '../../../core-hooks/useTranslation';

interface RiskDisplayProps {
  result: AnalysisResult | null; 
  isInsideChat?: boolean;
}

const RiskDisplay: React.FC<RiskDisplayProps> = ({ result, isInsideChat = false }) => {
  const { t } = useTranslation();
  
  if (!result) return null;

  const { riskLevel, explanation, suggestions, groundingSources } = result;
  
  const RISK_LEVEL_DETAILS_I18N = getRiskLevelDetails(t);

  const isGroundingOnlyDisplay = riskLevel === null && groundingSources && groundingSources.length > 0;
  
  const isValidAnalysis = riskLevel && riskLevel !== RiskLevel.UNKNOWN || 
                          (riskLevel === RiskLevel.UNKNOWN && explanation && explanation.startsWith(t('errors.errorPrefix') || "Lỗi"));


  if (!isGroundingOnlyDisplay && !isValidAnalysis) {
     if (!isInsideChat) {
        return (
            <div className="p-4 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
                {t('chat.riskDisplay.placeholder')}
            </div>
        );
     }
     return null;
  }

  const currentDetails = riskLevel ? RISK_LEVEL_DETAILS_I18N[riskLevel] : RISK_LEVEL_DETAILS_I18N[RiskLevel.UNKNOWN]; 
  
  let containerClassesApplicable = isInsideChat 
    ? `p-3 rounded-lg ${currentDetails.bgColor} border ${currentDetails.borderColor}`
    : `p-4 sm:p-6 rounded-lg border-2 ${currentDetails.borderColor} ${currentDetails.bgColor} shadow-md`;

  if (isGroundingOnlyDisplay && isInsideChat) {
    containerClassesApplicable = `p-3 rounded-lg bg-gray-50 border border-gray-200`;
  }

  return (
    <div className={containerClassesApplicable}>
      {isValidAnalysis && riskLevel !== null && (
        <>
          <h3 className={`text-lg sm:text-xl font-bold ${currentDetails.textColor} mb-2`}>
            {t('chat.riskDisplay.assessment')} <span className="uppercase">{currentDetails.text}</span>
          </h3>
          
          {explanation && ( 
            <div className="mb-3">
              <h4 className={`text-md font-semibold ${currentDetails.textColor} mb-1`}>{t('chat.riskDisplay.detailedAnalysis')}</h4>
              <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{explanation}</p>
            </div>
          )}
          
          {suggestions && suggestions.length > 0 && (
            <div className="mb-3">
              <h4 className={`text-md font-semibold ${currentDetails.textColor} mb-1`}>{t('chat.riskDisplay.suggestions')}</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm sm:text-base">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {groundingSources && groundingSources.length > 0 && (
        <div className={(isValidAnalysis && riskLevel !== null) ? "mt-3 pt-3 border-t border-gray-400/30" : "mt-0"}>
          <h4 className={`text-md font-semibold ${(isValidAnalysis && riskLevel !== null) ? currentDetails.textColor : 'text-gray-700'} mb-1`}>
            {t('chat.riskDisplay.references')}
          </h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm sm:text-base">
            {groundingSources.map((source, index) => (
              <li key={index}>
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-secondary hover:text-accent underline break-all"
                  title={source.title || source.uri}
                >
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RiskDisplay;
