/**
 * Rate Limiting Middleware Tests
 *
 * Tests for rate limiting middleware to prevent brute force attacks.
 */

import request from 'supertest';
import express, { type Express } from 'express';

import { createAuthRateLimiter, createGeneralRateLimiter } from '../../middleware/rateLimit';

// Helper to create test app with rate limiter
function createTestApp(rateLimiter: ReturnType<typeof createAuthRateLimiter>): Express {
  const app = express();
  app.use(rateLimiter);
  app.get('/test', (_req, res) => {
    res.status(200).json({ data: { message: 'success' } });
  });
  return app;
}

describe('Rate Limiting Middleware', () => {
  describe('Auth Rate Limiter', () => {
    let app: Express;

    beforeEach(() => {
      // Create a fresh rate limiter for each test with 5 requests per minute
      const rateLimiter = createAuthRateLimiter({
        windowMs: 60000, // 1 minute
        max: 5,
      });
      app = createTestApp(rateLimiter);
    });

    it('should allow requests under limit (5 per minute)', async () => {
      // Make 5 requests - all should succeed
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
        expect(response.body.data.message).toBe('success');
      }
    });

    it('should block 6th request within window', async () => {
      // Make 5 successful requests
      for (let i = 0; i < 5; i++) {
        await request(app).get('/test');
      }

      // 6th request should be blocked
      const response = await request(app).get('/test');

      expect(response.status).toBe(429);
    });

    it('should return 429 with RATE_LIMITED error code', async () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await request(app).get('/test');
      }

      // Check the error response
      const response = await request(app).get('/test');

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('RATE_LIMITED');
      expect(response.body.error.message).toBeDefined();
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/test');

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should decrement remaining count with each request', async () => {
      const response1 = await request(app).get('/test');
      const remaining1 = parseInt(response1.headers['ratelimit-remaining'], 10);

      const response2 = await request(app).get('/test');
      const remaining2 = parseInt(response2.headers['ratelimit-remaining'], 10);

      expect(remaining2).toBe(remaining1 - 1);
    });

    it('should show 0 remaining when limit reached', async () => {
      // Make 5 requests
      let lastResponse;
      for (let i = 0; i < 5; i++) {
        lastResponse = await request(app).get('/test');
      }

      expect(lastResponse!.headers['ratelimit-remaining']).toBe('0');
    });
  });

  describe('Auth Rate Limiter - Reset after window', () => {
    it('should reset after window expires', async () => {
      // Create rate limiter with very short window (100ms)
      const rateLimiter = createAuthRateLimiter({
        windowMs: 100, // 100ms window for testing
        max: 2,
      });
      const app = createTestApp(rateLimiter);

      // Exhaust the limit
      await request(app).get('/test');
      await request(app).get('/test');

      // 3rd request should be blocked
      const blockedResponse = await request(app).get('/test');
      expect(blockedResponse.status).toBe(429);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Now request should succeed
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });
  });

  describe('General Rate Limiter', () => {
    let app: Express;

    beforeEach(() => {
      // Create general rate limiter with higher limit
      const rateLimiter = createGeneralRateLimiter({
        windowMs: 60000,
        max: 10, // Higher limit for testing
      });
      app = createTestApp(rateLimiter);
    });

    it('should allow more requests than auth limiter', async () => {
      // Make 10 requests - all should succeed
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
      }
    });

    it('should block when limit exceeded', async () => {
      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        await request(app).get('/test');
      }

      // 11th request should be blocked
      const response = await request(app).get('/test');
      expect(response.status).toBe(429);
      expect(response.body.error.code).toBe('RATE_LIMITED');
    });
  });

  describe('Rate Limiter with IP identification', () => {
    it('should track limits per IP address', async () => {
      const rateLimiter = createAuthRateLimiter({
        windowMs: 60000,
        max: 2,
      });
      const app = createTestApp(rateLimiter);

      // Simulate requests from IP 1 (exhaust limit)
      await request(app).get('/test').set('X-Forwarded-For', '192.168.1.1');
      await request(app).get('/test').set('X-Forwarded-For', '192.168.1.1');

      // IP 1 should be blocked
      const blockedResponse = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.1');
      expect(blockedResponse.status).toBe(429);

      // IP 2 should still have full quota
      const response = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.2');
      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiter Error Response Format', () => {
    it('should return properly formatted error response', async () => {
      const rateLimiter = createAuthRateLimiter({
        windowMs: 60000,
        max: 1,
      });
      const app = createTestApp(rateLimiter);

      // Exhaust limit
      await request(app).get('/test');

      // Check error format
      const response = await request(app).get('/test');

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        error: {
          code: 'RATE_LIMITED',
          message: expect.any(String),
        },
      });
    });

    it('should include retry-after header when blocked', async () => {
      const rateLimiter = createAuthRateLimiter({
        windowMs: 60000,
        max: 1,
      });
      const app = createTestApp(rateLimiter);

      // Exhaust limit
      await request(app).get('/test');

      // Check headers
      const response = await request(app).get('/test');

      expect(response.headers).toHaveProperty('retry-after');
    });
  });
});
