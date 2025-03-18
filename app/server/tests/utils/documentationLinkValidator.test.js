/**
 * Unit Tests for Documentation Link Validator
 * 
 * These tests verify the functionality of the documentation link validation utilities.
 */

const path = require('path');
const fs = require('fs').promises;
const { 
  extractMarkdownLinks, 
  validateDocumentationLink,
  extractMarkdownMetadata
} = require('../../src/utils/documentationLinkExtractor');

// Mock fs.access to control file existence checks
jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');
  return {
    ...originalModule,
    promises: {
      ...originalModule.promises,
      access: jest.fn(),
      readFile: jest.fn()
    }
  };
});

describe('Documentation Link Validator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractMarkdownLinks', () => {
    test('should extract links from markdown content', () => {
      const markdownContent = `
# Documentation Title

This is a paragraph with a [link to something](path/to/something.md).
This is another paragraph with [another link](https://example.com).
This is a link to an [anchor](#section-id) in the same document.
      `;

      const links = extractMarkdownLinks(markdownContent);

      expect(links).toHaveLength(3);
      expect(links[0]).toEqual({
        text: 'link to something',
        url: 'path/to/something.md'
      });
      expect(links[1]).toEqual({
        text: 'another link',
        url: 'https://example.com'
      });
      expect(links[2]).toEqual({
        text: 'anchor',
        url: '#section-id'
      });
    });

    test('should return empty array when no links present', () => {
      const markdownContent = `
# Documentation Title

This is a paragraph with no links.
      `;

      const links = extractMarkdownLinks(markdownContent);

      expect(links).toHaveLength(0);
    });
  });

  describe('validateDocumentationLink', () => {
    test('should validate internal link correctly when file exists', async () => {
      // Mock fs.access to simulate file exists
      fs.access.mockResolvedValue(undefined);

      const validation = await validateDocumentationLink(
        'path/to/existing-file.md',
        '/base/path/source-file.md'
      );

      expect(validation.isValid).toBe(true);
      expect(validation.type).toBe('internal');
    });

    test('should invalidate internal link when file does not exist', async () => {
      // Mock fs.access to simulate file not found
      fs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const validation = await validateDocumentationLink(
        'path/to/non-existing-file.md',
        '/base/path/source-file.md'
      );

      expect(validation.isValid).toBe(false);
      expect(validation.type).toBe('internal');
      expect(validation.error).toBeDefined();
    });

    test('should validate external links without checking file system', async () => {
      // Mock fs.access to make sure it's not called
      fs.access.mockRejectedValue(new Error('Should not be called'));

      const validation = await validateDocumentationLink(
        'https://example.com',
        '/base/path/source-file.md'
      );

      expect(validation.isValid).toBe(true);
      expect(validation.type).toBe('external');
      expect(fs.access).not.toBeCalled();
    });

    test('should validate anchor links without checking file system', async () => {
      // Mock fs.access to make sure it's not called
      fs.access.mockRejectedValue(new Error('Should not be called'));

      const validation = await validateDocumentationLink(
        '#section-id',
        '/base/path/source-file.md'
      );

      expect(validation.isValid).toBe(true);
      expect(validation.type).toBe('anchor');
      expect(fs.access).not.toBeCalled();
    });
  });

  describe('extractMarkdownMetadata', () => {
    test('should extract YAML frontmatter from markdown', () => {
      const markdownWithMetadata = `---
title: Test Document
author: Test Author
version: 1.0.0
---

# Actual Content

This is the document content.
`;

      const { metadata, content } = extractMarkdownMetadata(markdownWithMetadata);

      expect(metadata).toEqual({
        title: 'Test Document',
        author: 'Test Author',
        version: '1.0.0'
      });
      expect(content).toContain('# Actual Content');
      expect(content).not.toContain('---');
    });

    test('should return empty metadata when no frontmatter exists', () => {
      const markdownWithoutMetadata = `# No Metadata

This document has no metadata.
`;

      const { metadata, content } = extractMarkdownMetadata(markdownWithoutMetadata);

      expect(metadata).toEqual({});
      expect(content).toBe(markdownWithoutMetadata);
    });
  });
});
