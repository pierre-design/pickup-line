import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackCard } from './FeedbackCard';
import type { Feedback } from '../domain/types';

describe('FeedbackCard', () => {
  it('should render nothing when feedback is null', () => {
    const { container } = render(<FeedbackCard feedback={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render positive feedback with checkmark and message', () => {
    const feedback: Feedback = {
      type: 'positive',
      message: 'Great job! The client stayed on the call.',
      showCelebration: true,
    };

    render(<FeedbackCard feedback={feedback} />);
    
    expect(screen.getByText('Great job! The client stayed on the call.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-success');
  });

  it('should render negative feedback with lightbulb and message', () => {
    const feedback: Feedback = {
      type: 'negative',
      message: 'The client left quickly. Let\'s try a different approach.',
      showCelebration: false,
    };

    render(<FeedbackCard feedback={feedback} />);
    
    expect(screen.getByText('The client left quickly. Let\'s try a different approach.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-warning');
  });

  it('should display suggested pickup line for negative feedback', () => {
    const feedback: Feedback = {
      type: 'negative',
      message: 'The client left quickly.',
      suggestedPickupLine: {
        id: '1',
        text: 'Hi, I noticed you recently downloaded our app...',
        category: 'product-focused',
      },
      showCelebration: false,
    };

    render(<FeedbackCard feedback={feedback} />);
    
    expect(screen.getByText('Try this instead:')).toBeInTheDocument();
    expect(screen.getByText('"Hi, I noticed you recently downloaded our app..."')).toBeInTheDocument();
  });

  it('should not display suggested pickup line for positive feedback', () => {
    const feedback: Feedback = {
      type: 'positive',
      message: 'Excellent work!',
      suggestedPickupLine: {
        id: '1',
        text: 'Some line',
      },
      showCelebration: true,
    };

    render(<FeedbackCard feedback={feedback} />);
    
    expect(screen.queryByText('Try this instead:')).not.toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    const feedback: Feedback = {
      type: 'positive',
      message: 'Great job!',
      showCelebration: true,
    };

    render(<FeedbackCard feedback={feedback} onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByLabelText('Dismiss feedback');
    dismissButton.click();
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not render dismiss button when onDismiss is not provided', () => {
    const feedback: Feedback = {
      type: 'positive',
      message: 'Great job!',
      showCelebration: true,
    };

    render(<FeedbackCard feedback={feedback} />);
    
    expect(screen.queryByLabelText('Dismiss feedback')).not.toBeInTheDocument();
  });
});
