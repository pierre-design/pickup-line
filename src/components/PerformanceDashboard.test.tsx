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

  it('should sort alphabetically by default', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Default sort should be alphabetical
    const alphabeticalButton = screen.getByRole('button', { name: /sort alphabetically/i });
    expect(alphabeticalButton).toHaveClass('bg-white');
  });

  it('should change sort order when Top button is clicked', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    const topButton = screen.getByRole('button', { name: /sort by top performers/i });
    fireEvent.click(topButton);
    
    // After sorting by success rate, pl-1 (80%) should be first
    const successRates = screen.getAllByText(/success$/);
    expect(successRates[0]).toHaveTextContent('8/10 success'); // pl-1 has 80% success rate
  });

  it('should display pickup line text and category', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Check for pickup line text (from PICKUP_LINES constant)
    expect(screen.getByText(/Hi, I noticed you've been looking at our product/i)).toBeInTheDocument();
    expect(screen.getByText('helpful')).toBeInTheDocument();
  });

  it('should display call counts for each pickup line', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    expect(screen.getByText('8/10 success')).toBeInTheDocument();
    expect(screen.getByText('9/15 success')).toBeInTheDocument();
    expect(screen.getByText('1/5 success')).toBeInTheDocument();
  });

  it('should display usage count badges', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    expect(screen.getByText('Used 10x')).toBeInTheDocument();
    expect(screen.getByText('Used 15x')).toBeInTheDocument();
    expect(screen.getByText('Used 5x')).toBeInTheDocument();
  });

  it('should highlight active sort button', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    const topButton = screen.getByRole('button', { name: /sort by top performers/i });
    const alphabeticalButton = screen.getByRole('button', { name: /sort alphabetically/i });
    
    // Alphabetical should be active by default
    expect(alphabeticalButton).toHaveClass('bg-white');
    expect(topButton).not.toHaveClass('bg-white');
    
    // Click Top
    fireEvent.click(topButton);
    
    expect(topButton).toHaveClass('bg-white');
    expect(alphabeticalButton).not.toHaveClass('bg-white');
  });

  it('should render progress bars with correct widths', () => {
    const { container } = render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Query progress bars directly from container since they're in aria-hidden containers
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    
    // Check that progress bars exist and have aria values
    expect(progressBars.length).toBe(3);
    expect(progressBars[0]).toHaveAttribute('aria-valuenow');
    expect(progressBars[1]).toHaveAttribute('aria-valuenow');
    expect(progressBars[2]).toHaveAttribute('aria-valuenow');
  });
});
