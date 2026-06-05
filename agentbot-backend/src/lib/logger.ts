import util from 'util';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatValue(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`;
  }
  if (typeof value === 'string') {
    return value;
  }
  return util.inspect(value, { depth: 5, colors: false, compact: true, breakLength: 120 });
}

function formatMessage(args: unknown[]): string {
  if (args.length === 0) return '';
  return args.map(formatValue).join(' ');
}

function write(level: LogLevel, ...args: unknown[]) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    pid: process.pid,
    message: formatMessage(args),
  };

  const output = JSON.stringify(record);

  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else console.log(output);
}

export const log = {
  info: (...args: unknown[]) => write('info', ...args),
  warn: (...args: unknown[]) => write('warn', ...args),
  error: (...args: unknown[]) => write('error', ...args),
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG === 'true' || process.env.DEBUG === '1') {
      write('debug', ...args);
    }
  },
};
