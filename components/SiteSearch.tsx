import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * SearchResult interface matching the API response structure
 */
interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  hero_image?: string;
  published_at: string;
}

/**
 * SiteSearch Props Interface
 */
interface SiteSearchProps {
  className?: string;
  onNavigate?: (path: string) => void;
}

/**
 * SiteSearch Component
 *
 * A professional search interface for the JASPER marketing site that provides:
 * - Keyboard shortcut activation (Cmd/Ctrl+K)
 * - Debounced search with loading states
 * - Keyboard navigation through results
 * - Accessible modal design
 * - JASPER brand styling
 *
 * @component
 * @example
 * ```tsx
 * <SiteSearch />
 * ```
 */
export const SiteSearch: React.FC<SiteSearchProps> = ({ className = '', onNavigate }) => {
  // State management
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Refs for DOM manipulation
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Detect operating system for keyboard shortcut display
   */
  const isMac = typeof window !== 'undefined'
    ? navigator.platform.toUpperCase().indexOf('MAC') >= 0
    : false;

  const shortcutKey = isMac ? '⌘K' : 'Ctrl+K';

  /**
   * Open modal and focus input
   */
  const openModal = useCallback(() => {
    setIsOpen(true);
    // Use setTimeout to ensure modal is rendered before focusing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  /**
   * Close modal and reset state
   */
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
    setIsLoading(false);
  }, []);

  /**
   * Perform search API call
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`https://api.jasperfinance.org/api/v1/blog/search?q=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResult[] = await response.json();
      setResults(data);
      setSelectedIndex(0); // Reset selection to first result
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle input change with debouncing
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounced search timer (300ms)
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
  }, [performSearch]);

  /**
   * Handle result selection
   */
  const handleResultSelect = useCallback((slug: string) => {
    // Navigation will be handled by Next.js Link
    closeModal();
  }, [closeModal]);

  /**
   * Keyboard navigation handler
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeModal();
        break;

      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;

      case 'Enter':
        e.preventDefault();
        if (results.length > 0 && selectedIndex >= 0) {
          const selectedResult = results[selectedIndex];
          handleResultSelect(selectedResult.slug);
        }
        break;
    }
  }, [results, selectedIndex, closeModal, handleResultSelect]);

  /**
   * Global keyboard shortcut listener (Cmd/Ctrl+K)
   */
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openModal();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [openModal]);

  /**
   * Click outside to close modal
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeModal]);

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Search Button Trigger */}
      <button
        onClick={openModal}
        className={`group flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-200 hover:border-jasper-emerald transition-all duration-200 bg-white hover:shadow-sm ${className}`}
        aria-label="Open search"
        type="button"
      >
        <svg
          className="w-5 h-5 text-jasper-slate group-hover:text-jasper-emerald transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="text-sm text-jasper-slate group-hover:text-jasper-navy transition-colors">
          Search articles...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-jasper-slate bg-gray-100 rounded border border-gray-200">
          {shortcutKey}
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-20 bg-black bg-opacity-50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-modal-title"
        >
          <div
            ref={modalRef}
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Search Input */}
            <div className="relative border-b border-gray-200">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-5 h-5 text-jasper-slate"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-4 text-base text-jasper-navy placeholder-jasper-slate focus:outline-none"
                aria-label="Search query"
                id="search-modal-title"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-jasper-slate hover:text-jasper-navy transition-colors"
                  aria-label="Clear search"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Results Container */}
            <div className="max-h-96 overflow-y-auto">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-jasper-emerald border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-jasper-slate">Searching...</span>
                  </div>
                </div>
              )}

              {/* Empty State - No Query */}
              {!isLoading && !query && (
                <div className="py-12 px-6 text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 text-jasper-slate-light"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="text-sm text-jasper-slate">
                    Start typing to search articles
                  </p>
                </div>
              )}

              {/* Empty State - No Results */}
              {!isLoading && query && results.length === 0 && (
                <div className="py-12 px-6 text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 text-jasper-slate-light"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-jasper-slate">
                    No articles found for <span className="font-medium text-jasper-navy">'{query}'</span>
                  </p>
                </div>
              )}

              {/* Search Results */}
              {!isLoading && results.length > 0 && (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={result.slug}
                      onClick={() => {
                        handleResultSelect(result.slug);
                        onNavigate?.(`/insights/${result.slug}`);
                      }}
                      className={`block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 ${
                        index === selectedIndex
                          ? 'border-jasper-emerald bg-emerald-50'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        {result.hero_image && (
                          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={result.hero_image}
                              alt={result.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Category Badge */}
                          <span className="inline-block px-2 py-1 mb-2 text-xs font-medium text-jasper-emerald bg-emerald-50 rounded">
                            {result.category}
                          </span>

                          {/* Title */}
                          <h3 className="text-sm font-semibold text-jasper-navy mb-1 line-clamp-2">
                            {result.title}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-xs text-jasper-slate line-clamp-2 mb-2">
                            {result.excerpt}
                          </p>

                          {/* Date */}
                          <p className="text-xs text-jasper-slate-light">
                            {formatDate(result.published_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with keyboard hints */}
            {results.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-jasper-slate">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white rounded border border-gray-200">↑↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white rounded border border-gray-200">Enter</kbd>
                      Select
                    </span>
                  </div>
                  <span className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white rounded border border-gray-200">Esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SiteSearch;
