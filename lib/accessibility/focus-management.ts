/**
 * Focus Management Utilities
 * 焦点管理工具库 - For accessible focus trapping and restoration
 */

/**
 * Get all focusable elements within a container
 * 获取容器内所有可聚焦的元素
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(selector)
  );

  return elements.filter(
    (element) =>
      element.offsetWidth > 0 &&
      element.offsetHeight > 0 &&
      !element.hasAttribute('hidden') &&
      getComputedStyle(element).visibility !== 'hidden'
  );
}

/**
 * Trap focus within a container (for modals, dialogs, etc.)
 * 在容器内陷阱焦点（用于模态框、对话框等）
 * 
 * @param container The container element to trap focus within
 * @returns Cleanup function to remove the focus trap
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    return () => {};
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Focus the first element
  firstElement.focus();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    // Shift + Tab
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    }
    // Tab
    else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Restore focus to a previously focused element
 * 恢复焦点到之前聚焦的元素
 * 
 * @param element The element to restore focus to
 */
export function restoreFocus(element: HTMLElement | null): void {
  if (!element) return;

  // Use requestAnimationFrame to ensure the element is ready
  requestAnimationFrame(() => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  });
}

/**
 * Save and restore focus for a component lifecycle
 * 保存并恢复组件生命周期的焦点
 * 
 * Usage:
 * const focusManager = saveFocus();
 * // ... do something that changes focus
 * focusManager.restore();
 */
export function saveFocus() {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  return {
    restore: () => restoreFocus(previouslyFocused),
  };
}
