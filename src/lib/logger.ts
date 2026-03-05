type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getConfiguredLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel | undefined;
  return env && env in LEVELS ? env : "info";
}

export function createLogger(context: string) {
  const configuredLevel = getConfiguredLevel();

  function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    if (LEVELS[level] < LEVELS[configuredLevel]) return;
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...data,
    };
    const output = JSON.stringify(entry);
    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  return {
    debug: (msg: string, data?: Record<string, unknown>) => log("debug", msg, data),
    info: (msg: string, data?: Record<string, unknown>) => log("info", msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log("warn", msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log("error", msg, data),
  };
}
