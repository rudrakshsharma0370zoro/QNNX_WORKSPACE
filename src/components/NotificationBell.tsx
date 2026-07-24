'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, CheckSquare, Folder, X, ShieldAlert } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  // Close dropdown when clicking outside
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read && user) {
      try {
        const token = await user.getIdToken();
        await fetch('/api/notifications/mark-read', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ notificationId: notif.id })
        });
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch('/api/notifications/mark-read', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ all: true })
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'meeting_scheduled': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'task_assigned': return <CheckSquare className="w-5 h-5 text-emerald-500" />;
      case 'document_uploaded': return <Folder className="w-5 h-5 text-amber-500" />;
      default: return <ShieldAlert className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFormattedTitle = (type: string, fallback: string) => {
    switch (type) {
      case 'meeting_scheduled': return 'Meeting Scheduled';
      case 'task_assigned': return 'New Task Assigned';
      case 'document_uploaded': return 'Document Uploaded';
      default: return fallback || 'System Alert';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-sm font-bold text-gray-900">Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead} 
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors" 
                title="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">No new notifications.</p>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[13px] ${!notif.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {getFormattedTitle(notif.type, notif.title)}
                      </p>
                      <p className={`text-sm mt-0.5 line-clamp-2 ${!notif.read ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[11px] font-medium text-indigo-500 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })} • {new Date(notif.createdAt).toLocaleTimeString(undefined, { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
