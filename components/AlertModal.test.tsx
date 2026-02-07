import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import AlertModal from './AlertModal';

describe('AlertModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <AlertModal isOpen={false} title="Test" message="Msg" onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title and message when open', () => {
    render(
      <AlertModal isOpen={true} title="Error" message="Something went wrong" onClose={() => {}} />
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls onClose when button is clicked', () => {
    const onClose = vi.fn();
    render(
      <AlertModal isOpen={true} title="Info" message="Done" onClose={onClose} />
    );
    fireEvent.click(screen.getByText('OK'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(
      <AlertModal isOpen={true} title="Info" message="Done" onClose={onClose} />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses custom button label', () => {
    render(
      <AlertModal isOpen={true} title="Info" message="Done" buttonLabel="Got it" onClose={() => {}} />
    );
    expect(screen.getByText('Got it')).toBeInTheDocument();
  });
});
