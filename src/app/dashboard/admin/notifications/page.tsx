"use client";

import { useState, useEffect } from 'react';
import { Bell, Clock, Calendar } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

export default function AdminNotificationsCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // The backend (logActivityServer) writes each entry with a `createdAt`
    // field, not `timestamp`. Firestore's orderBy excludes any document that
    // lacks the ordered field entirely, so querying by `timestamp` here
    // silently returned zero results — every real activity log entry was
    // filtered out before it ever reached this page.
    const q = query(collection(db, 'activityLog'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="font-sans text-gray-800 bg-gray-50/30 p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notifications Center</h2>
            <p className="text-sm text-gray-500 mt-1">Manage system and user notifications.</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Notifications Yet</h3>
              <p className="text-sm text-gray-500 max-w-md">System activities and meeting reminders will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notif => (
                <div key={notif.id} className="p-6 hover:bg-gray-50/50 flex items-start gap-4 transition-colors">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {notif.type === 'meeting_scheduled' ? <Calendar className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{notif.message}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
