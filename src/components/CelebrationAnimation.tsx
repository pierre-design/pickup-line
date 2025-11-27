import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CelebrationAnimationProps {
  show: boolean;
  onDismiss?: () => void;
}

/**
 * CelebrationAnimation component displays a Duolingo-style celebration
 * - Confetti particles that fall and fade
 * - Bouncing checkmark animation
 * - Auto-dismisses after 2 seconds
 * - Can be dismissed by clicking anywhere
 * 
 * Requirements: 4.4
 */
export function CelebrationAnimation({ show, onDismiss }: CelebrationAnimationProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);

    if (show) {
      // Auto-dismiss after 2 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  const handleClick = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Generate confetti particles with random positions and colors
  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 50, // Random horizontal spread
    rotation: Math.random() * 360,
    delay: Math.random() * 0.3,
    color: ['#34C759', '#007AFF', '#FF9500', '#FF3B30', '#FFD60A'][Math.floor(Math.random() * 5)],
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={handleClick}
          role="dialog"
          aria-label="Success celebration"
          aria-live="polite"
          aria-modal="true"
        >
          {/* Confetti particles */}
          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: 0,
                y: -20,
                opacity: 1,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                x: particle.x * 4,
                y: window.innerHeight,
                opacity: 0,
                rotate: particle.rotation,
                scale: 0.5,
              }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                ease: 'easeIn',
              }}
              className="absolute top-1/3 left-1/2"
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: particle.color,
                borderRadius: '2px',
              }}
            />
          ))}

          {/* Bouncing checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: [0, 1.2, 1],
              rotate: 0,
              y: [0, -20, 0, -10, 0],
            }}
            transition={{
              scale: {
                duration: 0.5,
                times: [0, 0.6, 1],
                ease: 'easeOut',
              },
              rotate: {
                duration: 0.5,
                ease: 'easeOut',
              },
              y: {
                duration: 1.5,
                times: [0, 0.3, 0.5, 0.7, 1],
                ease: 'easeInOut',
                repeat: 0,
              },
            }}
            className="relative z-10"
          >
            <CheckmarkCircle />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Large checkmark in a circle for celebration
 */
function CheckmarkCircle() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Circle background */}
      <circle cx="60" cy="60" r="60" fill="#34C759" />
      
      {/* White checkmark */}
      <motion.path
        d="M35 60L52 77L85 43"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
      />
    </svg>
  );
}
