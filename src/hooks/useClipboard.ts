/**
 * useClipboard Hook
 * Manages clipboard state for cut/copy/paste operations on steps
 */

import { useState, useCallback } from 'react';
import type { Step } from '@/types';

export type ClipboardOperation = 'copy' | 'cut';

export interface ClipboardData {
  /** The step being copied or cut */
  step: Step;
  /** The operation type */
  operation: ClipboardOperation;
  /** Original container ID where the step was located (null for root level) */
  sourceContainerId: string | null;
}

export interface UseClipboardReturn {
  /** Current clipboard data (null if clipboard is empty) */
  clipboardData: ClipboardData | null;
  /** Whether the clipboard has data */
  hasClipboard: boolean;
  /** Whether the clipboard operation is 'cut' */
  isCut: boolean;
  /** The step ID that is currently cut (null if not cut or clipboard is empty) */
  cutStepId: string | null;
  /** Copy a step to clipboard */
  copyStep: (step: Step, sourceContainerId: string | null) => void;
  /** Cut a step to clipboard */
  cutStep: (step: Step, sourceContainerId: string | null) => void;
  /** Clear the clipboard */
  clearClipboard: () => void;
  /** Get clipboard data and clear it (for paste operation) */
  consumeClipboard: () => ClipboardData | null;
}

/**
 * Hook for managing clipboard operations on steps
 *
 * @example
 * const { copyStep, cutStep, consumeClipboard, cutStepId } = useClipboard();
 *
 * // Copy a step
 * copyStep(step, containerId);
 *
 * // Cut a step
 * cutStep(step, containerId);
 *
 * // Paste a step
 * const data = consumeClipboard();
 * if (data) {
 *   // Handle paste operation
 * }
 */
export function useClipboard(): UseClipboardReturn {
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(null);

  const copyStep = useCallback((step: Step, sourceContainerId: string | null) => {
    // Deep clone to prevent reference sharing with original step
    setClipboardData({
      step: structuredClone(step),
      operation: 'copy',
      sourceContainerId,
    });
  }, []);

  const cutStep = useCallback((step: Step, sourceContainerId: string | null) => {
    // Deep clone to prevent reference sharing with original step
    setClipboardData({
      step: structuredClone(step),
      operation: 'cut',
      sourceContainerId,
    });
  }, []);

  const clearClipboard = useCallback(() => {
    setClipboardData(null);
  }, []);

  const consumeClipboard = useCallback(() => {
    if (!clipboardData) return null;

    // Deep clone again when consuming to protect the clipboard data
    const data: ClipboardData = {
      step: structuredClone(clipboardData.step),
      operation: clipboardData.operation,
      sourceContainerId: clipboardData.sourceContainerId,
    };

    setClipboardData(null);
    return data;
  }, [clipboardData]);

  return {
    clipboardData,
    hasClipboard: clipboardData !== null,
    isCut: clipboardData?.operation === 'cut',
    cutStepId: clipboardData?.operation === 'cut' ? clipboardData.step.id : null,
    copyStep,
    cutStep,
    clearClipboard,
    consumeClipboard,
  };
}
