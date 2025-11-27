import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
          className="absolute bottom-0 left-4 right-4 bg-[#04411F] rounded-t-3xl shadow-2xl"
        >
          <div className="p-6 pb-8">
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
                className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all border-2 ${
                  suggestedOutcome === 'stayed'
                    ? 'border-white bg-white/10 text-white'
                    : 'border-white text-white hover:bg-white/10'
                }`}
              >
                They Stayed
              </button>
              <button
                onClick={() => onSelect('left')}
                className={`flex-1 px-6 py-4 rounded-lg font-bold transition-all border-2 ${
                  suggestedOutcome === 'left'
                    ? 'border-white bg-white/10 text-white'
                    : 'border-white text-white hover:bg-white/10'
                }`}
              >
                They Left
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
