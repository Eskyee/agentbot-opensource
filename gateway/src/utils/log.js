/**
 * utils/log.js — structured console logger
 */

const isoNow = () => new Date().toISOString();

function write(level, ...args) {
  const prefix = `[${isoNow()}] [${level.toUpperCase()}]`;
  if (level === 'error') {
    console.error(prefix, ...args);
  } else if (level === 'warn') {
    console.warn(prefix, ...args);
  } else {
    console.log(prefix, ...args);
  }
}

export const log = {
  info:  (...a) => write('info',  ...a),
  warn:  (...a) => write('warn',  ...a),
  error: (...a) => write('error', ...a),
  debug: (...a) => {
    if (process.env.DEBUG) write('debug', ...a);
  },
};
