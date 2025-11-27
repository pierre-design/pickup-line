import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceDashboard } from './PerformanceDashboard';
import type { PickupLineStatistics } from '../domain/types';

describe('PerformanceDashboard', () => {
  const mockStatistics: PickupLineStatistics[] = [
    {
      pickupLineId: 'pl-1',
      totalUses: 10,
      successfulUses: 8,
      successRate: 0.8,
    },
    {
      pickupLineId: 'pl-2',
      totalUses: 15,
      successfulUses: 9,
      successRate: 0.6,
    },
    {
      pickupLineId: 'pl-3',
      totalUses: 5,
      successfulUses: 1,
      successRate: 0.2,
    },
  ];

  it('should render sort buttons', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    expect(screen.getByRole('button', { name: /sort by top performers/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sort by most used/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sort alphabetically/i })).toBeInTheDocument();
  });

  it('should display empty state when no statistics provided', () => {
    render(<PerformanceDashboard statistics={[]} />);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(screen.getByText('Start making calls to see your performance statistics')).toBeInTheDocument();
  });

  it('should display all pickup lines with their statistics', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Check that success rates are displayed
    expect(screen.getByText('80%')).toBeInTheDocument(); // pl-1
    expect(screen.getByText('60%')).toBeInTheDocument(); // pl-2
    expect(screen.getByText('20%')).toBeInTheDocument(); // pl-3
  });

  it('should sort by success rate by default (descending)', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Check that the pickup lines are in the correct order by looking for their text
    const pickupLineCards = screen.getAllByText(/calls$/);
    // Should be sorted by success rate: 80% (8/10), 60% (9/15), 20% (1/5)
    expect(pickupLineCards[0]).toHaveTextContent('8/10 calls');
    expect(pickupLineCards[1]).toHaveTextContent('9/15 calls');
    expect(pickupLineCards[2]).toHaveTextContent('1/5 calls');
  });

  it('should change sort order when Most Used button is clicked', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    const mostUsedButton = screen.getByRole('button', { name: /sort by most used/i });
    fireEvent.click(mostUsedButton);
    
    // After sorting by total uses, pl-2 (15 uses) should be first
    const pickupLineCards = screen.getAllByText(/calls$/);
    expect(pickupLineCards[0]).toHaveTextContent('9/15 calls'); // pl-2 has 15 uses
  });

  it('should display pickup line text and category', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Check for pickup line text (from PICKUP_LINES constant)
    expect(screen.getByText(/Hi, I noticed you've been looking at our product/i)).toBeInTheDocument();
    expect(screen.getByText('helpful')).toBeInTheDocument();
  });

  it('should display call counts for each pickup line', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    expect(screen.getByText('8/10 calls')).toBeInTheDocument();
    expect(screen.getByText('9/15 calls')).toBeInTheDocument();
    expect(screen.getByText('1/5 calls')).toBeInTheDocument();
  });

  it('should highlight active sort button', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    const topButton = screen.getByRole('button', { name: /sort by top performers/i });
    const mostUsedButton = screen.getByRole('button', { name: /sort by most used/i });
    
    // Top performers should be active by default
    expect(topButton).toHaveClass('bg-yellow');
    expect(mostUsedButton).not.toHaveClass('bg-yellow');
    
    // Click Most Used
    fireEvent.click(mostUsedButton);
    
    expect(mostUsedButton).toHaveClass('bg-yellow');
    expect(topButton).not.toHaveClass('bg-yellow');
  });

  it('should render progress bars with correct widths', () => {
    const { container } = render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Query progress bars directly from container since they're in aria-hidden containers
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    
    // Check that progress bars have correct aria values
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '80');
    expect(progressBars[1]).toHaveAttribute('aria-valuenow', '60');
    expect(progressBars[2]).toHaveAttribute('aria-valuenow', '20');
  });
});
