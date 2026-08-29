import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader } from 'lucide-react';

const API_URL = '/api';

export default function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validateFile(f);
  };

  const validateFile = (f) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(f.type)) {
      setError('Only PDF, JPG, and PNG files are allowed');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File size must be under 20MB');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onSuccess();
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 'var(--radius)', maxWidth: 520, width: '100%',
          padding: 32, animation: 'slideUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22 }}>Upload Document</h2>
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
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => validateFile(e.target.files[0])} />
          <Upload size={40} color="var(--amber)" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Drop your file here or click to browse</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF, JPG, or PNG up to 20MB</p>
        </div>

        {file && (
          <div style={{
            marginTop: 16, padding: 12, background: 'var(--warm-white)', borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <FileText size={20} color="var(--amber)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => setFile(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <X size={16} color="var(--text-muted)" />
            </button>
          </div>
        )}

        {error && (
          <p style={{ marginTop: 16, color: 'var(--danger)', fontSize: 14 }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          style={{
            marginTop: 24, width: '100%', padding: '12px', background: (!file || uploading) ? 'var(--border)' : 'var(--charcoal)',
            color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600,
            cursor: (!file || uploading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8
          }}
        >
          {uploading ? <><Loader size={18} className="spin" /> Processing with AI...</> : 'Upload & Parse'}
        </button>
      </div>
    </div>
  );
}
