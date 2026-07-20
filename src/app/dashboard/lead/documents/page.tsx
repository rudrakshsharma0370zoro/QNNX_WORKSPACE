"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Filter, Search, CloudUpload, FileText, FileSpreadsheet, Image as ImageIcon, Lock, Download, Loader2, Trash2 } from 'lucide-react';
import { auth } from '@/config/firebaseConfig';

export default function LeadDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('resources');
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageCategories = [
    { name: 'resources', tier: 'Company-wide' },
    { name: 'architecture', tier: 'Leadership' },
    { name: 'project-docs', tier: 'Leadership' },
    { name: 'meeting-notes', tier: 'Leadership' },
    { name: 'task-files', tier: 'My Files' },
    { name: 'personal-files', tier: 'My Files' },
  ];

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // 1. Get Presigned URL
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
          category: selectedCategory
        })
      });
      
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.details || 'Failed to get upload URL');

      // 2. Upload to S3
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      
      if (!uploadRes.ok) throw new Error('Failed to upload file to S3');

      // 3. Save Metadata to Firestore
      const docRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: file.name,
          category: selectedCategory,
          s3Key: presignData.s3Key
        })
      });
      
      if (!docRes.ok) throw new Error('Failed to save document metadata');
      
      // 4. Refresh List
      await fetchDocuments();
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: any) => {
    if (!doc.s3Key) {
      if (doc.url) window.open(doc.url, '_blank');
      return;
    }
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/uploads/download', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ s3Key: doc.s3Key })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || 'Download failed');
      
      window.open(data.downloadUrl, '_blank');
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  // Leads can delete any document except the confidential tier — but the
  // confidential tier never reaches this page (GET /api/documents already
  // filters it out for a lead), so any doc rendered here is deletable.
  const handleDelete = async (doc: any) => {
    if (!confirm(`Delete "${doc.title}"? This permanently removes it from S3.`)) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.details || 'Delete failed');
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (['csv', 'xls', 'xlsx'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    return <Lock className="w-4 h-4 text-gray-400" />;
  };

  const filteredDocs = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-[#111827]">Documents</h2>
          <p className="text-[13px] text-gray-500 mt-1">Upload and manage team files securely via S3.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Main Table Area */}
          <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="relative w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>

            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-center">Category</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading documents...
                    </td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No documents found. Upload one to get started.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc, idx) => (
                    <tr key={doc.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center shrink-0">
                            {getFileIcon(doc.title)}
                          </div>
                          <span className="font-medium text-gray-900 text-[13px]">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 border border-gray-200 ${doc.category === 'employee-records' || doc.category === 'company-confidential' ? 'text-red-500' : 'text-gray-500'}`}>
                          {doc.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[13px] text-gray-500">
                        {doc.addedAt ? new Date(doc.addedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Download from S3"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete from S3"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Right Sidebar Widgets */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
            
            {/* Upload Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                <CloudUpload className="w-4 h-4 text-indigo-600" /> Upload File
              </h3>
              <p className="text-[12px] text-gray-500 mb-4">Select a category to securely store your document.</p>
              
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Storage Category</label>
                <select 
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={uploading}
                >
                  {storageCategories.map((cat, i) => (
                    <option key={i} value={cat.name}>{cat.name} ({cat.tier})</option>
                  ))}
                </select>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
              />
              
              <div 
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 flex flex-col items-center justify-center py-8 px-4 text-center transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-indigo-400 mb-3 animate-spin" />
                    <p className="text-[13px] font-semibold text-indigo-600">Uploading to S3...</p>
                    <p className="text-[11px] text-gray-400 mt-1">Please wait</p>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-8 h-8 text-indigo-400 mb-3" />
                    <p className="text-[13px] font-semibold text-indigo-600">Click to Browse</p>
                    <p className="text-[11px] text-gray-400 mt-1">or drag and drop files here</p>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}