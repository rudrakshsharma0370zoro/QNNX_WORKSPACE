"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { joinUrl } from '@/utils/meeting';

export default function UserMeetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;

    // The backend stores the attendee list as `participants` (not `attendees`),
    // and Firestore rules require a non-privileged client to filter by it —
    // an unfiltered meetings query is rejected outright for a plain user.
    //
    // No orderBy here on purpose: combining array-contains with orderBy would
    // require a composite index. Sorting a user's own meetings in memory is
    // cheap and keeps the deployment index-free.
    const q = query(
      collection(db, 'meetings'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mine = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      mine.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
      setMeetings(mine);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleJoin = (meeting: any) => {
    if (meeting.link) {
      window.open(meeting.link, '_blank');
    } else {
      alert("No valid Google Meet link was provided for this meeting.");
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        <div className="mb-6">
          <h2 className="text-[22px] font-bold text-[#111827]">Meetings</h2>
          <p className="text-[13px] text-gray-500 mt-1">Join your upcoming scheduled calls.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
            Your Upcoming Meetings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-48 hover:border-indigo-300 transition-colors">
                <div>
                  <h4 className="font-bold text-gray-900">{meeting.title}</h4>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded uppercase">
                    {meeting.type === 'instant' ? 'Instant' : 'Scheduled'}
                  </span>

                  <div className="mt-4 space-y-2 text-[13px] text-gray-500">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {new Date(meeting.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      {/* Backend field is `participants`, not `attendees` — reading
                          the wrong field crashed this page on every real meeting. */}
                      {meeting.participants?.length ?? 0} Attendees
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleJoin(meeting)}
                    className="px-5 py-1.5 bg-[#4F46E5] text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Join Call
                  </button>
                </div>
              </div>
            ))}

            {meetings.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-[14px] text-gray-500 font-medium">You have no upcoming meetings scheduled.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
