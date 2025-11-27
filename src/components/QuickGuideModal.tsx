import { motion, AnimatePresence } from 'framer-motion';

interface QuickGuideModalProps {
  show: boolean;
  onDismiss: () => void;
}

export function QuickGuideModal({ show, onDismiss }: QuickGuideModalProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onDismiss}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-guide-title"
      >
        {/* Drawer Content */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="absolute bottom-0 left-4 right-4 bg-[#04411F] rounded-t-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 pb-8">
            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Close quick guide"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3
              id="quick-guide-title"
              className="text-2xl font-bold text-white mb-6 text-center pr-8"
            >
              Quick Guide
            </h3>

            <ol className="text-base text-white space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span className="pt-1">Pick the line you want to use.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <span className="pt-1">Start your call and end it when you're done.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <span className="pt-1">The app shows how well your opening landed.</span>
              </li>
            </ol>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
