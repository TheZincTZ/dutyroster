import { CalendarMap, ExtrasPersonnel, PointSystem } from './types';

// Rate limiting configuration
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const ipRequests = new Map<string, { count: number; timestamp: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requestData = ipRequests.get(ip);

  if (!requestData) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (now - requestData.timestamp > RATE_LIMIT_WINDOW) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (requestData.count >= RATE_LIMIT) {
    return true;
  }

  requestData.count++;
  return false;
}

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW) {
      ipRequests.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

// Data validation functions
export function validateCalendarData(data: unknown): data is CalendarMap {
  if (typeof data !== 'object' || data === null) return false;
  
  const entries = Object.entries(data as Record<string, unknown>);
  return entries.every(([, entry]) => {
    if (typeof entry !== 'object' || entry === null) return false;
    const e = entry as Record<string, unknown>;
    return (
      typeof e.AM === 'string' &&
      typeof e.PM === 'string' &&
      typeof e.ReserveAM === 'string' &&
      typeof e.ReservePM === 'string'
    );
  });
}

export function validateExtrasPersonnel(data: unknown): data is ExtrasPersonnel[] {
  if (!Array.isArray(data)) return false;
  return data.every(item => 
    typeof item === 'object' &&
    item !== null &&
    typeof item.name === 'string' &&
    typeof item.number === 'number' &&
    item.name.length > 0
  );
}

export function validatePointSystem(data: unknown): data is PointSystem[] {
  if (!Array.isArray(data)) return false;
  return data.every(item =>
    typeof item === 'object' &&
    item !== null &&
    typeof item.unit === 'string' &&
    typeof item.shift === 'string' &&
    typeof item.name === 'string' &&
    typeof item.points === 'number' &&
    typeof item.months_valid === 'number' &&
    typeof item.average_points === 'number'
  );
}

// Input sanitization
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
}

export function sanitizeNumber(input: number): number {
  return Number(input) || 0;
}

// File validation
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'File too large' };
  }

  return { valid: true };
}

// PIN validation
export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

// Session management
export function setAuthenticatedSession() {
  if (typeof window !== 'undefined') {
    document.cookie = 'admin_authenticated=true; path=/; max-age=3600; SameSite=Strict; Secure';
  }
}

export function clearAuthenticatedSession() {
  if (typeof window !== 'undefined') {
    document.cookie = 'admin_authenticated=; path=/; max-age=0; SameSite=Strict; Secure';
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return document.cookie.includes('admin_authenticated=true');
} 