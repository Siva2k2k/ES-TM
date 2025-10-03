import { useState, useCallback } from 'react';

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * useModal Hook
 * Manage modal open/close state
 *
 * @param defaultOpen - Initial state of the modal
 * @returns Modal state and control functions
 *
 * @example
 * const modal = useModal();
 * <Modal isOpen={modal.isOpen} onClose={modal.close}>...</Modal>
 * <Button onClick={modal.open}>Open Modal</Button>
 */
export function useModal(defaultOpen = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
