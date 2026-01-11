/**
 * Integration tests for Express application
 *
 * Tests the Express app configuration, middleware, and health endpoint.
 */

import request from 'supertest';

import { createApp } from '../app';

describe('Express App', () => {
  const app = createApp();

  describe('GET /api/health', () => {
    it('should return 200 with status ok', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/api/health');

      const timestamp = response.body.data.timestamp;
      const parsed = new Date(timestamp);

      expect(parsed.toISOString()).toBe(timestamp);
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle preflight OPTIONS request', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('JSON Body Parsing', () => {
    it('should parse JSON request body', async () => {
      // Since we don't have a POST endpoint yet, we'll test that
      // the middleware is configured by checking content-type handling
      const response = await request(app)
        .post('/api/nonexistent')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Should get 404 (route not found) not 400 (parse error)
      expect(response.status).toBe(404);
    });
  });

  describe('Cookie Parser', () => {
    it('should be able to read cookies from request', async () => {
      // Cookie parser is configured - testing it's loaded
      // The actual cookie functionality will be tested in auth routes
      const response = await request(app)
        .get('/api/health')
        .set('Cookie', 'test=value');

      expect(response.status).toBe(200);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should return 404 for non-API routes', async () => {
      const response = await request(app).get('/some/random/path');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Security Headers (Helmet)', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/api/health');

      // Helmet adds various security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
