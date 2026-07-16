import React from 'react';
import { Calendar, Clock, Users, Video, Plus, MoreVertical } from 'lucide-react';

// Demo data - Upcoming Meetings
const upcomingMeetings = [
  { id: 1, title: 'Daily Standup', type: 'RECURRING', date: 'Today', time: '10:00 AM - 10:30 AM', attendees: 'Alice, Bob, Charlie, You', platform: 'Google Meet', link: '#' },
  { id: 2, title: 'Design Sync - Profile Module', type: 'AD-HOC', date: 'Today', time: '2:00 PM - 3:00 PM', attendees: 'Charlie, Maria, You', platform: 'Zoom', link: '#' },
  { id: 3, title: 'Sprint Planning', type: 'SCHEDULED', date: 'Tomorrow', time: '11:00 AM - 12:30 PM', attendees: 'Alice, Bob, Charlie, Maria, You', platform: 'Microsoft Teams', link: '#' },
];

// Demo data - Past Meetings (History)
const pastMeetings = [
  { id: 4, title: 'Weekly Sync', date: 'Yesterday', time: '3:00 PM - 4:00 PM', attendees: 'Alice, Bob, You' },
  { id: 5, title: 'Project Kickoff', date: 'Oct 10, 2026', time: '10:00 AM - 11:00 AM', attendees: 'All Team' },
];

export default function MeetingsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-500 mt-1">Manage your schedule, schedule new meetings, and join calls.</p>
        </div>
        {/* Schedule Meeting Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </button>
      </div>

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
                <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                  Join
                </button>
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