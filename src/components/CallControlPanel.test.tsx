import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CallControlPanel } from './CallControlPanel';
import type { CallControlPanelRef } from './CallControlPanel';
import type { CallSessionManager } from '../services/interfaces';
import type { CallSession } from '../domain/types';

describe('CallControlPanel', () => {
  let mockSessionManager: CallSessionManager;
  let mockSession: CallSession;

  beforeEach(() => {
    mockSession = {
      id: 'test-session-id',
      startTime: new Date(),
    };

    mockSessionManager = {
      startSession: vi.fn(() => mockSession),
      recordOpener: vi.fn(),
      recordOutcome: vi.fn(),
      endSession: vi.fn(),
    };
  });

  it('should render with Start Call button when no session is active', () => {
    render(<CallControlPanel sessionManager={mockSessionManager} />);

    const button = screen.getByRole('button', { name: /start new call session/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Start Call');
  });

  it('should display Ready status when no session is active', () => {
    render(<CallControlPanel sessionManager={mockSessionManager} />);

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('should start a session when Start Call button is clicked', () => {
    const onSessionStart = vi.fn();
    render(
      <CallControlPanel
        sessionManager={mockSessionManager}
        onSessionStart={onSessionStart}
      />
    );

    const button = screen.getByRole('button', { name: /start new call session/i });
    fireEvent.click(button);

    expect(mockSessionManager.startSession).toHaveBeenCalledTimes(1);
    expect(onSessionStart).toHaveBeenCalledWith(mockSession);
  });

  it('should display Call Active status when session is active', () => {
    render(<CallControlPanel sessionManager={mockSessionManager} />);

    const button = screen.getByRole('button', { name: /start new call session/i });
    fireEvent.click(button);

    expect(screen.getByText('Call Active')).toBeInTheDocument();
  });

  it('should change button to End Call when session is active', () => {
    render(<CallControlPanel sessionManager={mockSessionManager} />);

    const startButton = screen.getByRole('button', { name: /start new call session/i });
    fireEvent.click(startButton);

    const endButton = screen.getByRole('button', { name: /end current call session/i });
    expect(endButton).toBeInTheDocument();
    expect(endButton).toHaveTextContent('End Call');
  });

  it('should call onSessionEnd when End Call button is clicked', () => {
    const onSessionEnd = vi.fn();
    render(
      <CallControlPanel
        sessionManager={mockSessionManager}
        onSessionEnd={onSessionEnd}
      />
    );

    // Start session first
    const startButton = screen.getByRole('button', { name: /start new call session/i });
    fireEvent.click(startButton);

    // Then end it
    const endButton = screen.getByRole('button', { name: /end current call session/i });
    fireEvent.click(endButton);

    expect(onSessionEnd).toHaveBeenCalledTimes(1);
  });

  it('should return to Ready status after ending a session', () => {
    render(<CallControlPanel sessionManager={mockSessionManager} />);

    // Start session
    const startButton = screen.getByRole('button', { name: /start new call session/i });
    fireEvent.click(startButton);

    // End session
    const endButton = screen.getByRole('button', { name: /end current call session/i });
    fireEvent.click(endButton);

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('should display detected pickup line when set via ref', () => {
    const ref: React.RefObject<CallControlPanelRef> = { current: null };
    render(<CallControlPanel ref={ref} sessionManager={mockSessionManager} />);

    const pickupLine = {
      id: 'pl-1',
      text: 'Hi, I noticed you have been looking at our product.',
      category: 'helpful',
    };

    // Set detected pickup line via ref
    act(() => {
      ref.current?.setDetectedPickupLine(pickupLine);
    });

    expect(screen.getByText('Detected Opener')).toBeInTheDocument();
    expect(screen.getByText(pickupLine.text)).toBeInTheDocument();
    expect(screen.getByText(pickupLine.category)).toBeInTheDocument();
  });

  it('should clear detected pickup line when session ends', () => {
    const ref: React.RefObject<CallControlPanelRef> = { current: null };
    render(<CallControlPanel ref={ref} sessionManager={mockSessionManager} />);

    const pickupLine = {
      id: 'pl-1',
      text: 'Hi, I noticed you have been looking at our product.',
      category: 'helpful',
    };

    // Start session and set pickup line
    const startButton = screen.getByRole('button', { name: /start new call session/i });
    fireEvent.click(startButton);
    
    act(() => {
      ref.current?.setDetectedPickupLine(pickupLine);
    });

    expect(screen.getByText('Detected Opener')).toBeInTheDocument();

    // End session
    const endButton = screen.getByRole('button', { name: /end current call session/i });
    fireEvent.click(endButton);

    expect(screen.queryByText('Detected Opener')).not.toBeInTheDocument();
  });
});
