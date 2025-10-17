/**
 * Browser console utilities for controlling logging
 * Available in development mode via window.loggingControls
 */

import { logger, LogLevel, LogCategory } from './logger';

export const loggingControls = {
  // Quick presets
  quiet: () => {
    logger.setLevel(LogLevel.ERROR);
    logger.disableCategory(LogCategory.RENDERING);
    logger.disableCategory(LogCategory.TESTING);
    console.log('🔇 Logging set to QUIET mode - only errors will show');
  },

  normal: () => {
    logger.setLevel(LogLevel.INFO);
    logger.enableCategory(LogCategory.AI);
    logger.enableCategory(LogCategory.CANVAS);
    logger.enableCategory(LogCategory.AUTH);
    logger.enableCategory(LogCategory.DATABASE);
    logger.disableCategory(LogCategory.RENDERING);
    logger.disableCategory(LogCategory.TESTING);
    console.log('🔊 Logging set to NORMAL mode - essential info only');
  },

  verbose: () => {
    logger.setLevel(LogLevel.DEBUG);
    logger.enableCategory(LogCategory.AI);
    logger.enableCategory(LogCategory.CANVAS);
    logger.enableCategory(LogCategory.AUTH);
    logger.enableCategory(LogCategory.DATABASE);
    logger.enableCategory(LogCategory.TESTING);
    logger.enableCategory(LogCategory.RENDERING);
    console.log('🔊 Logging set to VERBOSE mode - all debug info enabled');
  },

  // Individual controls
  setLevel: (level: 'error' | 'warn' | 'info' | 'debug' | 'verbose') => {
    const levels = {
      error: LogLevel.ERROR,
      warn: LogLevel.WARN,
      info: LogLevel.INFO,
      debug: LogLevel.DEBUG,
      verbose: LogLevel.VERBOSE
    };
    logger.setLevel(levels[level]);
    console.log(`📊 Log level set to: ${level.toUpperCase()}`);
  },

  enableCategory: (category: string) => {
    const validCategories = Object.values(LogCategory);
    if (validCategories.includes(category as LogCategory)) {
      logger.enableCategory(category as LogCategory);
      console.log(`✅ Enabled logging for: ${category.toUpperCase()}`);
    } else {
      console.log(`❌ Invalid category. Valid categories: ${validCategories.join(', ')}`);
    }
  },

  disableCategory: (category: string) => {
    const validCategories = Object.values(LogCategory);
    if (validCategories.includes(category as LogCategory)) {
      logger.disableCategory(category as LogCategory);
      console.log(`❌ Disabled logging for: ${category.toUpperCase()}`);
    } else {
      console.log(`❌ Invalid category. Valid categories: ${validCategories.join(', ')}`);
    }
  },

  // Show current status
  status: () => {
    console.log('📊 Current logging configuration:');
    console.log('- Available categories:', Object.values(LogCategory));
    console.log('- Use loggingControls.quiet() for minimal logging');
    console.log('- Use loggingControls.normal() for standard logging');
    console.log('- Use loggingControls.verbose() for full debug logging');
    console.log('- Use loggingControls.setLevel("info") to set specific level');
    console.log('- Use loggingControls.enableCategory("rendering") to enable specific category');
  }
};

// Make available globally in development
if (import.meta.env.DEV) {
  (window as any).loggingControls = loggingControls;
  console.log('🎛️ Logging controls available via window.loggingControls');
  console.log('💡 Try: loggingControls.quiet() or loggingControls.status()');
}
