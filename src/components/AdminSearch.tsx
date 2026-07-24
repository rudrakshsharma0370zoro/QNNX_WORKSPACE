'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, FileText, User, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function AdminSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce the search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const fetchResults = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
  };

  const handleResultClick = (item: any) => {
    clearSearch();
    if (item.url) {
      router.push(item.url);
    }
  };

  return (
    <div className="relative w-80" ref={dropdownRef}>
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results && results.length > 0) {
            setIsOpen(true);
          }
        }}
        placeholder="Search Documents & Employees..." 
        className="w-full pl-9 pr-9 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
      />
      {query && (
        <button 
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50">
          {isLoading ? (
            <div className="flex justify-center items-center py-6 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto py-2">
              {results?.length === 0 ? (
                <div className="px-4 py-4 text-sm text-gray-500 text-center">No results found for "{debouncedQuery}"</div>
              ) : (
                <>
                  {results && results.length > 0 && (
                    <div className="mb-2">
                      {results.map((item: any) => (
                        <button 
                          key={item.id}
                          onClick={() => handleResultClick(item)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'employee' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {item.type === 'employee' ? (
                              item.title.charAt(0)
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="truncate flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{item.subtitle}</p>
                          </div>
                          <div className="shrink-0 text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {item.type}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
