import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PickupLineLibrary } from './PickupLineLibrary';
import type { PickupLineStatistics } from '../domain/types';
import { PICKUP_LINES } from '../domain/pickupLines';

describe('PickupLineLibrary', () => {
  it('should render all 7 pickup lines', () => {
    render(<PickupLineLibrary statistics={[]} />);
    
    // Check that all pickup lines are rendered by counting the buttons
    const pickupLineButtons = screen.getAllByRole('listitem');
    expect(pickupLineButtons).toHaveLength(7);
    
    // Check that each category is present
    expect(screen.getByText('rewarding')).toBeInTheDocument();
    expect(screen.getByText('helpful')).toBeInTheDocument();
    expect(screen.getByText('engagement')).toBeInTheDocument();
    expect(screen.getByText('answers')).toBeInTheDocument();
    expect(screen.getByText('savings')).toBeInTheDocument();
    expect(screen.getByText('traditional')).toBeInTheDocument();
    expect(screen.getByText('short')).toBeInTheDocument();
  });

  it('should show success rate badge for lines with >= 5 uses', () => {
    const statistics: PickupLineStatistics[] = [
      {
        pickupLineId: 'pl-1',
        totalUses: 5,
        successfulUses: 4,
        successRate: 0.8,
      },
      {
        pickupLineId: 'pl-2',
        totalUses: 3,
        successfulUses: 2,
        successRate: 0.67,
      },
    ];

    render(<PickupLineLibrary statistics={statistics} />);
    
    // Line with >= 5 uses should show success rate badge
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('5 uses')).toBeInTheDocument();
    
    // Line with < 5 uses should not show success rate badge
    expect(screen.queryByText('67%')).not.toBeInTheDocument();
    expect(screen.getByText('3 uses')).toBeInTheDocument();
  });

  it('should visually indicate excluded lines (< 30% success rate with >= 10 uses)', () => {
    const statistics: PickupLineStatistics[] = [
      {
        pickupLineId: 'pl-1',
        totalUses: 10,
        successfulUses: 2,
        successRate: 0.2, // 20% - should be excluded
      },
      {
        pickupLineId: 'pl-2',
        totalUses: 10,
        successfulUses: 5,
        successRate: 0.5, // 50% - should not be excluded
      },
    ];

    render(<PickupLineLibrary statistics={statistics} />);
    
    // Excluded line should show "Excluded" text
    expect(screen.getByText('Excluded')).toBeInTheDocument();
    
    // Should only have one excluded line
    const excludedElements = screen.getAllByText('Excluded');
    expect(excludedElements).toHaveLength(1);
  });

  it('should show detailed statistics when a line is clicked', () => {
    const statistics: PickupLineStatistics[] = [
      {
        pickupLineId: 'pl-1',
        totalUses: 10,
        successfulUses: 7,
        successRate: 0.7,
        lastUsed: new Date('2024-01-15'),
      },
    ];

    render(<PickupLineLibrary statistics={statistics} />);
    
    // Initially, detailed stats should not be visible
    expect(screen.queryByText('Total Uses:')).not.toBeInTheDocument();
    
    // Click on the pickup line (use partial text match since text is split across spans)
    const pickupLineButton = screen.getByText(/Hi, thank you for requesting a callback/);
    fireEvent.click(pickupLineButton);
    
    // Detailed stats should now be visible
    expect(screen.getByText('Total Uses:')).toBeInTheDocument();
    expect(screen.getByText('Successful:')).toBeInTheDocument();
    expect(screen.getByText('Failed:')).toBeInTheDocument();
    expect(screen.getByText('Success Rate:')).toBeInTheDocument();
    expect(screen.getByText('Last Used:')).toBeInTheDocument();
    
    // Check values
    expect(screen.getByText('10')).toBeInTheDocument(); // Total uses
    expect(screen.getByText('7')).toBeInTheDocument(); // Successful
    expect(screen.getByText('3')).toBeInTheDocument(); // Failed (10 - 7)
    expect(screen.getByText('70.0%')).toBeInTheDocument(); // Success rate
  });

  it('should toggle detailed view when clicking the same line twice', () => {
    const statistics: PickupLineStatistics[] = [
      {
        pickupLineId: 'pl-1',
        totalUses: 10,
        successfulUses: 7,
        successRate: 0.7,
      },
    ];

    render(<PickupLineLibrary statistics={statistics} />);
    
    const pickupLineButton = screen.getByText(/Hi, thank you for requesting a callback/);
    
    // Click to show details
    fireEvent.click(pickupLineButton);
    expect(screen.getByText('Total Uses:')).toBeInTheDocument();
    
    // Click again to hide details
    fireEvent.click(pickupLineButton);
    expect(screen.queryByText('Total Uses:')).not.toBeInTheDocument();
  });

  it('should call onSelectPickupLine callback when a line is clicked', () => {
    const onSelectPickupLine = vi.fn();
    
    render(<PickupLineLibrary statistics={[]} onSelectPickupLine={onSelectPickupLine} />);
    
    // Click on the first pickup line
    const pickupLineButton = screen.getByText(/Hi, thank you for requesting a callback/);
    fireEvent.click(pickupLineButton);
    
    // Callback should be called with the pickup line
    expect(onSelectPickupLine).toHaveBeenCalledWith(PICKUP_LINES[0]);
  });

  it('should display "Not used yet" for lines without statistics', () => {
    render(<PickupLineLibrary statistics={[]} />);
    
    // All lines should show "Not used yet"
    const notUsedElements = screen.getAllByText('Not used yet');
    expect(notUsedElements).toHaveLength(7);
  });

  it('should display category tags for all pickup lines', () => {
    render(<PickupLineLibrary statistics={[]} />);
    
    // Check that categories are displayed
    PICKUP_LINES.forEach(line => {
      if (line.category) {
        expect(screen.getByText(line.category)).toBeInTheDocument();
      }
    });
  });

  it('should allow excluded lines to be manually selectable', () => {
    const statistics: PickupLineStatistics[] = [
      {
        pickupLineId: 'pl-1',
        totalUses: 10,
        successfulUses: 2,
        successRate: 0.2, // Excluded
      },
    ];

    const onSelectPickupLine = vi.fn();
    
    render(<PickupLineLibrary statistics={statistics} onSelectPickupLine={onSelectPickupLine} />);
    
    // Click on the excluded line
    const pickupLineButton = screen.getByText(/Hi, thank you for requesting a callback/);
    fireEvent.click(pickupLineButton);
    
    // Should still be selectable
    expect(onSelectPickupLine).toHaveBeenCalledWith(PICKUP_LINES[0]);
  });
});
