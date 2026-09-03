import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader, Trash2, Tag, Activity } from 'lucide-react';

const API_URL = '/api';

export default function UploadModal({ onClose, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [projectNickname, setProjectNickname] = useState('');
  const [isActive, setIsActive] = useState(true);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    validateAndAdd(dropped);
  };

  const validateAndAdd = (newFiles) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const valid = newFiles.filter(f => {
      if (!allowed.includes(f.type)) return false;
      if (f.size > 50 * 1024 * 1024) return false;
      return true;
    });

    if (valid.length < newFiles.length) {
      setError('Some files were skipped (only PDF, JPG, PNG under 50MB allowed)');
    } else {
      setError('');
    }

    setFiles(prev => [...prev, ...valid.map(f => ({ file: f, id: Math.random().toString(36).slice(2) }))]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    files.forEach(f => formData.append('files', f.file));
    formData.append('projectNickname', projectNickname);
    formData.append('isActive', isActive ? 'true' : 'false');

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      if (data.totalProcessed > 0) {
        onSuccess();
      } else {
        setError('No files were successfully processed. Check console for details.');
        setUploading(false);
      }
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 'var(--radius)', maxWidth: 600, width: '100%',
          maxHeight: '90vh', overflow: 'auto', padding: 32, animation: 'slideUp 0.3s ease',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22 }}>Upload Documents</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={24} color="var(--text-muted)" />
          </button>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--amber)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', padding: 40, textAlign: 'center',
            background: dragOver ? 'rgba(200, 126, 58, 0.05)' : 'var(--warm-white)',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <input 
            ref={inputRef} 
            type="file" 
            accept=".pdf,.jpg,.jpeg,.png" 
            multiple
            style={{ display: 'none' }} 
            onChange={e => validateAndAdd(Array.from(e.target.files))} 
          />
          <Upload size={40} color="var(--amber)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Drop files here or click to browse</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF, JPG, or PNG up to 50MB each</p>
        </div>

        {files.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(totalSize / 1024 / 1024).toFixed(2)} MB total</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.map(f => (
                <div key={f.id} style={{
                  padding: 10, background: 'var(--warm-white)', borderRadius: 'var(--radius)',
                  display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)'
                }}>
                  <FileText size={18} color="var(--amber)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.file.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={() => removeFile(f.id)} 
                    disabled={uploading}
                    style={{ border: 'none', background: 'transparent', cursor: uploading ? 'not-allowed' : 'pointer', padding: 4 }}
                  >
                    <Trash2 size={16} color="var(--danger)" />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: 16, background: 'var(--warm-white)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Tag size={14} color="var(--amber)" /> Project Nickname (Optional)
                </label>
                <input
                  type="text"
                  value={projectNickname}
                  onChange={e => setProjectNickname(e.target.value)}
                  placeholder="Applied to all uploaded files"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'white' }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>A friendly name like "HVAC Replacement 2024"</p>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Activity size={14} color="var(--amber)" /> Status
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <label htmlFor="isActive" style={{ fontSize: 14, cursor: 'pointer', color: 'var(--charcoal)' }}>
                    Mark uploaded documents as active
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p style={{ marginTop: 16, color: 'var(--danger)', fontSize: 14 }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={files.length === 0 || uploading}
          style={{
            marginTop: 24, width: '100%', padding: '12px', 
            background: (files.length === 0 || uploading) ? 'var(--border)' : 'var(--charcoal)',
            color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600,
            cursor: (files.length === 0 || uploading) ? 'not-allowed' : 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          {uploading ? <><Loader size={18} className="spin" /> Processing {files.length} file{files.length !== 1 ? 's' : ''} with AI...</> : `Upload & Parse ${files.length} File${files.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
