/**
 * Error Tracking Module - Sentry Integration
 * Centralized error tracking for both frontend and backend
 */

// Backend-only Sentry initialization
let Sentry = null;
let isInitialized = false;

export async function initErrorTracking(dsn, environment = 'development') {
  if (isInitialized) return;

  try {
    // Dynamic import to avoid bundling Sentry in frontend
    const SentryModule = await import('@sentry/node');
    Sentry = SentryModule;

    Sentry.init({
      dsn,
      environment,
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      // Filter out noise
      beforeSend(event) {
        // Skip console.log level messages
        if (event.level === 'log') return null;
        // Skip certain error types that are expected
        if (event.exception?.values?.[0]?.type === 'AbortError') return null;
        return event;
      },
    });

    isInitialized = true;
    console.log('[ErrorTracking] Sentry initialized for backend');
  } catch (error) {
    console.warn('[ErrorTracking] Failed to initialize Sentry:', error.message);
  }
}

/**
 * Capture exception with context
 */
export function captureException(error, context = {}) {
  if (Sentry && isInitialized) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  // Always log to console as fallback
  console.error('[ErrorTracking]', error, context);
}

/**
 * Capture message with level
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (Sentry && isInitialized) {
    Sentry.captureMessage(message, level, {
      extra: context,
    });
  }
  console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
    '[ErrorTracking]',
    message,
    context
  );
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(breadcrumb) {
  if (Sentry && isInitialized) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user) {
  if (Sentry && isInitialized) {
    Sentry.setUser(user);
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (Sentry && isInitialized) {
    Sentry.setUser(null);
  }
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error, { ...context, function: fn.name });
      throw error;
    }
  };
}

/**
 * Express middleware for automatic error tracking
 */
export function sentryErrorHandler() {
  if (!Sentry || !isInitialized) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Don't handle 404s, validation errors, etc.
      if (error.status === 404 || error.status === 400) return false;
      return true;
    },
  });
}

/**
 * Request handler middleware for transaction tracking
 */
export function sentryRequestHandler() {
  if (!Sentry || !isInitialized) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
}