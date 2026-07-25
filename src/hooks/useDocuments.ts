import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export function useDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (file: File, category: string) => {
    try {
      setUploading(true);
      
      // 1. Get Presigned URL
      const presignRes = await fetchWithAuth('/api/uploads/presign', {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          category,
          size: file.size
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
      const docRes = await fetchWithAuth('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: file.name,
          category,
          s3Key: presignData.s3Key
        })
      });
      
      if (!docRes.ok) throw new Error('Failed to save document metadata');
      
      // 4. Refresh List
      await fetchDocuments();
      return true;
    } catch (err: any) {
      alert(err.message || 'Upload failed');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (doc: any) => {
    if (!doc.s3Key) {
      if (doc.url) window.open(doc.url, '_blank');
      return;
    }
    
    try {
      const res = await fetchWithAuth('/api/uploads/download', {
        method: 'POST',
        body: JSON.stringify({ s3Key: doc.s3Key })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || 'Download failed');
      
      window.open(data.downloadUrl, '_blank');
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  const deleteDocument = async (doc: any) => {
    if (!confirm(`Delete "${doc.title}"? This permanently removes it from S3.`)) return false;
    try {
      const res = await fetchWithAuth(`/api/documents/${doc.id}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.details || 'Delete failed');
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      return true;
    } catch (err: any) {
      alert(err.message || 'Delete failed');
      return false;
    }
  };

  return {
    documents,
    loading,
    uploading,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments
  };
}
