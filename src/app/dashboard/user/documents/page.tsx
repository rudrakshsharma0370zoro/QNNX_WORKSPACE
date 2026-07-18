"use client";
import { useState, useRef } from 'react';
import { CloudUpload, FileText, CheckCircle, Upload } from 'lucide-react';
import { mockTasks } from '../../../../utils/adminMockData';

export default function UserDocuments() {
  const CURRENT_USER_ID = 'e1';
  const myTasks = mockTasks.filter(t => t.assigneeId === CURRENT_USER_ID && t.status !== 'Completed');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'Wireframe_v1.fig', task: 'Design Homepage Wireframes', date: 'Today, 09:30 AM', status: 'Submitted' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragDropClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      simulateUpload(file.name);
    }
  };

  const simulateUpload = (filename: string) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadedFiles([
            { name: filename, task: 'Selected Task', date: 'Just now', status: 'Submitted' },
            ...uploadedFiles
          ]);
        }, 500);
      }
    }, 400);
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-[#111827]">Task Deliverables</h2>
          <p className="text-[13px] text-gray-500 mt-1">Upload your finished work here to notify your Lead.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Upload Section (Left) */}
          <div className="w-full lg:w-[450px] shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Upload className="w-4 h-4 text-indigo-600" /> Submit Work
            </h3>
            
            <div className="mb-5">
              <label className="block text-[12px] font-semibold text-gray-700 mb-2">Select Task to Submit For</label>
              <select className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                {myTasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
                {myTasks.length === 0 && <option>No active tasks available</option>}
              </select>
            </div>

            <input 
              type="text"
              className="hidden" 
              readOnly 
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />

            <div 
              onClick={handleDragDropClick}
              className={`border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 flex flex-col items-center justify-center py-12 px-6 text-center transition-colors ${!isUploading ? 'cursor-pointer hover:bg-indigo-50' : 'opacity-70'}`}
            >
              {!isUploading ? (
                <>
                  <CloudUpload className="w-10 h-10 text-indigo-400 mb-3" />
                  <p className="text-[14px] font-semibold text-indigo-600 mb-1">Click to browse your files</p>
                  <p className="text-[12px] text-gray-500">Maximum file size: 50MB</p>
                </>
              ) : (
                <div className="w-full">
                  <p className="text-[13px] font-semibold text-indigo-600 mb-3">Uploading Deliverable... {uploadProgress}%</p>
                  <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              disabled={isUploading}
              className="mt-6 w-full py-2.5 bg-gray-900 text-white rounded-lg text-[13px] font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Submit Deliverable
            </button>
          </div>

          {/* Upload History (Right) */}
          <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Recent Submissions</h3>
            </div>
            
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                <tr>
                  <th className="px-5 py-3">File Name</th>
                  <th className="px-5 py-3 text-center">Date</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uploadedFiles.map((file, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 text-[13px]">{file.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">For: {file.task}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-[12px] text-gray-500">
                      {file.date}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-[12px] font-medium">{file.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}
