"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, Plus, MoreVertical } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', platform: 'Google Meet', link: '', date: '', time: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMeetings(meetingsData);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateMeeting = async () => {
    if (!newMeeting.title) return;
    setLoading(true);
    try {
      await fetchWithAuth('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({ ...newMeeting, participants: [] }),
      });
      setIsAddModalOpen(false);
      setNewMeeting({ title: '', platform: 'Google Meet', link: '', date: '', time: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const upcomingMeetings = meetings.filter(m => new Date(m.date) >= new Date());
  const pastMeetings = meetings.filter(m => new Date(m.date) < new Date());

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-500 mt-1">Manage your schedule, schedule new meetings, and join calls.</p>
        </div>
        {/* Schedule Meeting Button */}
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[400px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Schedule Meeting</h3>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} placeholder="Meeting Title" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="date" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="time" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select value={newMeeting.platform} onChange={e => setNewMeeting({...newMeeting, platform: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom">Zoom</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
              </select>
              <input type="text" value={newMeeting.link} onChange={e => setNewMeeting({...newMeeting, link: e.target.value})} placeholder="Meeting Link" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleCreateMeeting} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Meetings Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Upcoming</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingMeetings.map((meeting) => (
            <div key={meeting.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-100 transition-all flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold tracking-wider rounded-md uppercase">
                    {meeting.type}
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mt-auto mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" /> {meeting.date}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" /> {meeting.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-gray-400" /> <span className="truncate">{meeting.attendees}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-500" /> {meeting.platform}
                </span>
                <div className="flex gap-2">
                  <a 
                    href={`mailto:?bcc=team@qnnx.com&subject=Meeting Invite: ${meeting.title}&body=Join us on ${meeting.platform} at ${meeting.time} on ${meeting.date}. Link: ${meeting.link}`}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    Email Invites
                  </a>
                  <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Join
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past Meetings (History) Section */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Past Meetings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastMeetings.map((meeting) => (
            <div key={meeting.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full opacity-80">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-700">{meeting.title}</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4 text-gray-400" /> {meeting.date}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4 text-gray-400" /> {meeting.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4 text-gray-400" /> <span className="truncate">{meeting.attendees}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}