/**
 * Tests for EdCodeParser
 */

import { describe, it, expect } from 'vitest';
import { EdCodeParser } from '../src/parser';

describe('EdCodeParser', () => {
  describe('buildUrl', () => {
    it('should build correct URL for section', () => {
      const url = EdCodeParser.buildUrl('15278');
      expect(url).toBe(
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=15278.&lawCode=EDC'
      );
    });

    it('should handle decimal sections', () => {
      const url = EdCodeParser.buildUrl('44237.5');
      expect(url).toBe(
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=44237.5.&lawCode=EDC'
      );
    });
  });

  describe('parseSection', () => {
    it('should parse valid HTML content', () => {
      // Mock HTML content similar to actual structure
      const mockHtml = `
        <html>
          <body>
            <div id="codeLawSectionNoHead">
              Education Code - EDC
              ARTICLE 2. Citizens' Oversight Committee [15278 - 15282]
              15278.
              (a) If a bond measure authorized pursuant to paragraph (3)...
              (Added by Stats. 2000, Ch. 44, Sec. 3. Effective January 1, 2001.)
            </div>
          </body>
        </html>
      `;

      const result = EdCodeParser.parseSection(mockHtml, '15278');
      
      expect(result).toBeTruthy();
      expect(result?.section).toBe('15278');
      expect(result?.content).toContain('15278.');
      expect(result?.content).toContain('bond measure');
      expect(result?.url).toContain('15278');
    });

    it('should return null for invalid HTML', () => {
      const result = EdCodeParser.parseSection('<html></html>', '15278');
      expect(result).toBeNull();
    });

    it('should handle missing content div', () => {
      const mockHtml = '<html><body><div>Wrong content</div></body></html>';
      const result = EdCodeParser.parseSection(mockHtml, '15278');
      expect(result).toBeNull();
    });
  });
});