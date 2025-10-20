import { useState, useCallback } from 'react';

export interface UseCopyToClipboardReturn {
  copiedText: string | null;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * useCopyToClipboard Hook
 * Copy text to clipboard with state tracking
 *
 * @returns Copy function, copied text, and reset function
 *
 * @example
 * const { copy, copiedText } = useCopyToClipboard();
 *
 * <button onClick={() => copy('Hello World')}>
 *   {copiedText ? 'Copied!' : 'Copy'}
 * </button>
 */
export function useCopyToClipboard(): UseCopyToClipboardReturn {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      setCopiedText(null);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setCopiedText(null);
  }, []);

  return {
    copiedText,
    copy,
    reset,
  };
}
