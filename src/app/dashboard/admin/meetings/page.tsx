"use client";
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { newJitsiLink, joinUrl, isUpcoming, openGmailCompose } from '@/utils/meeting';
import { useAuth } from '@/components/AuthProvider';
import { useUsers } from '@/components/AppDataProvider';
import { X, Plus, Video, Users, Calendar, Clock, Zap, Trash2 } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  platform?: string | null;
  link?: string | null;
  participants?: string[];
  type?: 'scheduled' | 'instant';
  createdAt?: string;
  createdBy?: string;
  isHidden?: boolean;
}

interface AppUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

const EMPTY_FORM = { title: '', platform: 'Google Meet', link: '', date: '', time: '' };

export default function AdminMeetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  // const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const allUsers = useUsers() as AppUser[]; // shared roster — see src/components/AppDataProvider.tsx
  const [teams, setTeams] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInstantModalOpen, setIsInstantModalOpen] = useState(false);
  const [selectedInstantUsers, setSelectedInstantUsers] = useState<string[]>([]);
  const [selectedInstantTeams, setSelectedInstantTeams] = useState<string[]>([]);
  const [newMeeting, setNewMeeting] = useState(EMPTY_FORM);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [startingInstant, setStartingInstant] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return; // Wait for auth to resolve before fetching

    // Real meetings data — previously this page subscribed to Firestore but
    // never rendered the result, showing three hardcoded example cards instead.
    const unsubMeetings = onSnapshot(
      query(collection(db, 'meetings'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Meeting[];
        setMeetings(data.filter(m => !m.isHidden && !m.hiddenBy?.includes(user?.uid)));
      }
    );
    // Used to build the "invite participants" picker in the schedule modal.
    // const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
    //   setAllUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AppUser[]);
    // });
    const unsubTeams = onSnapshot(query(collection(db, 'teams')), (snapshot) => {
      setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubMeetings(); unsubTeams(); };
  }, [user]);

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
    if (!newMeeting.title.trim() || !newMeeting.date || !newMeeting.link.trim()) {
      setError('Title, date, and meeting link are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          ...newMeeting,
          link: newMeeting.link.trim() || null,
          participants: selectedParticipants,
          type: 'scheduled',
        }),
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
      setSaving(false);
    }
  };

  const openInstantModal = () => {
    setSelectedInstantUsers([]);
    setSelectedInstantTeams([]);
    setIsInstantModalOpen(true);
  };

  const toggleInstantUser = (uid: string) => {
    setSelectedInstantUsers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };
  
  const toggleInstantTeam = (teamId: string) => {
    setSelectedInstantTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
  };

  const executeStartInstantMeeting = async () => {
    setStartingInstant(true);
    setError('');
    try {
      const finalParticipants = new Set(selectedInstantUsers);
      selectedInstantTeams.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team && Array.isArray(team.members)) {
          team.members.forEach((uid: string) => finalParticipants.add(uid));
        }
      });
      if (user?.uid) finalParticipants.add(user.uid);

      const now = new Date();
      const organizerName = user?.displayName || user?.email || 'Someone';
      // Jitsi fix: mint ONE room link up front, store it on the meeting, and
      // open that same link — organizer and every joiner share a single room.
      const link = newJitsiLink();
      const res = await fetchWithAuth('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: `Instant Meeting — started by ${organizerName}`,
          date: now.toISOString(),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          platform: 'Jitsi Meet',
          link,
          participants: Array.from(finalParticipants),
          type: 'instant',
        }),
      });
      
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.details || body.error || 'Failed to start meeting.');
      }
      window.open(link, '_blank');
      setIsInstantModalOpen(false);
    } catch (e: any) {
      setError(e.message || 'Failed to start instant meeting.');
    } finally {
      setStartingInstant(false);
    }
  };

  const handleEmailInvites = (meeting: Meeting) => {
    const emails = (meeting.participants || [])
      .map(uid => allUsers.find(u => u.id === uid)?.email)
      .filter(Boolean)
      .join(',');
      
    if (!emails) {
      alert('No valid emails found for the invited participants.');
      return;
    }
    
    // Copy emails to clipboard
    navigator.clipboard.writeText(emails).catch(() => {});

    // Launch mail app with BCC
    // const subject = encodeURIComponent(`Meeting Invite: ${meeting.title}`);
    // const body = encodeURIComponent(`Join us on ${meeting.platform || 'video call'} at ${meeting.time || ''} on ${new Date(meeting.date).toLocaleDateString()}.\n\nLink: ${meeting.link || joinUrl(meeting)}\n\n`);
    // window.location.href = `mailto:?bcc=${emails}&subject=${subject}&body=${body}`;

    // Gmail-web-compose fix: open Gmail's own compose UI in a new tab instead
    // of handing off to the OS-default desktop mail app. Fixes SMTP timeouts
    // on networks that block outbound mail ports, and avoids messages landing
    // in recipients' Spam folder when relayed through a non-Gmail client.
    const subject = `Meeting Invite: ${meeting.title}`;
    const body = `Join us on ${meeting.platform || 'video call'} at ${meeting.time || ''} on ${new Date(meeting.date).toLocaleDateString()}.\n\nLink: ${meeting.link || joinUrl(meeting)}\n\n`;
    openGmailCompose({ bcc: emails, subject, body });
  };

  const handleJoin = (meeting: Meeting) => {
    window.open(joinUrl(meeting), '_blank');
  };

  const upcoming = meetings.filter(m => isUpcoming(m.date));
  const past = meetings.filter(m => !isUpcoming(m.date));

  const handleRemoveMeeting = async (meeting: Meeting) => {
    if (!window.confirm('Are you sure you want to remove this meeting?')) return;
    try {
      const res = await fetchWithAuth(`/api/meetings/${meeting.id}/remove`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.details || body.error || 'Failed to remove meeting.');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to remove meeting.');
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1200px] mx-auto space-y-8">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Meetings</h2>
            <p className="text-[13px] text-gray-500 mt-1">Manage your schedule, schedule new meetings, and join calls.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openInstantModal}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors"
            >
              <Zap className="w-4 h-4" /> Start Instant Meeting
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Schedule Meeting
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
        )}

        {/* Upcoming Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-600" />
            Upcoming
          </h3>

          {upcoming.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-[14px] text-gray-500 font-medium">No upcoming meetings. Schedule one or start an instant meeting above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((meeting) => (
                <div key={meeting.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900">{meeting.title}</h4>
                      <button 
                        onClick={() => handleRemoveMeeting(meeting)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                      meeting.type === 'instant'
                        ? 'text-orange-600 bg-orange-50 border-orange-100'
                        : 'text-green-600 bg-green-50 border-green-100'
                    }`}>
                      {meeting.type === 'instant' ? 'INSTANT' : 'SCHEDULED'}
                    </span>

                    <div className="mt-4 space-y-2 text-[13px] text-gray-500">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(meeting.date).toLocaleDateString()}</div>
                      {meeting.time && <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {meeting.time}</div>}
                      <div className="flex items-center gap-2"><Users className="w-4 h-4" /> {meeting.participants?.length ?? 0} invited</div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-gray-600">
                      <Video className="w-4 h-4 text-blue-500" /> {meeting.platform || 'Video Call'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEmailInvites(meeting)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                      >
                        Invite via Mail
                      </button>
                      {(user as any)?.role === 'admin' || user?.uid === meeting.createdBy || (meeting.participants && meeting.participants.includes(user?.uid || '')) ? (
                        <button
                          onClick={() => handleJoin(meeting)}
                          className="px-4 py-1.5 bg-[#4F46E5] text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Join
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-1.5 bg-gray-100 text-gray-400 rounded-md text-sm font-medium cursor-not-allowed border border-gray-200"
                          title="You are not authorized to join this meeting"
                        >
                          Not Invited
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Section */}
        {past.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Past
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((meeting) => (
                <div key={meeting.id} className="bg-gray-50 p-5 rounded-xl border border-gray-200 opacity-80 relative">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-700">{meeting.title}</h4>
                    <button 
                      onClick={() => handleRemoveMeeting(meeting)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove meeting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-[13px] text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {new Date(meeting.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Schedule Meeting Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[440px] max-h-[85vh] overflow-y-auto border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0">
              <h3 className="text-sm font-bold text-gray-900">Schedule New Meeting</h3>
              <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Meeting Title</label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  placeholder="e.g. Weekly Review"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
                  <input
                    type="time"
                    value={newMeeting.time}
                    onChange={e => setNewMeeting({ ...newMeeting, time: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Meeting Link (Required)</label>
                <input
                  type="text"
                  value={newMeeting.link}
                  onChange={e => setNewMeeting({ ...newMeeting, link: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Invite Participants ({selectedParticipants.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
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

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 sticky bottom-0">
              <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={handleCreateMeeting}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? 'Scheduling…' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Meeting Modal */}
      {isInstantModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[440px] max-h-[85vh] overflow-y-auto border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0">
              <h3 className="text-sm font-bold text-gray-900">Start Instant Meeting</h3>
              <button onClick={() => setIsInstantModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-[12px] font-semibold text-gray-900 uppercase tracking-wider mb-2">Invite Teams</h4>
                {teams.length === 0 ? (
                  <p className="text-[12px] text-gray-400 italic">No teams available.</p>
                ) : (
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {teams.map(t => (
                      <label key={t.id} className="flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedInstantTeams.includes(t.id)}
                          onChange={() => toggleInstantTeam(t.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-medium">{t.name}</span>
                        {t.department && <span className="ml-auto text-[10px] text-gray-400 uppercase">{t.department}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[12px] font-semibold text-gray-900 uppercase tracking-wider mb-2">Invite Individuals</h4>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {allUsers.filter(u => u.id !== user?.uid).map(u => (
                    <label key={u.id} className="flex items-center gap-3 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedInstantUsers.includes(u.id)}
                        onChange={() => toggleInstantUser(u.id)}
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

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 sticky bottom-0">
              <button onClick={() => setIsInstantModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={executeStartInstantMeeting}
                disabled={startingInstant}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {startingInstant ? 'Starting…' : 'Start Meeting Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
