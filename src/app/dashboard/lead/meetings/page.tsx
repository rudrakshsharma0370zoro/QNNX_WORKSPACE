"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, Plus, MoreVertical, Zap } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useAuth } from '@/components/AuthProvider';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  platform?: string | null;
  link?: string | null;
  participants?: string[];
  type?: 'scheduled' | 'instant';
}

interface AppUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

const EMPTY_FORM = { title: '', platform: 'Google Meet', link: '', date: '', time: '' };

export default function MeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState(EMPTY_FORM);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingInstant, setStartingInstant] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Meeting[]);
    });
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setAllUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AppUser[]);
    });
    return () => { unsubscribe(); unsubUsers(); };
  }, []);

  const toggleParticipant = (uid: string) => {
    setSelectedParticipants(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const resetForm = () => {
    setNewMeeting(EMPTY_FORM);
    setSelectedParticipants([]);
    setError('');
  };

  const handleCreateMeeting = async () => {
    if (!newMeeting.title.trim() || !newMeeting.date) {
      setError('Title and date are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({ ...newMeeting, participants: selectedParticipants, type: 'scheduled' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.details || body.error || 'Failed to create meeting.');
      }
      setIsAddModalOpen(false);
      resetForm();
    } catch (e: any) {
      setError(e.message || 'Failed to create meeting.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInstantMeeting = async () => {
    setStartingInstant(true);
    setError('');
    try {
      const now = new Date();
      const organizerName = user?.displayName || user?.email || 'Someone';
      const res = await fetchWithAuth('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: `Instant Meeting — started by ${organizerName}`,
          date: now.toISOString(),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          platform: 'Google Meet',
          link: 'https://meet.google.com/new',
          participants: allUsers.filter(u => u.id !== user?.uid).map(u => u.id),
          type: 'instant',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.details || body.error || 'Failed to start meeting.');
      }
      window.open('https://meet.google.com/new', '_blank');
    } catch (e: any) {
      setError(e.message || 'Failed to start instant meeting.');
    } finally {
      setStartingInstant(false);
    }
  };

  const handleJoin = (meeting: Meeting) => {
    window.open(meeting.link || 'https://meet.google.com/new', '_blank');
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartInstantMeeting}
            disabled={startingInstant}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-60"
          >
            <Zap className="w-4 h-4" />
            {startingInstant ? 'Starting…' : 'Start Instant Meeting'}
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        </div>
      </div>

      {error && !isAddModalOpen && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[420px] max-h-[85vh] overflow-y-auto border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0">
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
              <input type="text" value={newMeeting.link} onChange={e => setNewMeeting({...newMeeting, link: e.target.value})} placeholder="Meeting Link (optional)" className="w-full px-3 py-2 border rounded-lg text-sm" />

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Invite Participants ({selectedParticipants.length} selected)
                </label>
                <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {allUsers.filter(u => u.id !== user?.uid).map(u => (
                    <label key={u.id} className="flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(u.id)}
                        onChange={() => toggleParticipant(u.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{u.name || u.email || u.id}</span>
                      {u.role && <span className="ml-auto text-[10px] text-gray-400 uppercase">{u.role}</span>}
                    </label>
                  ))}
                  {allUsers.length === 0 && (
                    <p className="px-3 py-2 text-[12px] text-gray-400">No other users found yet.</p>
                  )}
                </div>
              </div>
              {error && <p className="text-[12px] text-red-600">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleCreateMeeting} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-60">
                {loading ? 'Scheduling…' : 'Schedule'}
              </button>
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

        {upcomingMeetings.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-sm text-gray-500 font-medium">No upcoming meetings. Schedule one or start an instant meeting above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-100 transition-all flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-md uppercase ${
                      meeting.type === 'instant' ? 'bg-orange-50 text-orange-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {meeting.type === 'instant' ? 'Instant' : 'Scheduled'}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mt-auto mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" /> {new Date(meeting.date).toLocaleDateString()}
                  </div>
                  {meeting.time && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" /> {meeting.time}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" /> {meeting.participants?.length ?? 0} invited
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-500" /> {meeting.platform || 'Video Call'}
                  </span>
                  <div className="flex gap-2">
                    <a
                      href={`mailto:?bcc=team@qnnx.com&subject=Meeting Invite: ${meeting.title}&body=Join us on ${meeting.platform || 'video call'} at ${meeting.time || ''} on ${meeting.date}. Link: ${meeting.link || ''}`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Email Invites
                    </a>
                    <button
                      onClick={() => handleJoin(meeting)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings (History) Section */}
      {pastMeetings.length > 0 && (
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
                    <Calendar className="w-4 h-4 text-gray-400" /> {new Date(meeting.date).toLocaleDateString()}
                  </div>
                  {meeting.time && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4 text-gray-400" /> {meeting.time}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4 text-gray-400" /> {meeting.participants?.length ?? 0} invited
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
