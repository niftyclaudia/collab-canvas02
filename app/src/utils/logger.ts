/**
 * Centralized logging utility for the application
 * Allows easy control of log levels and categories
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4
}

export enum LogCategory {
  AI = 'ai',
  CANVAS = 'canvas',
  AUTH = 'auth',
  DATABASE = 'database',
  RENDERING = 'rendering',
  TESTING = 'testing'
}

interface LogConfig {
  level: LogLevel;
  enabledCategories: Set<LogCategory>;
  showTimestamps: boolean;
}

class Logger {
  private config: LogConfig = {
    level: LogLevel.INFO, // Default to INFO level
    enabledCategories: new Set([
      LogCategory.AI,
      LogCategory.CANVAS,
      LogCategory.AUTH,
      LogCategory.DATABASE,
      LogCategory.ERROR
    ]),
    showTimestamps: false
  };

  constructor() {
    // In development, enable more verbose logging
    if (import.meta.env.DEV) {
      this.config.level = LogLevel.DEBUG;
      this.config.enabledCategories.add(LogCategory.TESTING);
      this.config.enabledCategories.add(LogCategory.RENDERING);
    }
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    return level <= this.config.level && this.config.enabledCategories.has(category);
  }

  private formatMessage(level: string, category: LogCategory, message: string, ...args: any[]): [string, ...any[]] {
    const timestamp = this.config.showTimestamps ? `[${new Date().toISOString()}] ` : '';
    const prefix = `${timestamp}${level} [${category.toUpperCase()}]`;
    return [`${prefix} ${message}`, ...args];
  }

  error(category: LogCategory, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR, category)) {
      console.error(...this.formatMessage('❌', category, message, ...args));
    }
  }

  warn(category: LogCategory, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN, category)) {
      console.warn(...this.formatMessage('⚠️', category, message, ...args));
    }
  }

  info(category: LogCategory, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO, category)) {
      console.log(...this.formatMessage('ℹ️', category, message, ...args));
    }
  }

  debug(category: LogCategory, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      console.log(...this.formatMessage('🔧', category, message, ...args));
    }
  }

  verbose(category: LogCategory, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.VERBOSE, category)) {
      console.log(...this.formatMessage('🔍', category, message, ...args));
    }
  }

  // Convenience methods for common use cases
  ai(message: string, ...args: any[]): void {
    this.info(LogCategory.AI, message, ...args);
  }

  aiDebug(message: string, ...args: any[]): void {
    this.debug(LogCategory.AI, message, ...args);
  }

  canvas(message: string, ...args: any[]): void {
    this.info(LogCategory.CANVAS, message, ...args);
  }

  canvasDebug(message: string, ...args: any[]): void {
    this.debug(LogCategory.CANVAS, message, ...args);
  }

  auth(message: string, ...args: any[]): void {
    this.info(LogCategory.AUTH, message, ...args);
  }

  database(message: string, ...args: any[]): void {
    this.info(LogCategory.DATABASE, message, ...args);
  }

  rendering(message: string, ...args: any[]): void {
    this.verbose(LogCategory.RENDERING, message, ...args);
  }

  testing(message: string, ...args: any[]): void {
    this.info(LogCategory.TESTING, message, ...args);
  }

  // Configuration methods
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  enableCategory(category: LogCategory): void {
    this.config.enabledCategories.add(category);
  }

  disableCategory(category: LogCategory): void {
    this.config.enabledCategories.delete(category);
  }

  setShowTimestamps(show: boolean): void {
    this.config.showTimestamps = show;
  }

  // Quick setup for different environments
  enableProductionMode(): void {
    this.config.level = LogLevel.WARN;
    this.config.enabledCategories.clear();
    this.config.enabledCategories.add(LogCategory.AI);
    this.config.enabledCategories.add(LogCategory.CANVAS);
    this.config.enabledCategories.add(LogCategory.AUTH);
    this.config.enabledCategories.add(LogCategory.DATABASE);
  }

  enableDevelopmentMode(): void {
    this.config.level = LogLevel.DEBUG;
    this.config.enabledCategories.add(LogCategory.TESTING);
    this.config.enabledCategories.add(LogCategory.RENDERING);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for global access in development
if (import.meta.env.DEV) {
  (window as any).logger = logger;
}
