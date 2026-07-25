"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Filter, Search, CloudUpload, FileText, FileSpreadsheet, Image as ImageIcon, Lock, Download, Loader2, Trash2 } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';

export default function LeadDocuments() {
  const { documents, loading, uploading, uploadDocument, downloadDocument, deleteDocument } = useDocuments();
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await uploadDocument(file, selectedCategory);
    if (success && fileInputRef.current) {
      fileInputRef.current.value = '';
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
                            onClick={() => downloadDocument(doc)}
                            className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Download from S3"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDocument(doc)}
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
                accept=".pdf,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip"
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