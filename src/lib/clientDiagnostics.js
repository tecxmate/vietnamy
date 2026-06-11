const MAX_LOGS = 30;
const logs = [];
let installed = false;

function pushLog(level, args) {
  logs.push({
    at: new Date().toISOString(),
    level,
    message: args.map(arg => {
      if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ').slice(0, 1000),
  });
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
}

export function installClientDiagnostics() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    pushLog('error', args);
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    pushLog('warn', args);
    originalWarn.apply(console, args);
  };

  window.addEventListener('error', event => {
    pushLog('error', [event.message || 'window error', event.filename, event.lineno]);
  });

  window.addEventListener('unhandledrejection', event => {
    pushLog('error', ['unhandled rejection', event.reason]);
  });
}

export function getClientLogs() {
  return logs.slice(-MAX_LOGS);
}
