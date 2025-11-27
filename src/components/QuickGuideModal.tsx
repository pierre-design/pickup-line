interface QuickGuideModalProps {
  show: boolean;
  onDismiss: () => void;
}

export function QuickGuideModal({ show, onDismiss }: QuickGuideModalProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-guide-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal Content */}
      <div
        className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-black/40 hover:text-black transition-colors"
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
          className="text-2xl font-bold text-black mb-6 text-center pr-8"
        >
          Quick Guide
        </h3>

        <ol className="text-base text-black/80 space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-light-green/20 text-dark-green flex items-center justify-center text-sm font-bold">
              1
            </span>
            <span className="pt-1">Pick the line you want to use.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-light-green/20 text-dark-green flex items-center justify-center text-sm font-bold">
              2
            </span>
            <span className="pt-1">Start your call and end it when you're done.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-light-green/20 text-dark-green flex items-center justify-center text-sm font-bold">
              3
            </span>
            <span className="pt-1">The app shows how well your opening landed.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
