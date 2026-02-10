import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import this to enable toBeInTheDocument
import App from './App';
import React from 'react';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('App', () => {
  it('renders headline', async () => {
    render(<App />);

    // App performs async state updates during initialization; using findBy* ensures
    // React Testing Library waits for the UI to settle (wrapped in act).
    const headline = await screen.findByText(/VenuePulse/i);
    expect(headline).toBeInTheDocument();
  });
});
