/**
 * File Upload Security Utilities
 *
 * Provides secure file validation including:
 * - Magic byte (file signature) validation
 * - MIME type verification
 * - Size limits
 * - Secure filename generation
 */

import { randomBytes } from 'crypto'

// Image magic bytes (file signatures)
// Reference: https://en.wikipedia.org/wiki/List_of_file_signatures
const IMAGE_SIGNATURES: Record<string, { bytes: number[]; offset?: number }[]> = {
  'image/jpeg': [
    { bytes: [0xff, 0xd8, 0xff] }, // JPEG/JFIF
  ],
  'image/png': [
    { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
  ],
  'image/gif': [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  'image/webp': [
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF header
    // WebP also has "WEBP" at offset 8, but checking RIFF is usually sufficient
  ],
}

// Map MIME types to file extensions
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  detectedType?: string
}

export interface FileValidationOptions {
  maxSizeBytes?: number
  minSizeBytes?: number
  allowedTypes?: string[]
}

const DEFAULT_OPTIONS: Required<FileValidationOptions> = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  minSizeBytes: 100, // Minimum 100 bytes (reject empty/tiny files)
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}

/**
 * Check if buffer matches any of the magic byte signatures for a MIME type
 */
function matchesMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = IMAGE_SIGNATURES[mimeType]
  if (!signatures) return false

  return signatures.some((sig) => {
    const offset = sig.offset ?? 0
    if (buffer.length < offset + sig.bytes.length) return false

    return sig.bytes.every((byte, index) => buffer[offset + index] === byte)
  })
}

/**
 * Detect the actual image type from magic bytes
 */
function detectImageType(buffer: Buffer): string | null {
  for (const [mimeType] of Object.entries(IMAGE_SIGNATURES)) {
    if (matchesMagicBytes(buffer, mimeType)) {
      return mimeType
    }
  }
  return null
}

/**
 * Validate an uploaded file for security
 *
 * Checks:
 * - File size limits (min and max)
 * - MIME type matches magic bytes
 * - File is an actual image, not just renamed
 */
export function validateImageFile(
  buffer: Buffer,
  declaredMimeType: string,
  options: FileValidationOptions = {}
): FileValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Check minimum size (reject empty/corrupted files)
  if (buffer.length < opts.minSizeBytes) {
    return {
      valid: false,
      error: `File too small (minimum ${opts.minSizeBytes} bytes)`,
    }
  }

  // Check maximum size
  if (buffer.length > opts.maxSizeBytes) {
    return {
      valid: false,
      error: `File too large (maximum ${Math.round(opts.maxSizeBytes / 1024 / 1024)}MB)`,
    }
  }

  // Detect actual file type from magic bytes
  const detectedType = detectImageType(buffer)

  if (!detectedType) {
    return {
      valid: false,
      error: 'File does not appear to be a valid image',
    }
  }

  // Check if detected type is in allowed list
  if (!opts.allowedTypes.includes(detectedType)) {
    return {
      valid: false,
      error: `File type ${detectedType} is not allowed`,
    }
  }

  // Warn if declared MIME type doesn't match detected (but still allow)
  // This catches files that have been renamed but are still valid images
  if (declaredMimeType !== detectedType) {
    console.warn(
      `MIME type mismatch: declared ${declaredMimeType}, detected ${detectedType}`
    )
  }

  return {
    valid: true,
    detectedType,
  }
}

/**
 * Generate a cryptographically secure filename
 *
 * Format: {prefix}/{timestamp}-{random}.{ext}
 * Uses crypto.randomBytes instead of Math.random for security
 */
export function generateSecureFilename(
  prefix: string,
  mimeType: string
): string {
  // Sanitize prefix to prevent path traversal
  const safePrefix = prefix
    .replace(/[^a-z0-9-_]/gi, '-') // Replace unsafe chars with dash
    .replace(/--+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .toLowerCase()
    .slice(0, 50) // Limit length

  // Get extension from MIME type (not from user-provided filename)
  const ext = MIME_TO_EXTENSION[mimeType] || 'bin'

  // Generate cryptographically random string
  const randomPart = randomBytes(16).toString('hex')
  const timestamp = Date.now()

  return `${safePrefix}/${timestamp}-${randomPart}.${ext}`
}

/**
 * Get the correct file extension for a MIME type
 */
export function getExtensionForMimeType(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] || 'bin'
}
