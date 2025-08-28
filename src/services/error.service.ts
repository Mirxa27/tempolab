import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';

// =====================================================
// ERROR TYPES AND INTERFACES
// =====================================================

export enum ErrorCode {
  // Authentication Errors (1000-1099)
  UNAUTHORIZED = 1001,
  FORBIDDEN = 1002,
  TOKEN_EXPIRED = 1003,
  INVALID_CREDENTIALS = 1004,
  ACCOUNT_SUSPENDED = 1005,
  EMAIL_NOT_VERIFIED = 1006,
  
  // Validation Errors (1100-1199)
  VALIDATION_ERROR = 1100,
  INVALID_INPUT = 1101,
  MISSING_REQUIRED_FIELD = 1102,
  INVALID_FORMAT = 1103,
  
  // Business Logic Errors (1200-1299)
  PROPERTY_NOT_AVAILABLE = 1201,
  BOOKING_CONFLICT = 1202,
  INSUFFICIENT_FUNDS = 1203,
  LIMIT_EXCEEDED = 1204,
  OPERATION_NOT_ALLOWED = 1205,
  
  // Resource Errors (1300-1399)
  NOT_FOUND = 1301,
  ALREADY_EXISTS = 1302,
  RESOURCE_LOCKED = 1303,
  RESOURCE_EXPIRED = 1304,
  
  // Network Errors (1400-1499)
  NETWORK_ERROR = 1401,
  TIMEOUT = 1402,
  SERVICE_UNAVAILABLE = 1403,
  
  // Server Errors (1500-1599)
  INTERNAL_SERVER_ERROR = 1500,
  DATABASE_ERROR = 1501,
  EXTERNAL_SERVICE_ERROR = 1502,
  
  // Client Errors (1600-1699)
  BAD_REQUEST = 1600,
  RATE_LIMIT_EXCEEDED = 1601,
  PAYLOAD_TOO_LARGE = 1602,
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: any;
  field?: string;
  timestamp: string;
  requestId?: string;
  stack?: string;
}

