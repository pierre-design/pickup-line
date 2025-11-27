import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('should render the app header', () => {
    render(<App />);
    
    expect(screen.getByText('Pickup Line Coach')).toBeInTheDocument();
    expect(screen.getByText('Master your call opening techniques')).toBeInTheDocument();
  });

  it('should render navigation tabs', () => {
    render(<App />);
    
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('should render the call control panel by default', () => {
    render(<App />);
    
    expect(screen.getByText('Start Call')).toBeInTheDocument();
    expect(screen.getByText('Quick Guide')).toBeInTheDocument();
  });

  it('should initialize without errors', () => {
    const { container } = render(<App />);
    
    expect(container).toBeTruthy();
  });
});
