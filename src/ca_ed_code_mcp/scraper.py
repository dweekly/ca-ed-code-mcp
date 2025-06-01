"""Web scraper for California Education Code sections."""

import re
from typing import Dict, Optional

import requests
from bs4 import BeautifulSoup


class EdCodeScraper:
    """Scraper for California Education Code sections."""
    
    BASE_URL = "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml"
    USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    
    def __init__(self, timeout: int = 30):
        """Initialize the scraper.
        
        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': self.USER_AGENT})
    
    def fetch_section(self, section: str) -> Optional[Dict[str, str]]:
        """Fetch a California Education Code section.
        
        Args:
            section: The Ed Code section number (e.g., "15278")
            
        Returns:
            Dictionary with section info or None if not found
        """
        # Clean the section number
        section = section.strip()
        
        # Build URL
        url = f"{self.BASE_URL}?sectionNum={section}.&lawCode=EDC"
        
        try:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find the content div
            content_div = soup.find('div', id='codeLawSectionNoHead')
            if not content_div:
                return None
            
            # Extract the full text
            full_text = content_div.get_text(strip=True)
            
            # Extract title if available
            title = self._extract_title(full_text, section)
            
            # Clean and format the content
            content = self._clean_content(full_text, section)
            
            if not content:
                return None
                
            return {
                'section': section,
                'title': title,
                'content': content,
                'url': url
            }
            
        except requests.RequestException:
            return None
        except Exception:
            return None
    
    def _extract_title(self, text: str, section: str) -> str:
        """Extract the title/heading for the section."""
        # Look for the last ARTICLE or CHAPTER heading before the section
        before_section = text.split(f"{section}.")[0]
        
        # Find the last ARTICLE heading
        article_match = None
        for match in re.finditer(r'ARTICLE\s+\d+[^[]*\[[^]]+\]', before_section):
            article_match = match
            
        if article_match:
            # Clean up the article text
            article_text = article_match.group(0)
            article_text = re.sub(r'\s*\[[^]]+\]', '', article_text)
            return article_text.strip()
            
        return f"Education Code Section {section}"
    
    def _clean_content(self, text: str, section: str) -> str:
        """Clean and format the section content."""
        # Find where the actual section content starts
        pattern = rf"{re.escape(section)}\."
        match = re.search(pattern, text)
        
        if not match:
            return ""
        
        # Extract content starting from the section number
        content = text[match.start():]
        
        # Remove navigation/metadata that appears at the end
        # Look for common ending patterns
        end_patterns = [
            r"\(Added by Stats\.",
            r"\(Amended by Stats\.",
            r"\(Repealed and added by Stats\."
        ]
        
        for pattern in end_patterns:
            end_match = re.search(pattern, content)
            if end_match:
                # Include the citation but stop after it
                citation_end = content.find(')', end_match.end())
                if citation_end != -1:
                    content = content[:citation_end + 1]
                break
        
        # Clean up whitespace
        content = re.sub(r'\s+', ' ', content)
        
        # Add proper paragraph breaks
        content = re.sub(r'(\([a-z0-9]\))', r'\n\n\1', content)
        content = re.sub(r'(\([A-Z]\))', r'\n\n\1', content)
        content = re.sub(r'(\(\d+\))', r'\n\n\1', content)
        
        return content.strip()