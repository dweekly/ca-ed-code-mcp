"""Caching layer for CA Ed Code sections."""

import json
import os
import time
from pathlib import Path
from typing import Dict, Optional


class EdCodeCache:
    """File-based cache for Ed Code sections."""
    
    def __init__(self, cache_dir: str = ".cache", ttl_seconds: int = 86400):
        """Initialize the cache.
        
        Args:
            cache_dir: Directory to store cache files
            ttl_seconds: Time-to-live in seconds (default: 24 hours)
        """
        self.cache_dir = Path(cache_dir)
        self.ttl_seconds = ttl_seconds
        
        # Create cache directory if it doesn't exist
        self.cache_dir.mkdir(exist_ok=True)
    
    def _get_cache_path(self, section: str) -> Path:
        """Get the cache file path for a section."""
        # Sanitize section number for filesystem
        safe_section = section.replace(".", "_")
        return self.cache_dir / f"edc_{safe_section}.json"
    
    def get(self, section: str) -> Optional[Dict[str, str]]:
        """Get a cached section if it exists and is not expired.
        
        Args:
            section: The Ed Code section number
            
        Returns:
            Cached data or None if not found/expired
        """
        cache_path = self._get_cache_path(section)
        
        if not cache_path.exists():
            return None
        
        try:
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
            
            # Check if cache is expired
            if time.time() - cache_data.get('timestamp', 0) > self.ttl_seconds:
                # Cache expired, remove it
                cache_path.unlink()
                return None
            
            # Return the cached result
            return cache_data.get('data')
            
        except (json.JSONDecodeError, IOError):
            # Corrupted cache file, remove it
            if cache_path.exists():
                cache_path.unlink()
            return None
    
    def set(self, section: str, data: Dict[str, str]) -> None:
        """Cache a section's data.
        
        Args:
            section: The Ed Code section number
            data: The data to cache
        """
        cache_path = self._get_cache_path(section)
        
        cache_data = {
            'timestamp': time.time(),
            'data': data
        }
        
        try:
            with open(cache_path, 'w') as f:
                json.dump(cache_data, f, indent=2)
        except IOError:
            # Ignore cache write failures
            pass
    
    def clear(self) -> None:
        """Clear all cached data."""
        for cache_file in self.cache_dir.glob("edc_*.json"):
            try:
                cache_file.unlink()
            except IOError:
                pass
    
    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        cache_files = list(self.cache_dir.glob("edc_*.json"))
        valid_count = 0
        expired_count = 0
        
        for cache_file in cache_files:
            try:
                with open(cache_file, 'r') as f:
                    cache_data = json.load(f)
                if time.time() - cache_data.get('timestamp', 0) > self.ttl_seconds:
                    expired_count += 1
                else:
                    valid_count += 1
            except:
                expired_count += 1
        
        return {
            'total': len(cache_files),
            'valid': valid_count,
            'expired': expired_count
        }