/**
 * Format bytes to human-readable file size
 * @param bytes - File size in bytes
 * @returns Formatted string like "1.2 KB" or "3.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
