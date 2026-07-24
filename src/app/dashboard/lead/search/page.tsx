"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, CheckSquare, Calendar, Users, Briefcase } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, getDocs } from 'firebase/firestore';

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    tasks: any[];
    users: any[];
    meetings: any[];
  }>({ tasks: [], users: [], meetings: [] });

  useEffect(() => {
    if (!q) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const queryLower = q.toLowerCase();
        
        // Fetch users
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(u => u.displayName?.toLowerCase().includes(queryLower) || u.email?.toLowerCase().includes(queryLower) || u.role?.toLowerCase().includes(queryLower));

        // Fetch tasks
        const tasksSnap = await getDocs(collection(db, 'tasks'));
        const tasks = tasksSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(t => t.title?.toLowerCase().includes(queryLower) || t.description?.toLowerCase().includes(queryLower));

        // Fetch meetings
        const meetingsSnap = await getDocs(collection(db, 'meetings'));
        const meetings = meetingsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(m => m.title?.toLowerCase().includes(queryLower) || m.description?.toLowerCase().includes(queryLower));

        setResults({ tasks, users, meetings });
      } catch (err) {
        console.error("Error fetching search results", err);
      }
      setLoading(false);
    };

    fetchResults();
  }, [q]);

  const hasResults = results.tasks.length > 0 || results.users.length > 0 || results.meetings.length > 0;

  return (
    <div className="font-sans text-gray-800 bg-gray-50/30 p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
            <p className="text-sm text-gray-500 mt-1">Showing results for "{q}"</p>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : !q ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
            <Search className="w-8 h-8 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Search Workspace</h3>
            <p className="text-sm text-gray-500">Enter a query in the search bar above to begin.</p>
          </div>
        ) : !hasResults ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
            <Search className="w-8 h-8 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No results found</h3>
            <p className="text-sm text-gray-500">We couldn't find anything matching "{q}". Try different keywords.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {results.users.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Team Members</h3>
                  <span className="bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full">{results.users.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.users.map(u => (
                    <div key={u.id} className="p-4 hover:bg-gray-50 flex items-center gap-4 transition-colors">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                        {u.displayName?.charAt(0) || u.email?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.displayName || 'No Name'}</p>
                        <p className="text-sm text-gray-500">{u.email} • {u.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.tasks.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-gray-900">Tasks</h3>
                  <span className="bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full">{results.tasks.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.tasks.map(t => (
                    <div key={t.id} className="p-4 hover:bg-gray-50 flex items-start gap-4 transition-colors">
                      <div className="mt-1">
                        <CheckSquare className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{t.description || 'No description'}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            t.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            t.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.meetings.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900">Meetings</h3>
                  <span className="bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full">{results.meetings.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.meetings.map(m => (
                    <div key={m.id} className="p-4 hover:bg-gray-50 flex items-start gap-4 transition-colors">
                      <div className="mt-1">
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{m.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{m.description || 'No description'}</p>
                        <p className="text-xs text-gray-400 mt-1">{m.date ? new Date(m.date).toLocaleDateString() : ''} at {m.time || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default function LeadSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
