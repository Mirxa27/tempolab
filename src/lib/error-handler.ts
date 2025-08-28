// Global error handling utilities and custom error classes
import { ValidationError } from './validation';

// Custom error classes for different types of application errors
export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public isOperational: boolean;
  public timestamp: Date;
  public context?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed', context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', 0, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404, true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', context?: Record<string, any>) {
    super(message, 'CONFLICT_ERROR', 409, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, any>) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, context);
  }
}

export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing failed', context?: Record<string, any>) {
    super(message, 'PAYMENT_ERROR', 402, true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, context?: Record<string, any>) {
    super(
      message || `External service ${service} is unavailable`,
      'EXTERNAL_SERVICE_ERROR',
      503,
      true,
      { service, ...context }
    );
  }
}

// Error handler class for centralized error processing
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorReporters: ErrorReporter[] = [];

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public addReporter(reporter: ErrorReporter): void {
    this.errorReporters.push(reporter);
  }

  public async handleError(error: Error, context?: Record<string, any>): Promise<void> {
    const errorInfo = this.analyzeError(error);
    const enrichedContext = {
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error handled by ErrorHandler:', {
        error: errorInfo,
        context: enrichedContext,
      });
    }

    // Report to all registered reporters
    await Promise.all(
      this.errorReporters.map(reporter =>
        reporter.report(errorInfo, enrichedContext).catch(reportError =>
          console.error('Error reporter failed:', reportError)
        )
      )
    );
  }

  private analyzeError(error: Error): ErrorInfo {
    if (error instanceof AppError) {
      return {
        type: 'AppError',
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        stack: error.stack,
        context: error.context,
        timestamp: error.timestamp,
      };
    }

    if (error instanceof ValidationError) {
      return {
        type: 'ValidationError',
        code: 'VALIDATION_ERROR',
        message: error.message,
        statusCode: 400,
        isOperational: true,
        stack: error.stack,
        context: {
          fieldErrors: error.getFieldErrors(),
          firstError: error.getFirstError(),
        },
        timestamp: new Date(),
      };
    }

    if (error.name === 'ChunkLoadError') {
      return {
        type: 'ChunkLoadError',
        code: 'CHUNK_LOAD_ERROR',
        message: 'Failed to load application chunk',
        statusCode: 0,
        isOperational: true,
        stack: error.stack,
        context: { suggestion: 'Page refresh required' },
        timestamp: new Date(),
      };
    }

    // Unknown error
    return {
      type: 'UnknownError',
      code: 'UNKNOWN_ERROR',
      message: error.message,
      statusCode: 500,
      isOperational: false,
      stack: error.stack,
      context: { originalName: error.name },
      timestamp: new Date(),
    };
  }

  private getCurrentUserId(): string | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  }
}

// Error reporter interface
export interface ErrorReporter {
  report(error: ErrorInfo, context: Record<string, any>): Promise<void>;
}

// Error info interface
export interface ErrorInfo {
  type: string;
  code: string;
  message: string;
  statusCode: number;
  isOperational: boolean;
  stack?: string;
  context?: Record<string, any>;
  timestamp: Date;
}

// Console error reporter
export class ConsoleErrorReporter implements ErrorReporter {
  async report(error: ErrorInfo, context: Record<string, any>): Promise<void> {
    console.error('Error Report:', {
      error,
      context,
    });
  }
}

// Remote error reporter (for external services like Sentry)
export class RemoteErrorReporter implements ErrorReporter {
  constructor(private endpoint: string, private apiKey?: string) {}

  async report(error: ErrorInfo, context: Record<string, any>): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          error,
          context,
        }),
      });
    } catch (reportingError) {
      console.error('Failed to report error to remote service:', reportingError);
    }
  }
}

// Local storage error reporter (for offline error collection)
export class LocalStorageErrorReporter implements ErrorReporter {
  private maxErrors = 50;
  private storageKey = 'habibstay_error_logs';

  async report(error: ErrorInfo, context: Record<string, any>): Promise<void> {
    try {
      const errors = this.getStoredErrors();
      const newError = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        error,
        context,
        reported: false,
      };

      errors.unshift(newError);

      // Keep only the most recent errors
      if (errors.length > this.maxErrors) {
        errors.splice(this.maxErrors);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(errors));
    } catch (storageError) {
      console.error('Failed to store error in localStorage:', storageError);
    }
  }

  public getStoredErrors(): any[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public clearStoredErrors(): void {
    localStorage.removeItem(this.storageKey);
  }

  public getUnreportedErrors(): any[] {
    return this.getStoredErrors().filter(error => !error.reported);
  }

  public markErrorsAsReported(errorIds: string[]): void {
    const errors = this.getStoredErrors();
    errors.forEach(error => {
      if (errorIds.includes(error.id)) {
        error.reported = true;
      }
    });
    localStorage.setItem(this.storageKey, JSON.stringify(errors));
  }
}

// Error boundary for async operations
export const withAsyncErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance();
      await errorHandler.handleError(error as Error, {
        function: fn.name,
        arguments: args,
      });
      throw error;
    }
  };
};

// Utility functions for common error scenarios
export const handleApiError = (response: Response): Promise<never> => {
  const statusCode = response.status;
  
  switch (statusCode) {
    case 400:
      throw new ValidationError(new Error('Invalid request data'));
    case 401:
      throw new AuthenticationError('Please log in to continue');
    case 403:
      throw new AuthorizationError('You do not have permission to perform this action');
    case 404:
      throw new NotFoundError('Requested resource');
    case 409:
      throw new ConflictError('This action conflicts with existing data');
    case 429:
      throw new RateLimitError('Too many requests. Please try again later');
    case 500:
      throw new AppError('Internal server error. Please try again later');
    case 503:
      throw new ExternalServiceError('server', 'Service temporarily unavailable');
    default:
      throw new AppError(`Request failed with status ${statusCode}`);
  }
};

export const isRetryableError = (error: Error): boolean => {
  return error instanceof NetworkError ||
         error instanceof ExternalServiceError ||
         (error instanceof AppError && error.statusCode >= 500);
};

export const shouldShowToUser = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  
  if (error instanceof ValidationError) {
    return true;
  }
  
  return false;
};

export const getErrorMessage = (error: Error): string => {
  if (shouldShowToUser(error)) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again later.';
};

// Initialize global error handler
export const initializeErrorHandler = (): void => {
  const errorHandler = ErrorHandler.getInstance();
  
  // Add console reporter for development
  if (import.meta.env.DEV) {
    errorHandler.addReporter(new ConsoleErrorReporter());
  }
  
  // Add local storage reporter for offline error collection
  errorHandler.addReporter(new LocalStorageErrorReporter());
  
  // Add remote reporter if endpoint is configured
  const errorEndpoint = import.meta.env.VITE_ERROR_ENDPOINT;
  if (errorEndpoint) {
    errorHandler.addReporter(new RemoteErrorReporter(errorEndpoint));
  }
  
  // Global error handlers
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error || new Error(event.message), {
      type: 'unhandledError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        type: 'unhandledPromiseRejection',
      }
    );
  });
};

export default ErrorHandler;