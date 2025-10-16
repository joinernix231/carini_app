// src/utils/logger.ts
// Sistema de logging condicional para desarrollo y producción

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
  enableInProduction: boolean;
  enableInDevelopment: boolean;
  logLevel: LogLevel;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableInProduction: false,
      enableInDevelopment: true,
      logLevel: 'debug',
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const isDev = __DEV__;
    
    if (isDev && this.config.enableInDevelopment) {
      return true;
    }
    
    if (!isDev && this.config.enableInProduction) {
      return true;
    }
    
    return false;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): [string, ...any[]] {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return [`${prefix} ${message}`, ...args];
  }

  log(message: string, ...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(...this.formatMessage('log', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', message, ...args));
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', message, ...args));
    }
  }

  // Métodos específicos para diferentes contextos
  api(message: string, ...args: any[]): void {
    this.debug(`🌐 API: ${message}`, ...args);
  }

  auth(message: string, ...args: any[]): void {
    this.debug(`🔐 AUTH: ${message}`, ...args);
  }

  navigation(message: string, ...args: any[]): void {
    this.debug(`🧭 NAV: ${message}`, ...args);
  }

  cache(message: string, ...args: any[]): void {
    this.debug(`💾 CACHE: ${message}`, ...args);
  }

  performance(message: string, ...args: any[]): void {
    this.debug(`⚡ PERF: ${message}`, ...args);
  }
}

// Instancia global del logger
export const logger = new Logger({
  enableInProduction: false, // Cambiar a true si necesitas logs en producción
  enableInDevelopment: true,
  logLevel: 'debug'
});

// Exportar también métodos individuales para compatibilidad
export const { log, info, warn, error, debug, api, auth, navigation, cache, performance } = logger;

export default logger;
