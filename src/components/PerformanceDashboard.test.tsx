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

  it('should display all pickup lines even with no statistics', () => {
    render(<PerformanceDashboard statistics={[]} />);
    
    // Should show all 15 pickup lines
    const pickupLineCards = screen.getAllByRole('listitem');
    expect(pickupLineCards.length).toBe(15);
  });

  it('should display pickup lines with statistics', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Check that success rates are displayed
    expect(screen.getByText('80%')).toBeInTheDocument(); // pl-1
    expect(screen.getByText('60%')).toBeInTheDocument(); // pl-2
    expect(screen.getByText('20%')).toBeInTheDocument(); // pl-3
  });

  it('should sort by success rate by default', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Top button should be active by default
    const topButton = screen.getByRole('button', { name: /sort by top performers/i });
    expect(topButton).toHaveClass('bg-white');
  });

  it('should change sort order when Alphabetically button is clicked', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    const alphabeticalButton = screen.getByRole('button', { name: /sort alphabetically/i });
    fireEvent.click(alphabeticalButton);
    
    expect(alphabeticalButton).toHaveClass('bg-white');
  });

  it('should display position numbers', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Should show position numbers
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('should display usage count for lines with data', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    expect(screen.getByText('Used 10x')).toBeInTheDocument();
    expect(screen.getByText('Used 15x')).toBeInTheDocument();
    expect(screen.getByText('Used 5x')).toBeInTheDocument();
  });

  it('should display "Not used yet" for lines without data', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    // Should show "Not used yet" for lines without statistics
    const notUsedTexts = screen.getAllByText('Not used yet');
    expect(notUsedTexts.length).toBeGreaterThan(0);
  });

  it('should highlight active sort button', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    const topButton = screen.getByRole('button', { name: /sort by top performers/i });
    const alphabeticalButton = screen.getByRole('button', { name: /sort alphabetically/i });
    
    // Top should be active by default
    expect(topButton).toHaveClass('bg-white');
    expect(alphabeticalButton).not.toHaveClass('bg-white');
    
    // Click Alphabetically
    fireEvent.click(alphabeticalButton);
    
    expect(alphabeticalButton).toHaveClass('bg-white');
    expect(topButton).not.toHaveClass('bg-white');
  });

  it('should display success information', () => {
    render(<PerformanceDashboard statistics={mockStatistics} />);
    
    expect(screen.getByText('8/10 success')).toBeInTheDocument();
    expect(screen.getByText('9/15 success')).toBeInTheDocument();
    expect(screen.getByText('1/5 success')).toBeInTheDocument();
  });
});
