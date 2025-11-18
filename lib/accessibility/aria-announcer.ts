/**
 * ARIA Live Region Announcer
 * ARIA 实时区域播报器 - For screen reader announcements
 */

export type AnnouncementPriority = 'polite' | 'assertive';

/**
 * Announce a message to screen readers via ARIA live region
 * 通过 ARIA 实时区域向屏幕阅读器播报消息
 * 
 * @param message The message to announce
 * @param priority The priority level ('polite' or 'assertive')
 * @param clearDelay Optional delay in ms before clearing the message (default: 1000)
 */
export function announceToScreenReader(
  message: string,
  priority: AnnouncementPriority = 'polite',
  clearDelay = 1000
): void {
  const announcer = document.getElementById('aria-live-announcer');

  if (!announcer) {
    console.warn(
      'ARIA live announcer element not found. Make sure to add the element to your layout.'
    );
    return;
  }

  // Set the priority
  announcer.setAttribute('aria-live', priority);

  // Clear previous content
  announcer.textContent = '';

  // Use a small delay to ensure screen readers pick up the change
  requestAnimationFrame(() => {
    announcer.textContent = message;

    // Clear the message after the delay
    if (clearDelay > 0) {
      setTimeout(() => {
        announcer.textContent = '';
      }, clearDelay);
    }
  });
}

/**
 * Announce an error message to screen readers with assertive priority
 * 以断言优先级向屏幕阅读器播报错误消息
 */
export function announceError(message: string): void {
  announceToScreenReader(`错误: ${message}`, 'assertive', 3000);
}

/**
 * Announce a success message to screen readers with polite priority
 * 以礼貌优先级向屏幕阅读器播报成功消息
 */
export function announceSuccess(message: string): void {
  announceToScreenReader(`成功: ${message}`, 'polite', 2000);
}

/**
 * Announce a loading state to screen readers
 * 向屏幕阅读器播报加载状态
 */
export function announceLoading(message = '正在加载...'): void {
  announceToScreenReader(message, 'polite', 0);
}

/**
 * Clear the announcer
 * 清空播报器
 */
export function clearAnnouncer(): void {
  const announcer = document.getElementById('aria-live-announcer');
  if (announcer) {
    announcer.textContent = '';
  }
}
