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
        className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[90%] max-w-md rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 ${
          isPositive ? 'bg-success' : 'bg-warning'
        }`}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            {isPositive ? (
              <CheckmarkIcon />
            ) : (
              <LightbulbIcon />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm sm:text-base mb-2">
              {feedback.message}
            </p>

            {/* Suggested pickup line for negative feedback */}
            {!isPositive && feedback.suggestedPickupLine && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/20 rounded-md backdrop-blur-sm">
                <p className="text-white/90 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Try this instead:
                </p>
                <p className="text-white text-sm sm:text-base font-semibold break-words">
                  "{feedback.suggestedPickupLine.text}"
                </p>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-white/80 hover:text-white active:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 touch-manipulation"
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
 * Checkmark icon for positive feedback
 */
function CheckmarkIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill="white" fillOpacity="0.2" />
      <path
        d="M9 16L14 21L23 11"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Lightbulb icon for negative feedback (constructive)
 */
function LightbulbIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill="white" fillOpacity="0.2" />
      <path
        d="M16 8C13.2386 8 11 10.2386 11 13C11 14.8638 12.0518 16.4696 13.5 17.3542V20C13.5 20.8284 14.1716 21.5 15 21.5H17C17.8284 21.5 18.5 20.8284 18.5 20V17.3542C19.9482 16.4696 21 14.8638 21 13C21 10.2386 18.7614 8 16 8Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 23.5H18"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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
