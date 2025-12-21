/**
 * Password security utilities using HaveIBeenPwned API with k-anonymity.
 * The full password never leaves the device - only the first 5 chars of the SHA-1 hash are sent.
 */

async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export interface PasswordCheckResult {
  isCompromised: boolean;
  breachCount?: number;
  error?: string;
}

/**
 * Check if a password has been exposed in known data breaches.
 * Uses k-anonymity: only sends first 5 chars of SHA-1 hash to API.
 * The full password hash never leaves the device.
 */
export async function checkPasswordBreach(password: string): Promise<PasswordCheckResult> {
  try {
    const hash = await sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Adds fake responses to prevent timing attacks
      },
    });

    if (!response.ok) {
      // Don't block signup if API is down - log and continue
      console.warn('HIBP API unavailable:', response.status);
      return { isCompromised: false };
    }

    const text = await response.text();
    const hashes = text.split('\n');

    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return {
          isCompromised: true,
          breachCount: parseInt(count.trim(), 10),
        };
      }
    }

    return { isCompromised: false };
  } catch (error) {
    // Don't block signup on network errors
    console.warn('Password breach check failed:', error);
    return { isCompromised: false, error: 'Check unavailable' };
  }
}

/**
 * Validate password strength with security requirements.
 */
export interface PasswordStrengthResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'strong';
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Include at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Include at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Include at least one number');
  } else {
    score += 1;
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Include at least one special character');
  } else {
    score += 1;
  }

  // Common password patterns to reject
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password is too common');
      score = Math.max(0, score - 2);
      break;
    }
  }

  let strength: 'weak' | 'fair' | 'strong' = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'fair';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}
