"use client";
import { Filter, Search, CloudUpload, FileText, FileSpreadsheet, Image as ImageIcon, Lock, Download } from 'lucide-react';

export default function UserDocuments() {
  const documents = [
    { name: 'QNNX_Architecture_v2.pdf', category: '/ARCHITECTURE', size: '2.4 MB', date: 'Oct 12, 2026', icon: <FileText className="w-5 h-5 text-blue-500" /> },
    { name: 'API_Endpoints_List.csv', category: '/OTHER-SOURCES', size: '84 KB', date: 'Oct 05, 2026', icon: <FileSpreadsheet className="w-5 h-5 text-green-500" /> },
    { name: 'Dashboard_Mockup.png', category: '/MARKETING-ASSETS', size: '4.2 MB', date: 'Oct 14, 2026', icon: <ImageIcon className="w-5 h-5 text-purple-500" /> },
  ];

  const storageCategories = [
    { name: '/public-assets', tier: 'Tier 1: Public' },
    { name: '/marketing-assets', tier: 'Tier 1: Public' },
    { name: '/architecture', tier: 'Tier 2: Internal' },
    { name: '/project-docs', tier: 'Tier 2: Internal' },
    { name: '/other-sources', tier: 'Tier 2: Internal' },
    { name: '/employee-records', tier: 'Tier 3: Confidential' },
    { name: '/financial-records', tier: 'Tier 3: Confidential' },
    { name: '/personal-info', tier: 'Tier 4: Restricted' },
    { name: '/legal-contracts', tier: 'Tier 4: Restricted' }
  ];

  const handleDownload = (fileName: string) => {
    alert(`Downloading ${fileName} via S3...`);
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-[#111827]">Documents</h2>
          <p className="text-[13px] text-gray-500 mt-1">Upload and manage your files.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Main Table Area */}
          <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="relative w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
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
                  <th className="px-6 py-4 text-center">Size</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center shrink-0">
                          {doc.icon}
                        </div>
                        <span className="font-medium text-gray-900 text-[13px]">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 border border-gray-200 ${doc.category === '/PERSONAL-INFO' || doc.category === '/LEGAL-CONTRACTS' ? 'text-red-500' : 'text-gray-500'}`}>
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-[13px] text-gray-500">
                      {doc.size}
                    </td>
                    <td className="px-6 py-4 text-center text-[13px] text-gray-500">
                      {doc.date}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDownload(doc.name)}
                          className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Download from S3"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:text-gray-900 transition-colors">•••</button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Storage Category (9 Tiers)</label>
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none">
                  {storageCategories.map((cat, i) => (
                    <option key={i} value={cat.name}>{cat.name} ({cat.tier})</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 flex flex-col items-center justify-center py-8 px-4 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                <CloudUpload className="w-8 h-8 text-indigo-400 mb-3" />
                <p className="text-[13px] font-semibold text-indigo-600">Click to Browse</p>
                <p className="text-[11px] text-gray-400 mt-1">or drag and drop files here</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
