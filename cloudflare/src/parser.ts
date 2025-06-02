/**
 * HTML parser for CA Education Code sections
 */

import { parse } from 'node-html-parser';
import { EdCodeSection } from './types';

export class EdCodeParser {
  private static readonly BASE_URL = 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml';

  /**
   * Parse HTML content to extract Ed Code section
   */
  static parseSection(html: string, section: string): EdCodeSection | null {
    try {
      const root = parse(html);
      
      // Find the content div
      const contentDiv = root.querySelector('#codeLawSectionNoHead');
      if (!contentDiv) {
        console.error('Content div not found');
        return null;
      }

      const fullText = contentDiv.text.trim();
      if (!fullText) {
        return null;
      }

      // Extract title
      const title = this.extractTitle(fullText, section);
      
      // Extract and clean content
      const content = this.extractContent(fullText, section);
      
      if (!content) {
        return null;
      }

      // Build URL
      const url = `${this.BASE_URL}?sectionNum=${section}.&lawCode=EDC`;

      return {
        section,
        title,
        content,
        url
      };
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  /**
   * Extract title from the full text
   */
  private static extractTitle(text: string, section: string): string {
    // Look for ARTICLE pattern before the section number
    const beforeSection = text.split(`${section}.`)[0];
    
    // Find the last ARTICLE heading
    const articleMatch = beforeSection.match(/ARTICLE\s+\d+[^[]*\[([^\]]+)\]/g);
    if (articleMatch && articleMatch.length > 0) {
      const lastArticle = articleMatch[articleMatch.length - 1];
      // Clean up the article text
      return lastArticle.replace(/\[[^\]]+\]/, '').trim();
    }
    
    return `Education Code Section ${section}`;
  }

  /**
   * Extract and clean the section content
   */
  private static extractContent(text: string, section: string): string {
    // Find where the section content starts
    const sectionPattern = new RegExp(`${section}\\.`);
    const match = text.match(sectionPattern);
    
    if (!match || match.index === undefined) {
      return '';
    }

    // Extract content starting AFTER the section number and period
    let content = text.substring(match.index + match[0].length).trim();
    
    // Find where it ends (look for amendment citations)
    const endPatterns = [
      /\(Added by Stats\./,
      /\(Amended by Stats\./,
      /\(Repealed and added by Stats\./
    ];
    
    for (const pattern of endPatterns) {
      const endMatch = content.match(pattern);
      if (endMatch && endMatch.index !== undefined) {
        // Include the citation but stop after the closing parenthesis
        const citationEnd = content.indexOf(')', endMatch.index);
        if (citationEnd !== -1) {
          content = content.substring(0, citationEnd + 1);
        }
        break;
      }
    }
    
    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    // Add proper paragraph breaks
    content = content.replace(/(\([a-z]\))/g, '\n\n$1');
    content = content.replace(/(\([A-Z]\))/g, '\n\n$1');
    content = content.replace(/(\(\d+\))/g, '\n\n$1');
    
    return content.trim();
  }

  /**
   * Build the URL for a section
   */
  static buildUrl(section: string): string {
    return `${this.BASE_URL}?sectionNum=${section}.&lawCode=EDC`;
  }
}