export class AppError extends Error {
  public code: ErrorCode;
  public details?: any;
  public field?: string;
  public timestamp: string;
  public requestId?: string;
  public isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Set prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// =====================================================
// ERROR HANDLER SERVICE
// =====================================================

class ErrorService {
  private static instance: ErrorService;
  private errorQueue: ErrorDetails[] = [];
  private maxQueueSize = 50;
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  // =====================================================
  // GLOBAL ERROR HANDLERS
  // =====================================================

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        this.handleError(event.reason);
        event.preventDefault();
      });

      // Handle global errors
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        this.handleError(event.error);
      });
    }
  }

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  public handleError(error: any): ErrorDetails {
    const errorDetails = this.normalizeError(error);
    
    // Add to error queue
    this.addToQueue(errorDetails);
    
    // Log error
    this.logError(errorDetails);
    
    // Send to monitoring service
    this.reportToMonitoring(errorDetails);
    
    // Show user notification based on error type
    this.notifyUser(errorDetails);
    
    return errorDetails;
  }

  private normalizeError(error: any): ErrorDetails {
    // Handle AppError
    if (error instanceof AppError) {
      return {
        code: error.code,
        message: error.message,
        details: error.details,
        field: error.field,
        timestamp: error.timestamp,
        requestId: error.requestId,
        stack: error.stack,
      };
    }
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
        timestamp: new Date().toISOString(),
      };
    }
    
    // Handle network errors
    if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
      return {
        code: ErrorCode.NETWORK_ERROR,
        message: 'Network error occurred. Please check your connection.',
        details: error.message,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Handle timeout errors
    if (error?.name === 'TimeoutError' || error?.code === 'ECONNABORTED') {
      return {
        code: ErrorCode.TIMEOUT,
        message: 'Request timed out. Please try again.',
        details: error.message,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Handle HTTP errors
    if (error?.response) {
      const status = error.response.status;
      let code = ErrorCode.INTERNAL_SERVER_ERROR;
      let message = 'An error occurred';
      
      switch (status) {
        case 400:
          code = ErrorCode.BAD_REQUEST;
          message = 'Bad request';
          break;
        case 401:
          code = ErrorCode.UNAUTHORIZED;
          message = 'Unauthorized. Please log in.';
          break;
        case 403:
          code = ErrorCode.FORBIDDEN;
          message = 'Access forbidden';
          break;
        case 404:
          code = ErrorCode.NOT_FOUND;
          message = 'Resource not found';
          break;
        case 429:
          code = ErrorCode.RATE_LIMIT_EXCEEDED;
          message = 'Too many requests. Please slow down.';
          break;
        case 500:
          code = ErrorCode.INTERNAL_SERVER_ERROR;
          message = 'Server error. Please try again later.';
          break;
        case 503:
          code = ErrorCode.SERVICE_UNAVAILABLE;
          message = 'Service temporarily unavailable';
          break;
      }
      
      return {
        code,
        message: error.response.data?.message || message,
        details: error.response.data,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Default error
    return {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: error?.message || 'An unexpected error occurred',
      details: error,
      timestamp: new Date().toISOString(),
      stack: error?.stack,
    };
  }

  // =====================================================
  // USER NOTIFICATION
  // =====================================================

  private notifyUser(error: ErrorDetails) {
    // Determine notification type based on error code
    const isAuthError = error.code >= 1000 && error.code < 1100;
    const isValidationError = error.code >= 1100 && error.code < 1200;
    const isBusinessError = error.code >= 1200 && error.code < 1300;
    const isNetworkError = error.code >= 1400 && error.code < 1500;
    const isServerError = error.code >= 1500 && error.code < 1600;
    
    // Don't show toast for certain errors
    const silentErrors = [
      ErrorCode.TOKEN_EXPIRED, // Handle silently with refresh
    ];
    
    if (silentErrors.includes(error.code)) {
      return;
    }
    
    // Determine toast variant
    let variant: 'default' | 'destructive' = 'destructive';
    let title = 'Error';
    let description = error.message;
    let action = undefined;
    
    if (isAuthError) {
      title = 'Authentication Error';
      if (error.code === ErrorCode.UNAUTHORIZED) {
        action = {
          label: 'Sign In',
          onClick: () => window.location.href = '/signin',
        };
      }
    } else if (isValidationError) {
      title = 'Validation Error';
      variant = 'default';
      if (error.details && Array.isArray(error.details)) {
        description = error.details.map((d: any) => d.message).join(', ');
      }
    } else if (isBusinessError) {
      title = 'Operation Failed';
    } else if (isNetworkError) {
      title = 'Connection Error';
      action = {
        label: 'Retry',
        onClick: () => window.location.reload(),
      };
    } else if (isServerError) {
      title = 'Server Error';
      description = 'Something went wrong on our end. Please try again later.';
    }
    
    // Show toast notification
    toast({
      title,
      description,
      variant,
      action: action ? (
        <Button size="sm" variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : undefined,
    });
  }

  // =====================================================
  // ERROR LOGGING
  // =====================================================

  private logError(error: ErrorDetails) {
    const logLevel = this.getLogLevel(error.code);
    const logMessage = `[${logLevel}] ${error.code}: ${error.message}`;
    
    switch (logLevel) {
      case 'ERROR':
        console.error(logMessage, error);
        break;
      case 'WARN':
        console.warn(logMessage, error);
        break;
      case 'INFO':
        console.info(logMessage, error);
        break;
      default:
        console.log(logMessage, error);
    }
    
    // Store in local storage for debugging
    if (typeof window !== 'undefined') {
      try {
        const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
        logs.push({
          ...error,
          level: logLevel,
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
        
        // Keep only last 50 errors
        if (logs.length > 50) {
          logs.splice(0, logs.length - 50);
        }
        
        localStorage.setItem('errorLogs', JSON.stringify(logs));
      } catch (e) {
        console.error('Failed to store error log:', e);
      }
    }
  }

  private getLogLevel(code: ErrorCode): string {
    if (code >= 1500) return 'ERROR';
    if (code >= 1400) return 'WARN';
    if (code >= 1100 && code < 1200) return 'INFO';
    return 'ERROR';
  }

  // =====================================================
  // ERROR REPORTING
  // =====================================================

  private reportToMonitoring(error: ErrorDetails) {
    // Send to Sentry or other monitoring service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(error.message), {
        tags: {
          errorCode: error.code,
        },
        extra: error.details,
        level: this.getSeverityLevel(error.code),
      });
    }
    
    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: error.code >= 1500,
      });
    }
  }

  private getSeverityLevel(code: ErrorCode): string {
    if (code >= 1500) return 'error';
    if (code >= 1400) return 'warning';
    return 'info';
  }

  // =====================================================
  // ERROR RECOVERY
  // =====================================================

  public async retryOperation<T>(
    operation: () => Promise<T>,
    operationId: string,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
      backoff?: boolean;
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries || this.maxRetries;
    const retryDelay = options?.retryDelay || 1000;
    const backoff = options?.backoff !== false;
    
    const attempts = this.retryAttempts.get(operationId) || 0;
    
    try {
      const result = await operation();
      this.retryAttempts.delete(operationId);
      return result;
    } catch (error) {
      if (attempts >= maxRetries) {
        this.retryAttempts.delete(operationId);
        throw error;
      }
      
      this.retryAttempts.set(operationId, attempts + 1);
      
      // Calculate delay with exponential backoff
      const delay = backoff ? retryDelay * Math.pow(2, attempts) : retryDelay;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the operation
      return this.retryOperation(operation, operationId, options);
    }
  }

  // =====================================================
  // ERROR QUEUE MANAGEMENT
  // =====================================================

  private addToQueue(error: ErrorDetails) {
    this.errorQueue.push(error);
    
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  public getErrorHistory(): ErrorDetails[] {
    return [...this.errorQueue];
  }

  public clearErrorHistory() {
    this.errorQueue = [];
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  public isNetworkError(error: any): boolean {
    const errorDetails = this.normalizeError(error);
    return errorDetails.code >= 1400 && errorDetails.code < 1500;
  }

  public isAuthError(error: any): boolean {
    const errorDetails = this.normalizeError(error);
    return errorDetails.code >= 1000 && errorDetails.code < 1100;
  }

  public isValidationError(error: any): boolean {
    const errorDetails = this.normalizeError(error);
    return errorDetails.code >= 1100 && errorDetails.code < 1200;
  }

  public isServerError(error: any): boolean {
    const errorDetails = this.normalizeError(error);
    return errorDetails.code >= 1500 && errorDetails.code < 1600;
  }

  public createError(
    code: ErrorCode,
    message: string,
    details?: any
  ): AppError {
    return new AppError(code, message, details);
  }
}

// Export singleton instance
export const errorService = ErrorService.getInstance();

// Export convenience functions
export const handleError = (error: any) => errorService.handleError(error);
export const createError = (code: ErrorCode, message: string, details?: any) => 
  errorService.createError(code, message, details);
export const retryOperation = <T>(
  operation: () => Promise<T>,
  operationId: string,
  options?: any
) => errorService.retryOperation(operation, operationId, options);

// Type guard for AppError
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};