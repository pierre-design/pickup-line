interface OutcomeSelectorProps {
  show: boolean;
  onSelect: (outcome: 'stayed' | 'left') => void;
  suggestedOutcome?: 'stayed' | 'left' | null;
  confidence?: number;
}

export function OutcomeSelector({ show, onSelect, suggestedOutcome, confidence }: OutcomeSelectorProps) {
  if (!show) return null;

  const hasAISuggestion = suggestedOutcome && confidence && confidence > 0.5;
  const confidencePercent = confidence ? Math.round(confidence * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
      <div className="bg-[#04411F] rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2 text-center">
          How did the call go?
        </h3>
        
        {hasAISuggestion && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg border border-white/20">
            <p className="text-white/80 text-xs text-center mb-1">
              AI Suggestion ({confidencePercent}% confident)
            </p>
            <p className="text-white text-sm font-bold text-center">
              {suggestedOutcome === 'stayed' ? '✓ They likely stayed' : '✗ They likely left'}
            </p>
          </div>
        )}

        <p className="text-white/80 text-sm mb-6 text-center">
          {hasAISuggestion ? 'Confirm or correct the outcome:' : 'Did the person stay on the call or leave?'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => onSelect('stayed')}
            className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all ${
              suggestedOutcome === 'stayed'
                ? 'bg-medium-green text-black ring-2 ring-white ring-offset-2 ring-offset-[#04411F]'
                : 'bg-medium-green text-black hover:bg-medium-green/90'
            }`}
          >
            They Stayed
          </button>
          <button
            onClick={() => onSelect('left')}
            className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all ${
              suggestedOutcome === 'left'
                ? 'bg-pink text-black ring-2 ring-white ring-offset-2 ring-offset-[#04411F]'
                : 'bg-pink text-black hover:bg-pink/90'
            }`}
          >
            They Left
          </button>
        </div>
      </div>
    </div>
  );
}
