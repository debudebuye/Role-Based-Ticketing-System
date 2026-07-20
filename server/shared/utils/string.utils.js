/**
 * Shared string utilities used across services.
 */

/** Escape special regex characters so user input can be safely used in $regex */
export const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** HTML-escape a string to prevent XSS when injecting into templates */
export const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
