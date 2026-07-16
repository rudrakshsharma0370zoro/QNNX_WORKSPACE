import React from 'react';
import { Search, Filter, UploadCloud, FileText, Image as ImageIcon, Lock, MoreHorizontal } from 'lucide-react';

// Demo data - Documents
const documentsList = [
  { id: 1, name: 'QNNX_Architecture_v2.pdf', category: '/architecture', size: '2.4 MB', date: 'Oct 12, 2026', type: 'pdf', isRestricted: false },
  { id: 2, name: 'API_Endpoints_List.csv', category: '/other-sources', size: '84 KB', date: 'Oct 05, 2026', type: 'csv', isRestricted: false },
  { id: 3, name: 'Employee_Handbook.docx', category: '/other-sources', size: '1.1 MB', date: 'Sep 28, 2026', type: 'doc', isRestricted: false },
  { id: 4, name: 'Dashboard_Mockup.png', category: '/other-sources', size: '4.2 MB', date: 'Oct 14, 2026', type: 'image', isRestricted: false },
  { id: 5, name: 'passport_copy_secure.pdf', category: '/personal-info', size: '1.8 MB', date: 'Mar 15, 2024', type: 'pdf', isRestricted: true },
];

export default function DocumentsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-500 mt-1">Upload and manage your files.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Documents Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* Search and Filter */}
          <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search files..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documentsList.map((doc) => (
                  <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${doc.isRestricted ? 'opacity-60 bg-gray-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {doc.isRestricted ? (
                          <div className="p-2 bg-gray-100 text-gray-500 rounded-lg"><Lock className="w-5 h-5" /></div>
                        ) : doc.type === 'image' ? (
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ImageIcon className="w-5 h-5" /></div>
                        ) : (
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                        )}
                        <span className={`text-sm font-medium ${doc.isRestricted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase ${
                        doc.isRestricted ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{doc.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{doc.date}</td>
                    <td className="px-6 py-4 text-right">
                      {!doc.isRestricted && (
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side - Upload & Storage Widgets */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Upload Widget */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" /> Upload File
            </h2>
            <p className="text-xs text-gray-500 mb-4">Select a category to securely store your document.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Category</label>
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700">
                  <option value="/architecture">/architecture</option>
                  <option value="/other-sources">/other-sources</option>
                  <option value="/personal-info" disabled>/personal-info (Restricted)</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer text-center">
                <UploadCloud className="w-8 h-8 text-indigo-500 mb-3" />
                <span className="text-sm font-medium text-gray-900">Click to Browse</span>
                <span className="text-xs text-gray-500 mt-1">or drag and drop files here</span>
              </div>
            </div>
          </div>

          {/* Storage Used Widget */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Storage Used</h2>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-gray-700">Architecture Files</span>
                  <span className="text-indigo-600 font-medium">45%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-gray-700">Other Sources</span>
                  <span className="text-emerald-600 font-medium">20%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
              <span className="text-gray-500">Total: <span className="font-semibold text-gray-900">65 GB</span></span>
              <span className="text-gray-500">Limit: <span className="font-semibold text-gray-900">100 GB</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}