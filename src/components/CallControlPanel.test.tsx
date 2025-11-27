import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CallControlPanel } from './CallControlPanel';
import type { CallControlPanelRef } from './CallControlPanel';
import type { CallSessionManager } from '../services/interfaces';
import type { AudioTranscriptionService } from '../infrastructure/interfaces';
import type { CallSession } from '../domain/types';

describe('CallControlPanel', () => {
  let mockSessionManager: CallSessionManager;
  let mockTranscriptionService: AudioTranscriptionService;
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

    mockTranscriptionService = {
      startListening: vi.fn().mockResolvedValue(undefined),
      stopListening: vi.fn().mockResolvedValue(undefined),
      onTranscription: vi.fn(),
    };
  });

  it('should render with Start Call button when no session is active', () => {
    render(<CallControlPanel sessionManager={mockSessionManager} transcriptionService={mockTranscriptionService} />);

    const button = screen.getByRole('button', { name: /start new call session/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Start Call');
  });

  it('should display Ready status when no session is active', () => {
    render(<CallControlPanel sessionManager={mockSessionManager} transcriptionService={mockTranscriptionService} />);

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('should start a session when Start Call button is clicked', async () => {
    const onSessionStart = vi.fn();
    render(
      <CallControlPanel
        sessionManager={mockSessionManager}
        transcriptionService={mockTranscriptionService}
        onSessionStart={onSessionStart}
      />
    );

    const button = screen.getByRole('button', { name: /start new call session/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockSessionManager.startSession).toHaveBeenCalledTimes(1);
    expect(mockTranscriptionService.startListening).toHaveBeenCalledTimes(1);
    expect(onSessionStart).toHaveBeenCalledWith(mockSession);
  });

  it('should display Call Active status when session is active', async () => {
    render(<CallControlPanel sessionManager={mockSessionManager} transcriptionService={mockTranscriptionService} />);

    const button = screen.getByRole('button', { name: /start new call session/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Live Call')).toBeInTheDocument();
  });

  it('should change button to End Call when session is active', async () => {
    render(<CallControlPanel sessionManager={mockSessionManager} transcriptionService={mockTranscriptionService} />);

    const startButton = screen.getByRole('button', { name: /start new call session/i });
    await act(async () => {
      fireEvent.click(startButton);
    });

    const endButton = screen.getByRole('button', { name: /end current call session/i });
    expect(endButton).toBeInTheDocument();
    expect(endButton).toHaveTextContent('End Call');
  });

  it('should call onSessionEnd when End Call button is clicked', async () => {
    const onSessionEnd = vi.fn();
    render(
      <CallControlPanel
        sessionManager={mockSessionManager}
        transcriptionService={mockTranscriptionService}
        onSessionEnd={onSessionEnd}
      />
    );

    // Start session first
    const startButton = screen.getByRole('button', { name: /start new call session/i });
    await act(async () => {
      fireEvent.click(startButton);
    });

    // Then end it
    const endButton = screen.getByRole('button', { name: /end current call session/i });
    await act(async () => {
      fireEvent.click(endButton);
    });

    expect(mockTranscriptionService.stopListening).toHaveBeenCalled();
    expect(onSessionEnd).toHaveBeenCalledTimes(1);
  });

  it('should return to Ready status after ending a session', async () => {
    render(<CallControlPanel sessionManager={mockSessionManager} transcriptionService={mockTranscriptionService} />);

    // Start session
    const startButton = screen.getByRole('button', { name: /start new call session/i });
    await act(async () => {
      fireEvent.click(startButton);
    });

    // End session
    const endButton = screen.getByRole('button', { name: /end current call session/i });
    await act(async () => {
      fireEvent.click(endButton);
    });

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('should display detected pickup line when set via ref', () => {
    const ref = { current: null } as unknown as React.RefObject<CallControlPanelRef>;
    render(<CallControlPanel ref={ref} sessionManager={mockSessionManager} transcriptionService={mockTranscriptionService} />);

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

  it('should clear detected pickup line when session ends', async () => {
    const ref = { current: null } as unknown as React.RefObject<CallControlPanelRef>;
    render(<CallControlPanel ref={ref} sessionManager={mockSessionManager} transcriptionService={mockTranscriptionService} />);

    const pickupLine = {
      id: 'pl-1',
      text: 'Hi, I noticed you have been looking at our product.',
      category: 'helpful',
    };

    // Start session and set pickup line
    const startButton = screen.getByRole('button', { name: /start new call session/i });
    await act(async () => {
      fireEvent.click(startButton);
    });
    
    act(() => {
      ref.current?.setDetectedPickupLine(pickupLine);
    });

    expect(screen.getByText('Detected Opener')).toBeInTheDocument();

    // End session
    const endButton = screen.getByRole('button', { name: /end current call session/i });
    await act(async () => {
      fireEvent.click(endButton);
    });

    expect(screen.queryByText('Detected Opener')).not.toBeInTheDocument();
  });
});
