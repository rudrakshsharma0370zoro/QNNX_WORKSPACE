"use client";
import { useState } from 'react';
import { mockMeetings } from '../../../../utils/adminMockData';
import { X, Plus, Video, Users, Calendar, Clock } from 'lucide-react';

export default function AdminMeetings() {
  const [meetings] = useState(mockMeetings);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleJoin = (platform: string) => {
    // Simulate joining a meeting by opening a generic video URL
    alert(`Opening ${platform} meeting in a new tab...`);
    window.open('https://meet.google.com/new', '_blank');
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Meetings</h2>
            <p className="text-[13px] text-gray-500 mt-1">Manage your schedule, schedule new meetings, and join calls.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Schedule Meeting
          </button>
        </div>

        {/* Upcoming Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-600" />
            Upcoming
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">Daily Standup</h4>
                  <button className="text-gray-400 hover:text-indigo-600">•••</button>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded border border-indigo-100">RECURRING</span>
                
                <div className="mt-4 space-y-2 text-[13px] text-gray-500">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Today</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> 10:00 AM - 10:30 AM</div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Alice, Bob, Charlie, You</div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-[13px] font-medium text-gray-600">
                  <Video className="w-4 h-4 text-blue-500" /> Google Meet
                </div>
                <button 
                  onClick={() => handleJoin('Google Meet')}
                  className="px-4 py-1.5 bg-[#4F46E5] text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Join
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">Design Sync - Profile</h4>
                  <button className="text-gray-400 hover:text-indigo-600">•••</button>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 rounded border border-orange-100">AD-HOC</span>
                
                <div className="mt-4 space-y-2 text-[13px] text-gray-500">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Today</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> 2:00 PM - 3:00 PM</div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Charlie, Maria, You</div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-[13px] font-medium text-gray-600">
                  <Video className="w-4 h-4 text-blue-500" /> Zoom
                </div>
                <button 
                  onClick={() => handleJoin('Zoom')}
                  className="px-4 py-1.5 bg-[#4F46E5] text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Join
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">Sprint Planning</h4>
                  <button className="text-gray-400 hover:text-indigo-600">•••</button>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold text-green-600 bg-green-50 rounded border border-green-100">SCHEDULED</span>
                
                <div className="mt-4 space-y-2 text-[13px] text-gray-500">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Tomorrow</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> 11:00 AM - 12:30 PM</div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Alice, Bob, Charlie, Maria, You</div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-[13px] font-medium text-gray-600">
                  <Video className="w-4 h-4 text-purple-600" /> Microsoft Teams
                </div>
                <button 
                  onClick={() => handleJoin('Teams')}
                  className="px-4 py-1.5 bg-[#4F46E5] text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Join
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Schedule Meeting Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[400px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Schedule New Meeting</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Meeting Title</label>
                <input type="text" placeholder="e.g. Weekly Review" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                  <input type="date" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
                  <input type="time" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Platform</label>
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                  <option>Google Meet</option>
                  <option>Zoom</option>
                  <option>Microsoft Teams</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700">Schedule Meeting</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
