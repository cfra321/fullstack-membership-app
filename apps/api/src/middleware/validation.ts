/**
 * Validation Middleware
 *
 * Provides request validation middleware for API endpoints.
 * Validates request bodies against defined schemas.
 */

import { type Request, type Response, type NextFunction } from 'express';

import { ValidationError } from '../utils/errors';
import { PASSWORD } from '../config/constants';

/**
 * Validation schema definition.
 */
interface ValidationSchema {
  [field: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
  };
}

/**
 * Validate email format.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a field against its schema.
 */
function validateField(
  value: unknown,
  fieldName: string,
  rules: ValidationSchema[string]
): string | null {
  // Check required
  if (rules.required && (value === undefined || value === null || value === '')) {
    return `${fieldName} is required`;
  }

  // Skip validation if not required and not provided
  if (value === undefined || value === null || value === '') {
    return null;
  }

  // Check type
  if (rules.type) {
    if (rules.type === 'email') {
      if (typeof value !== 'string' || !isValidEmail(value)) {
        return `${fieldName} must be a valid email address`;
      }
    } else if (rules.type === 'string' && typeof value !== 'string') {
      return `${fieldName} must be a string`;
    } else if (rules.type === 'number' && typeof value !== 'number') {
      return `${fieldName} must be a number`;
    } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
      return `${fieldName} must be a boolean`;
    }
  }

  // Check string length
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must be at most ${rules.maxLength} characters`;
    }
    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName} has an invalid format`;
    }
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
}

/**
 * Validate request body against a schema.
 *
 * @param schema - Validation schema
 * @returns Express middleware
 *
 * @example
 * router.post('/register', validate(registerSchema), registerHandler);
 */
export function validate(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, string> = {};
    const body = req.body as Record<string, unknown>;

    for (const [fieldName, rules] of Object.entries(schema)) {
      const error = validateField(body[fieldName], fieldName, rules);
      if (error) {
        errors[fieldName] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      next(new ValidationError(errors));
      return;
    }

    next();
  };
}

/**
 * Registration validation schema.
 */
export const registerSchema: ValidationSchema = {
  email: {
    required: true,
    type: 'email',
    maxLength: 255,
  },
  password: {
    required: true,
    type: 'string',
    minLength: PASSWORD.MIN_LENGTH,
    maxLength: 128,
  },
  displayName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
};

/**
 * Login validation schema.
 */
export const loginSchema: ValidationSchema = {
  email: {
    required: true,
    type: 'email',
  },
  password: {
    required: true,
    type: 'string',
    minLength: 1,
  },
};

/**
 * Validate registration request.
 */
export const validateRegister = validate(registerSchema);

/**
 * Validate login request.
 */
export const validateLogin = validate(loginSchema);
