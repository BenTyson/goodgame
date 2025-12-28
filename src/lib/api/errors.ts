/**
 * API Error Handling Utilities
 *
 * Provides safe error responses that don't leak internal details to clients.
 * Logs full error details server-side for debugging.
 */

import { NextResponse } from 'next/server'

/**
 * Error codes for client-side handling.
 * Use these instead of exposing internal error messages.
 */
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

/**
 * Generic error messages that are safe to expose to clients.
 */
const safeMessages: Record<ErrorCodeType, string> = {
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.VALIDATION_ERROR]: 'Invalid request data',
  [ErrorCode.CONFLICT]: 'This resource already exists',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred',
  [ErrorCode.UPLOAD_FAILED]: 'File upload failed',
  [ErrorCode.DATABASE_ERROR]: 'Unable to complete the operation',
}

/**
 * HTTP status codes for each error type.
 */
const statusCodes: Record<ErrorCodeType, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.UPLOAD_FAILED]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
}

interface ErrorLogContext {
  route?: string
  userId?: string
  action?: string
  [key: string]: unknown
}

/**
 * Log error details server-side only.
 * Never expose these details to clients.
 */
function logError(
  code: ErrorCodeType,
  error: unknown,
  context?: ErrorLogContext
): void {
  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error(
    JSON.stringify({
      timestamp,
      level: 'error',
      code,
      message: errorMessage,
      stack: errorStack,
      ...context,
    })
  )
}

/**
 * Create a sanitized error response.
 * Logs the full error server-side but returns a generic message to the client.
 *
 * @param code - The error code (used for logging and client error handling)
 * @param error - The original error (logged server-side only)
 * @param customMessage - Optional custom message to override the default
 * @param context - Additional context for logging
 */
export function apiError(
  code: ErrorCodeType,
  error?: unknown,
  customMessage?: string,
  context?: ErrorLogContext
): NextResponse {
  // Log full error details server-side
  if (error) {
    logError(code, error, context)
  }

  // Return sanitized response to client
  return NextResponse.json(
    {
      error: customMessage || safeMessages[code],
      code,
    },
    { status: statusCodes[code] }
  )
}

/**
 * Common error response shortcuts
 */
export const ApiErrors = {
  unauthorized: (error?: unknown, context?: ErrorLogContext) =>
    apiError(ErrorCode.UNAUTHORIZED, error, undefined, context),

  forbidden: (error?: unknown, context?: ErrorLogContext) =>
    apiError(ErrorCode.FORBIDDEN, error, undefined, context),

  notFound: (resource?: string, error?: unknown, context?: ErrorLogContext) =>
    apiError(
      ErrorCode.NOT_FOUND,
      error,
      resource ? `${resource} not found` : undefined,
      context
    ),

  validation: (message: string, error?: unknown, context?: ErrorLogContext) =>
    apiError(ErrorCode.VALIDATION_ERROR, error, message, context),

  conflict: (message: string, error?: unknown, context?: ErrorLogContext) =>
    apiError(ErrorCode.CONFLICT, error, message, context),

  internal: (error?: unknown, context?: ErrorLogContext) =>
    apiError(ErrorCode.INTERNAL_ERROR, error, undefined, context),

  upload: (error?: unknown, context?: ErrorLogContext) =>
    apiError(ErrorCode.UPLOAD_FAILED, error, undefined, context),

  database: (error?: unknown, context?: ErrorLogContext) =>
    apiError(ErrorCode.DATABASE_ERROR, error, undefined, context),
}
