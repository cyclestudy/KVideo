/**
 * Keyboard Utilities
 * 键盘工具库 - For accessible keyboard interaction handling
 */

/**
 * Check if the key pressed is an activation key (Enter or Space)
 * 检查按下的键是否为激活键（Enter 或 Space）
 * 
 * @param event The keyboard event
 * @returns True if Enter or Space was pressed
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

/**
 * Handle Escape key press
 * 处理 Escape 键按下
 * 
 * @param callback Function to call when Escape is pressed
 * @returns Cleanup function to remove the event listener
 */
export function handleEscape(callback: () => void): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check if any modifier key is pressed
 * 检查是否按下了任何修饰键
 * 
 * @param event The keyboard event
 * @returns True if Shift, Ctrl, Alt, or Meta is pressed
 */
export function hasModifierKey(event: KeyboardEvent): boolean {
  return event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
}

/**
 * Check if the key is an arrow key
 * 检查按键是否为方向键
 * 
 * @param event The keyboard event
 * @returns The direction or null if not an arrow key
 */
export function getArrowKeyDirection(
  event: KeyboardEvent
): 'up' | 'down' | 'left' | 'right' | null {
  switch (event.key) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    default:
      return null;
  }
}

/**
 * Prevent default for specific keys
 * 阻止特定键的默认行为
 * 
 * @param event The keyboard event
 * @param keys Array of keys to prevent default for
 */
export function preventDefaultForKeys(
  event: KeyboardEvent,
  keys: string[]
): void {
  if (keys.includes(event.key)) {
    event.preventDefault();
  }
}

/**
 * Create a keyboard event handler with common patterns
 * 创建具有常见模式的键盘事件处理器
 * 
 * @param handlers Object mapping keys to handler functions
 * @returns Event handler function
 */
export function createKeyboardHandler(
  handlers: Record<string, (event: KeyboardEvent) => void>
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    const handler = handlers[event.key];
    if (handler) {
      handler(event);
    }
  };
}
