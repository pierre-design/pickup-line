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
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[90%] max-w-md rounded-2xl shadow-lg p-6 bg-[#04411F] z-50"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base sm:text-lg mb-2 text-white">
              {feedback.message}
            </p>

            {/* Suggested pickup line for negative feedback */}
            {!isPositive && feedback.suggestedPickupLine && (
              <div className="mt-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <p className="text-white text-sm font-bold mb-2">
                  💡 Try this instead:
                </p>
                <p className="text-white text-sm font-semibold break-words">
                  "{feedback.suggestedPickupLine.text}"
                </p>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 hover:scale-110 active:scale-95 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 touch-manipulation rounded-full text-white/80 hover:text-white hover:bg-white/20"
              aria-label="Dismiss feedback"
            >
              <CloseIcon />
            </button>
          )}
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
