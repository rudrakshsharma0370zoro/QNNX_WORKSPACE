"use client";
import React, { useState, useEffect, useRef } from 'react';
import { User, Building, Bell, Shield, CloudUpload, Save, ChevronDown, Loader2, CheckCircle2, Palette, Sun, Moon, Laptop, X } from 'lucide-react';
import { auth } from '@/config/firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useTheme } from 'next-themes';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uid, setUid] = useState('');

  // Tab 1: Profile
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatarUrl: ''
  });
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: Workspace
  const [workspace, setWorkspace] = useState({
    name: '',
    domain: '',
    logoUrl: '',
    timezone: 'Pacific Time (PT)',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD ($)'
  });
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Tab 3: Notifications
  const [notifications, setNotifications] = useState({
    newLead: true,
    taskStatus: true,
    inAppProject: true,
    weeklySummary: false,
  });

  // Tab 4: Security
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false); // Controls bypassing 'Current Password'

  // Tab 5: Appearance
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
  const [theme, setTheme] = useState<'light' | 'dark' | 'reading'>('light');

  useEffect(() => {
    if (globalTheme && ['light', 'dark', 'reading'].includes(globalTheme)) {
      setTheme(globalTheme as any);
    }
  }, [globalTheme]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        setProfile(prev => ({ ...prev, email: user.email || '' }));
        await fetchData(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (user: any) => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const userRes = await fetch(`/api/users/${user.uid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.success && userData.profile) {
          const nameParts = (userData.profile.name || '').split(' ');
          setProfile(prev => ({
            ...prev,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            phone: userData.profile.personalDetails?.phone || '',
            avatarUrl: userData.profile.avatarUrl || ''
          }));
          if (userData.profile.preferences) {
            setNotifications(prev => ({ 
              ...prev, 
              newLead: userData.profile.preferences.newLead ?? true,
              taskStatus: userData.profile.preferences.taskStatus ?? true,
              inAppProject: userData.profile.preferences.inAppProject ?? true,
              weeklySummary: userData.profile.preferences.weeklySummary ?? false
            }));
            if (userData.profile.preferences.theme) {
              setTheme(userData.profile.preferences.theme);
              setGlobalTheme(userData.profile.preferences.theme);
            }
          }
        }
      }

      const orgRes = await fetch(`/api/organization`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        if (orgData.success && orgData.organization) {
          setWorkspace(prev => ({
            ...prev,
            ...orgData.organization,
            name: orgData.organization.name || prev.name,
            domain: orgData.organization.domain || prev.domain,
            logoUrl: orgData.organization.logoUrl || prev.logoUrl
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings data', err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/users/${uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          avatarUrl: profile.avatarUrl,
          personalDetails: { phone: profile.phone }
        })
      });
      if (!res.ok) throw new Error('Failed to update profile');
      showMessage('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkspace = async () => {
    try {
      setSaving(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/organization`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: workspace.name,
          domain: workspace.domain,
          logoUrl: workspace.logoUrl,
          timezone: workspace.timezone,
          dateFormat: workspace.dateFormat,
          currency: workspace.currency
        })
      });
      if (!res.ok) throw new Error('Failed to update workspace');
      showMessage('Workspace updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async (newPrefs: any) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/users/${uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferences: newPrefs })
      });
    } catch (err) {
      console.error('Failed to save preferences', err);
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const newPrefs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newPrefs);
    savePreferences({ ...newPrefs, theme });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'reading') => {
    setTheme(newTheme);
    setGlobalTheme(newTheme);
    savePreferences({ ...notifications, theme: newTheme });
  };

  const handleChangePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      return alert('New passwords do not match!');
    }
    if (passwords.newPass.length < 6) {
      return alert('Password must be at least 6 characters.');
    }
    
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("No user logged in");
      
      // If OTP wasn't verified, we MUST verify the current password first
      if (!otpVerified) {
        if (!passwords.current) {
          return alert("Please enter your current password.");
        }
        const credential = EmailAuthProvider.credential(user.email, passwords.current);
        await reauthenticateWithCredential(user, credential);
      }
      
      // Update the password
      await updatePassword(user, passwords.newPass);
      showMessage('Password updated successfully!');
      
      // Reset form
      setPasswords({ current: '', newPass: '', confirm: '' });
      setOtpVerified(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        alert("Incorrect current password.");
      } else if (err.code === 'auth/requires-recent-login') {
        alert("Your session is too old. Please log out and log back in, or use the standard password reset flow.");
      } else {
        alert(err.message || 'Failed to update password');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otpCode === '123456') {
      setOtpVerified(true);
      setOtpModalOpen(false);
      setOtpCode('');
      showMessage('Identity verified! You may now set a new password.');
    } else {
      alert('Invalid OTP code. For this simulation, use 123456.');
    }
  };

  const uploadFile = async (file: File, category: string) => {
    const token = await auth.currentUser?.getIdToken();
    const presignRes = await fetch('/api/uploads/presign', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        category: category
      })
    });
    
    const presignData = await presignRes.json();
    if (!presignRes.ok) throw new Error(presignData.details || 'Failed to get upload URL');

    const uploadRes = await fetch(presignData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    
    if (!uploadRes.ok) throw new Error('Failed to upload file to S3');
    return presignData.s3Key;
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      await uploadFile(file, 'personal-files');
      
      const objectUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, avatarUrl: objectUrl }));
      
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/users/${uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatarUrl: objectUrl }) 
      });
      showMessage('Avatar uploaded!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      await uploadFile(file, 'company-wide');
      
      const objectUrl = URL.createObjectURL(file);
      setWorkspace(prev => ({ ...prev, logoUrl: objectUrl }));
      
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/organization`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ logoUrl: objectUrl })
      });
      showMessage('Logo uploaded!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'workspace', label: 'Workspace Preferences', icon: Building },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] w-full">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 h-12">
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Settings</h2>
            <p className="text-[13px] text-gray-500 mt-1">Manage your account and workspace preferences.</p>
          </div>
          {message && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 shadow-sm border border-green-100">
              <CheckCircle2 className="w-4 h-4" /> {message}
            </div>
          )}
        </div>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Vertical Navigation */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8 min-h-[600px]">
            
            {/* TAB 1: My Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">My Profile</h3>
                  <p className="text-sm text-gray-500">Update your personal information and avatar.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Avatar Upload */}
                  <div className="col-span-1 lg:col-span-4">
                    <label className="block text-[13px] font-semibold text-gray-700 mb-2">Profile Avatar</label>
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} className="hidden" accept="image/*" />
                    <div 
                      onClick={() => !saving && avatarInputRef.current?.click()}
                      className={`border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center py-8 px-4 text-center transition-colors overflow-hidden relative h-48 ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                    >
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover absolute inset-0" />
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                            <User className="w-8 h-8 text-indigo-600" />
                          </div>
                          <p className="text-[13px] font-semibold text-indigo-600">Click to upload</p>
                          <p className="text-[11px] text-gray-400 mt-1">SVG, PNG, JPG (max. 800x400px)</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Form */}
                  <div className="col-span-1 lg:col-span-8 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1">First Name</label>
                        <input 
                          type="text" 
                          value={profile.firstName}
                          onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1">Last Name</label>
                        <input 
                          type="text" 
                          value={profile.lastName}
                          onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1">Email Address</label>
                      <input type="email" value={profile.email} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-500 focus:outline-none" disabled />
                      <p className="text-[11px] text-gray-400 mt-1">Contact support to change your email address.</p>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="+1 (555) 000-0000" 
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Workspace Preferences */}
            {activeTab === 'workspace' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Workspace Preferences</h3>
                  <p className="text-sm text-gray-500">Manage your company details and localization settings.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1">Company Name</label>
                      <input 
                        type="text" 
                        value={workspace.name}
                        onChange={(e) => setWorkspace({...workspace, name: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1">Company Website</label>
                      <input 
                        type="url" 
                        value={workspace.domain}
                        onChange={(e) => setWorkspace({...workspace, domain: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                      />
                    </div>
                    <div className="pt-4">
                      <label className="block text-[13px] font-semibold text-gray-700 mb-2">Company Logo</label>
                      <input type="file" ref={logoInputRef} onChange={handleLogoSelect} className="hidden" accept="image/*" />
                      <div 
                        onClick={() => !saving && logoInputRef.current?.click()}
                        className={`border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center py-6 px-4 text-center transition-colors overflow-hidden relative h-32 ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                      >
                        {workspace.logoUrl ? (
                          <img src={workspace.logoUrl} alt="Logo" className="w-full h-full object-contain absolute inset-0 p-2" />
                        ) : (
                          <>
                            <CloudUpload className="w-8 h-8 text-indigo-400 mb-2" />
                            <p className="text-[13px] font-semibold text-indigo-600">Upload Logo</p>
                            <p className="text-[11px] text-gray-400 mt-1">Recommended size: 256x256px</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1">Default Timezone</label>
                      <div className="relative">
                        <select 
                          value={workspace.timezone}
                          onChange={(e) => setWorkspace({...workspace, timezone: e.target.value})}
                          className="w-full appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        >
                          <option>Pacific Time (PT)</option>
                          <option>Eastern Time (ET)</option>
                          <option>Coordinated Universal Time (UTC)</option>
                          <option>Central European Time (CET)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1">Date Format</label>
                      <div className="relative">
                        <select 
                          value={workspace.dateFormat}
                          onChange={(e) => setWorkspace({...workspace, dateFormat: e.target.value})}
                          className="w-full appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        >
                          <option>MM/DD/YYYY</option>
                          <option>DD/MM/YYYY</option>
                          <option>YYYY-MM-DD</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1">Default Currency</label>
                      <div className="relative">
                        <select 
                          value={workspace.currency}
                          onChange={(e) => setWorkspace({...workspace, currency: e.target.value})}
                          className="w-full appearance-none px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        >
                          <option>USD ($)</option>
                          <option>EUR (€)</option>
                          <option>GBP (£)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={handleSaveWorkspace}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Appearance</h3>
                  <p className="text-sm text-gray-500">Customize the look and feel of your dashboard.</p>
                </div>

                <div className="max-w-2xl space-y-6">
                  <div>
                    <h4 className="text-[14px] font-medium text-gray-900 mb-3">Theme Preference</h4>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <button 
                        onClick={() => handleThemeChange('light')}
                        className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${theme === 'light' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                      >
                        <Sun className={`w-6 h-6 mb-2 ${theme === 'light' ? 'text-indigo-600' : 'text-gray-500'}`} />
                        <span className={`text-[13px] font-medium ${theme === 'light' ? 'text-indigo-700' : 'text-gray-700'}`}>Light</span>
                      </button>
                      
                      <button 
                        onClick={() => handleThemeChange('dark')}
                        className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${theme === 'dark' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                      >
                        <Moon className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-indigo-600' : 'text-gray-500'}`} />
                        <span className={`text-[13px] font-medium ${theme === 'dark' ? 'text-indigo-700' : 'text-gray-700'}`}>Dark</span>
                      </button>

                      <button 
                        onClick={() => handleThemeChange('reading')}
                        className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${theme === 'reading' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                      >
                        <Laptop className={`w-6 h-6 mb-2 ${theme === 'reading' ? 'text-indigo-600' : 'text-gray-500'}`} />
                        <span className={`text-[13px] font-medium ${theme === 'reading' ? 'text-indigo-700' : 'text-gray-700'}`}>System</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Notifications</h3>
                  <p className="text-sm text-gray-500">Control when and how you are notified. Preferences are saved automatically.</p>
                </div>

                <div className="space-y-6 max-w-2xl">
                  {/* Toggle 1 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-medium text-gray-900">New Leads Assigned</h4>
                      <p className="text-[13px] text-gray-500 mt-0.5">Email me when a new lead is assigned to my team.</p>
                    </div>
                    <button 
                      onClick={() => handleNotificationChange('newLead')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications.newLead ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.newLead ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  {/* Toggle 2 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-medium text-gray-900">Task Status Updates</h4>
                      <p className="text-[13px] text-gray-500 mt-0.5">Email me when a task status changes.</p>
                    </div>
                    <button 
                      onClick={() => handleNotificationChange('taskStatus')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications.taskStatus ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.taskStatus ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Toggle 3 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-medium text-gray-900">Project Notifications</h4>
                      <p className="text-[13px] text-gray-500 mt-0.5">Send in-app notifications for project updates.</p>
                    </div>
                    <button 
                      onClick={() => handleNotificationChange('inAppProject')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications.inAppProject ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.inAppProject ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Toggle 4 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-medium text-gray-900">Weekly Summary</h4>
                      <p className="text-[13px] text-gray-500 mt-0.5">Receive a weekly summary report of workspace activity.</p>
                    </div>
                    <button 
                      onClick={() => handleNotificationChange('weeklySummary')}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications.weeklySummary ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.weeklySummary ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: Security */}
            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Security</h3>
                  <p className="text-sm text-gray-500">Manage your account password.</p>
                </div>

                {/* Password Section */}
                <div className="max-w-md space-y-5">
                  <h4 className="text-[14px] font-semibold text-gray-900 border-b border-gray-100 pb-2">Change Password</h4>
                  
                  {/* Current Password Field (Hidden if bypassed by OTP) */}
                  {!otpVerified && (
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={passwords.current}
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                      />
                      <button 
                        onClick={() => setOtpModalOpen(true)}
                        className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium mt-1.5 focus:outline-none"
                      >
                        Forgot Current Password?
                      </button>
                    </div>
                  )}

                  {otpVerified && (
                    <div className="px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[13px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Identity verified via OTP. You may now set a new password.
                    </div>
                  )}

                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1">New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwords.newPass}
                      onChange={(e) => setPasswords({...passwords, newPass: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                    />
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={handleChangePassword}
                      disabled={saving || !passwords.newPass || !passwords.confirm || (!otpVerified && !passwords.current)}
                      className="w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Update Password
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* OTP Modal */}
        {otpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setOtpModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">Security Check</h3>
              <p className="text-[13px] text-gray-500 mb-6">
                An OTP has been sent to your registered phone number. Enter the code below to reset your password. (Use <span className="font-mono bg-gray-100 px-1 rounded text-gray-800">123456</span> for this simulation).
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1">6-Digit Code</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-center text-lg tracking-widest font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                
                <button 
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length < 6}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  Verify Identity
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
