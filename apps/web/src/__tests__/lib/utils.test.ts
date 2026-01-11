/**
 * Utility Functions Tests
 *
 * Tests for common helper functions.
 */

import {
  cn,
  formatDate,
  formatDuration,
  truncate,
  getInitials,
  formatUsage,
  getRemainingPercentage,
  isValidEmail,
  getMembershipDisplayName,
} from '../../lib/utils';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('combines multiple class names', () => {
      expect(cn('btn', 'btn-primary', 'mt-4')).toBe('btn btn-primary mt-4');
    });

    it('filters out falsy values', () => {
      expect(cn('btn', false, null, undefined, 'active')).toBe('btn active');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('btn', isActive && 'active', isDisabled && 'disabled')).toBe(
        'btn active'
      );
    });

    it('returns empty string for no valid classes', () => {
      expect(cn(false, null, undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('formats date string', () => {
      const result = formatDate('2024-06-20');
      expect(result).toContain('June');
      expect(result).toContain('20');
      expect(result).toContain('2024');
    });

    it('accepts custom format options', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date, { month: 'short', day: 'numeric' });
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds under a minute', () => {
      expect(formatDuration(45)).toBe('0:45');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(330)).toBe('5:30');
    });

    it('formats hours, minutes, and seconds', () => {
      expect(formatDuration(3665)).toBe('1:01:05');
      expect(formatDuration(7230)).toBe('2:00:30');
    });

    it('pads single digit values', () => {
      expect(formatDuration(61)).toBe('1:01');
      expect(formatDuration(3601)).toBe('1:00:01');
    });
  });

  describe('truncate', () => {
    it('returns original text if shorter than max length', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('truncates text with ellipsis', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('returns exact length when equal to maxLength', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });

  describe('getInitials', () => {
    it('returns first letter for single name', () => {
      expect(getInitials('Alice')).toBe('A');
    });

    it('returns first and last initials for full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('handles multiple names', () => {
      expect(getInitials('John Michael Doe')).toBe('JD');
    });

    it('handles names with extra spaces', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD');
    });

    it('returns empty string for empty input', () => {
      expect(getInitials('')).toBe('');
    });
  });

  describe('formatUsage', () => {
    it('formats normal usage', () => {
      expect(formatUsage(3, 10)).toBe('3/10');
    });

    it('handles Infinity limit', () => {
      expect(formatUsage(5, Infinity)).toBe('5/Unlimited');
    });

    it('handles MAX_SAFE_INTEGER limit', () => {
      expect(formatUsage(5, Number.MAX_SAFE_INTEGER)).toBe('5/Unlimited');
    });

    it('handles zero count', () => {
      expect(formatUsage(0, 3)).toBe('0/3');
    });
  });

  describe('getRemainingPercentage', () => {
    it('calculates remaining percentage', () => {
      expect(getRemainingPercentage(2, 10)).toBe(80);
      expect(getRemainingPercentage(7, 10)).toBe(30);
    });

    it('returns 0 when fully used', () => {
      expect(getRemainingPercentage(10, 10)).toBe(0);
    });

    it('returns 100 for unlimited', () => {
      expect(getRemainingPercentage(100, Infinity)).toBe(100);
      expect(getRemainingPercentage(100, Number.MAX_SAFE_INTEGER)).toBe(100);
    });

    it('returns 0 for zero limit', () => {
      expect(getRemainingPercentage(0, 0)).toBe(0);
    });

    it('handles over-usage gracefully', () => {
      expect(getRemainingPercentage(15, 10)).toBe(0);
    });
  });

  describe('isValidEmail', () => {
    it('validates correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('getMembershipDisplayName', () => {
    it('returns correct display names', () => {
      expect(getMembershipDisplayName('A')).toBe('Basic');
      expect(getMembershipDisplayName('B')).toBe('Standard');
      expect(getMembershipDisplayName('C')).toBe('Premium');
    });
  });
});
