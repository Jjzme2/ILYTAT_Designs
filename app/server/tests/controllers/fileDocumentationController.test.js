/**
 * Integration Tests for File Documentation Controller
 * 
 * These tests verify the API functionality for documentation link validation.
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const app = require('../../src/app');
const { resolveDocPath } = require('../../src/utils/documentationUtils');

// Mock fs module for validation testing
jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');
  const mockedContent = `
# Test Document

This is a [valid link](./valid-doc.md) and this is an [invalid link](./missing-doc.md).
This is an [external link](https://example.com).
  `;
  
  return {
    ...originalModule,
    promises: {
      ...originalModule.promises,
      readFile: jest.fn().mockResolvedValue(mockedContent),
      access: jest.fn().mockImplementation((path) => {
        if (path.includes('valid-doc.md') || path.includes('example.com')) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('ENOENT: no such file or directory'));
      }),
      stat: jest.fn().mockResolvedValue({ mtime: new Date() })
    }
  };
});

// Mock resolveDocPath to return a predictable path
jest.mock('../../src/utils/documentationUtils', () => ({
  resolveDocPath: jest.fn().mockReturnValue('/mocked/path/to/doc.md')
}));

describe('FileDocumentationController Integration Tests', () => {
  describe('GET /api/documentation/validate-links', () => {
    test('should validate links in a document', async () => {
      const response = await request(app)
        .get('/api/documentation/validate-links')
        .query({ path: 'test-doc.md' })
        .expect(200);
      
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalLinks).toBe(3);
      expect(response.body.data.validLinks).toBe(2);
      expect(response.body.data.invalidLinks).toBe(1);
      
      // Check valid links
      expect(response.body.data.details.valid).toHaveLength(2);
      expect(response.body.data.details.valid[0].url).toContain('valid-doc.md');
      
      // Check invalid links
      expect(response.body.data.details.invalid).toHaveLength(1);
      expect(response.body.data.details.invalid[0].url).toContain('missing-doc.md');
    });
    
    test('should return 400 when path is missing', async () => {
      const response = await request(app)
        .get('/api/documentation/validate-links')
        .expect(400);
      
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('path is required');
    });
  });
  
  describe('GET /api/documentation/central', () => {
    test('should retrieve documentation with validation', async () => {
      const response = await request(app)
        .get('/api/documentation/central')
        .query({ 
          path: 'test-doc.md',
          validateLinks: 'true',
          responseType: 'json'
        })
        .expect(200);
      
      expect(response.body.content).toBeDefined();
      expect(response.body.validation).toBeDefined();
      expect(response.body.validation.totalLinks).toBe(3);
      expect(response.body.validation.validLinks).toBe(2);
      expect(response.body.validation.invalidLinks).toBe(1);
    });
  });
});
