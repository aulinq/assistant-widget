/**
 * Generate a unique message ID
 */
export declare function generateId(): string;
/**
 * Format timestamp to readable time
 */
export declare function formatTime(timestamp: number): string;
/**
 * Debounce function
 */
export declare function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Sanitize HTML to prevent XSS
 */
export declare function sanitizeHtml(html: string): string;
/**
 * Check if string is valid JSON
 */
export declare function isValidJson(str: string): boolean;
/**
 * Deep clone object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Check if value is empty
 */
export declare function isEmpty(value: unknown): boolean;
/**
 * Truncate text with ellipsis
 */
export declare function truncate(text: string, maxLength: number): string;
/**
 * Safe JSON parse with fallback
 */
export declare function safeJsonParse<T>(json: string, fallback: T): T;
//# sourceMappingURL=index.d.ts.map