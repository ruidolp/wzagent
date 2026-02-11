import { appConfig } from '../config/app.config'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logData = data ? JSON.stringify(data, null, 2) : ''

    const output = `[${timestamp}] [${level.toUpperCase()}] ${message} ${logData}`

    switch (level) {
      case 'debug':
        if (appConfig.logging.debugLogs) {
          console.debug(output)
        }
        break
      case 'info':
        console.info(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'error':
        console.error(output)
        break
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }
}

export const logger = new Logger()
