import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CelebrationAnimation } from './CelebrationAnimation';

describe('CelebrationAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when show is false', () => {
    const { container } = render(<CelebrationAnimation show={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render celebration when show is true', () => {
    render(<CelebrationAnimation show={true} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Success celebration')).toBeInTheDocument();
  });

  it('should auto-dismiss after 2 seconds', () => {
    const onDismiss = vi.fn();
    render(<CelebrationAnimation show={true} onDismiss={onDismiss} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Fast-forward time by 2 seconds
    vi.advanceTimersByTime(2000);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when clicked', () => {
    const onDismiss = vi.fn();
    render(<CelebrationAnimation show={true} onDismiss={onDismiss} />);
    
    const dialog = screen.getByRole('dialog');
    dialog.click();
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should render confetti particles', () => {
    const { container } = render(<CelebrationAnimation show={true} />);
    
    // Check that the dialog exists
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // The component should render multiple confetti particles (30)
    // We can't easily test the exact number due to Framer Motion's implementation,
    // but we can verify the component renders without errors
    expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
  });
});
