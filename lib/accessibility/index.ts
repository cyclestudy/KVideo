/**
 * Accessibility Utilities Index
 * 可访问性工具库索引 - Centralized exports for all accessibility utilities
 */

// Focus Management
export {
  getFocusableElements,
  trapFocus,
  restoreFocus,
  saveFocus,
} from './focus-management';

// ARIA Announcer
export {
  announceToScreenReader,
  announceError,
  announceSuccess,
  announceLoading,
  clearAnnouncer,
  type AnnouncementPriority,
} from './aria-announcer';

// Keyboard Utils
export {
  isActivationKey,
  handleEscape,
  hasModifierKey,
  getArrowKeyDirection,
  preventDefaultForKeys,
  createKeyboardHandler,
} from './keyboard-utils';
