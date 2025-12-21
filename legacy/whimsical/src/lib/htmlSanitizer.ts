/**
 * Escapes HTML special characters to prevent XSS attacks
 * Use this for any user-generated or database content displayed in HTML
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escapes an array of strings for safe HTML display
 */
export function escapeHtmlArray(items: string[] | null | undefined): string[] {
  if (!items) return [];
  return items.map(escapeHtml);
}
