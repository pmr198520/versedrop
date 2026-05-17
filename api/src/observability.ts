// Thin observability wrapper. No-op by default.
// To switch to Sentry: `npm i @sentry/node`, then import and call Sentry.init
// inside `initObservability()` when SENTRY_DSN is set.

const dsn = process.env.SENTRY_DSN;
const env = process.env.NODE_ENV || 'development';

export function initObservability() {
  if (!dsn) return;
  // Hook point for Sentry / Datadog / Honeycomb. Keep this file dependency-free
  // so the api boots without any observability SDK installed.
  console.log(`[obs] SENTRY_DSN detected (env=${env}). Install @sentry/node and wire init here.`);
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  console.error('[error]', err, context ?? '');
}

export function logRequest(method: string, path: string, status: number, ms: number) {
  if (status >= 500) {
    console.error(`[req] ${method} ${path} → ${status} (${ms}ms)`);
  } else if (status >= 400) {
    console.warn(`[req] ${method} ${path} → ${status} (${ms}ms)`);
  } else if (env !== 'production' || ms > 500) {
    console.log(`[req] ${method} ${path} → ${status} (${ms}ms)`);
  }
}
