import { motion, AnimatePresence } from 'framer-motion';
import type { Feedback } from '../domain/types';

interface FeedbackCardProps {
  feedback: Feedback | null;
  onDismiss?: () => void;
}

/**
 * FeedbackCard component displays feedback to the agent after a call session
 * - Positive feedback: green background, checkmark icon, encouraging message
 * - Negative feedback: orange background, lightbulb icon, constructive message with suggestion
 * - Animated slide-in from bottom using Framer Motion
 */
export function FeedbackCard({ feedback, onDismiss }: FeedbackCardProps) {
  if (!feedback) return null;

  const isPositive = feedback.type === 'positive';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
        className="fixed bottom-0 left-0 right-0 bg-[#04411F] z-50 rounded-t-3xl shadow-2xl"
        role="alert"
        aria-live="polite"
      >
        <div className="p-6 pb-safe">
          {/* Close button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss feedback"
            >
              <CloseIcon />
            </button>
          )}

          {/* Content */}
          <div className="pr-10">
            <p className="font-bold text-lg text-white mb-4">
              {feedback.message}
            </p>

            {/* Suggested pickup line for negative feedback */}
            {!isPositive && feedback.suggestedPickupLine && (
              <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20">
                <p className="text-white text-sm font-bold mb-2">
                  💡 Try this instead:
                </p>
                <p className="text-white text-sm font-semibold break-words">
                  "{feedback.suggestedPickupLine.text}"
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Close icon for dismiss button
 */
function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
