type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    meta?: object,
  ): string {
    const timestamp = this.getTimestamp();
    const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
  }

  info(message: string, meta?: object | any): void {
    console.log(this.formatMessage("info", message, meta));
  }

  warn(message: string, meta?: object): void {
    console.warn(this.formatMessage("warn", message, meta));
  }

  error(message: string, meta?: object): void {
    console.error(this.formatMessage("error", message, meta));
  }

  debug(message: string, meta?: object): void {
    if (process.env.NODE_ENV === "dev") {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }
}

export const logger = new Logger();
