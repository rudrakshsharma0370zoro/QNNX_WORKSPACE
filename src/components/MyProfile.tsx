"use client";
import { useState, useEffect } from 'react';
import { User, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export default function MyProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [profileData, setProfileData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    address: '',
    aadhaarNo: ''
  });

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const res = await fetchWithAuth(`/api/users/${user.uid}`);
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setProfileData({
          name: data.profile.name || '',
          role: data.profile.role || 'User',
          email: data.profile.email || user.email || '',
          phone: data.profile.personalDetails?.phone || '',
          address: data.profile.personalDetails?.address || '',
          aadhaarNo: data.profile.personalDetails?.aadhaarNo || ''
        });
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    setError('');
    setSuccessMsg('');
    if (profileData.aadhaarNo && !/^\d{12}$/.test(profileData.aadhaarNo)) {
      setError("Aadhaar No must be exactly 12 digits.");
      return;
    }
    
    setSaving(true);
    try {
      if (!user?.uid) throw new Error("Not logged in");
      const payload = {
        name: profileData.name,
        personalDetails: {
          phone: profileData.phone,
          address: profileData.address,
          aadhaarNo: profileData.aadhaarNo
        }
      };
      const res = await fetchWithAuth(`/api/users/${user.uid}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || "Failed to save profile");
      }
      setSuccessMsg("Profile saved successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-full min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your personal account and secure details.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-3xl">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-2xl">
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{profileData.name || 'User'}</h3>
              <p className="text-sm text-gray-500 capitalize">{profileData.role}</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 mb-4">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-600 mb-4">
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={profileData.email}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Secure Personal Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 000-0000"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Aadhaar No</label>
                  <input 
                    type="password" 
                    placeholder="123456789012"
                    value={profileData.aadhaarNo}
                    onChange={(e) => setProfileData({...profileData, aadhaarNo: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Home Address</label>
                  <input 
                    type="text" 
                    placeholder="123 Main St, City, State"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden max-w-3xl">
          <div className="px-8 py-6 border-b border-red-100 flex items-center gap-4 bg-red-50/50">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
              <p className="text-sm text-red-500">Irreversible and destructive actions.</p>
            </div>
          </div>
          <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Delete Profile</h4>
                <p className="text-[13px] text-gray-500 mt-1 max-w-md">
                  Permanently delete your profile and authentication data. This action cannot be undone.
                </p>
              </div>
              <button 
                disabled={deleting}
                onClick={async () => {
                  if (confirm("Are you absolutely sure you want to delete your profile? This is permanent!")) {
                    setDeleting(true);
                    setError("");
                    try {
                      if (!user?.uid) throw new Error("Not logged in");
                      const res = await fetchWithAuth(`/api/users/${user.uid}`, { method: 'DELETE' });
                      if (!res.ok) throw new Error("Failed to delete profile");
                      await logout();
                      router.push("/");
                    } catch (err: any) {
                      setError(err.message || "Failed to delete account");
                      setDeleting(false);
                    }
                  }
                }}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Profile
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
