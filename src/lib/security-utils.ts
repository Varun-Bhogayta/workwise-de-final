// Security nonce for inline scripts
export const nonce = crypto.randomUUID();

// Content Security Policy
export const csp = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'strict-dynamic'",
    `'nonce-${nonce}'`,
    // Firebase domains
    "https://*.firebaseapp.com",
    "https://*.googleapis.com",
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "https:", "data:", "blob:"],
  "font-src": ["'self'"],
  "connect-src": [
    "'self'",
    // Firebase domains
    "https://*.firebaseio.com",
    "https://*.googleapis.com",
    "https://*.cloudfunctions.net",
    "wss://*.firebaseio.com",
  ],
  "frame-src": ["'self'", "https://*.firebaseapp.com"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
};

// Generate CSP string
export function generateCSP(): string {
  return Object.entries(csp)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(" ")}`;
    })
    .join("; ");
}

// Security headers
export const securityHeaders = {
  "Content-Security-Policy": generateCSP(),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// Sanitize HTML content
export function sanitizeHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

// Validate and sanitize URLs
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow certain protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

// Input validation and sanitization for user input
export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < and > characters
    .slice(0, 1000); // Limit length
}

// Generate and verify CSRF tokens
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

export function verifyCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  return token === storedToken;
}

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private timeWindow: number;

  constructor(maxAttempts: number = 5, timeWindow: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.timeWindow = timeWindow;
  }

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the time window
    const recentAttempts = attempts.filter(
      (timestamp) => now - timestamp < this.timeWindow
    );

    if (recentAttempts.length >= this.maxAttempts) {
      return true;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return false;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}
