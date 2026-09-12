import React, { useState, useEffect } from 'react';
import { X, FileText, Trash2, AlertTriangle, CheckSquare, Square, Copy } from 'lucide-react';

const API_URL = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function DuplicateFinder({ onClose, formatCurrency, formatDate, onDelete }) {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState('filename');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/documents/duplicates?type=${searchType}`, {
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
        return;
      }
      const data = await res.json();
      setDuplicates(data);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [searchType]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} selected document(s)? This cannot be undone.`)) return;
    setDeleting(true);
    const ids = Array.from(selectedIds);
    let deleted = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`${API_URL}/documents/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res.ok) deleted++;
      } catch (err) {
        console.error(err);
      }
    }
    setDeleting(false);
    setSelectedIds(new Set());
    fetchDuplicates();
    onDelete();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 'var(--radius)', maxWidth: 900, width: '100%',
          maxHeight: '90vh', overflow: 'auto', padding: 32, animation: 'slideUp 0.3s ease',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Duplicate Finder</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Find and remove duplicate documents
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={24} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setSearchType('filename')}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              background: searchType === 'filename' ? 'var(--amber)' : 'white',
              color: searchType === 'filename' ? 'white' : 'var(--charcoal)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}
          >
            <Copy size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
            Same File Name
          </button>
          <button
            onClick={() => setSearchType('contract')}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              background: searchType === 'contract' ? 'var(--amber)' : 'white',
              color: searchType === 'contract' ? 'white' : 'var(--charcoal)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}
          >
            <FileText size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
            Same Contract Details
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Scanning for duplicates...</div>
        ) : duplicates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <AlertTriangle size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>No duplicates found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {selectedIds.size > 0 && (
              <div style={{
                padding: 12, borderRadius: 'var(--radius)', background: '#fff0f0',
                border: '1px solid #e0c0c0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#8a2d2d' }}>
                  {selectedIds.size} selected for deletion
                </span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    padding: '6px 14px', background: '#8a2d2d', color: 'white', border: 'none',
                    borderRadius: 'var(--radius)', cursor: deleting ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Trash2 size={14} />
                  {deleting ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            )}

            {duplicates.map((group, idx) => (
              <div key={idx} style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '10px 16px', background: 'var(--warm-white)',
                  borderBottom: '1px solid var(--border)', fontSize: 12,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: 'var(--text-secondary)'
                }}>
                  Duplicate Group {idx + 1} · {group.length} documents
                </div>
                <div style={{ padding: 12 }}>
                  {group.map(doc => (
                    <div key={doc.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)', marginBottom: 8,
                      background: selectedIds.has(doc.id) ? 'rgba(200, 126, 58, 0.08)' : 'white',
                      transition: 'background 0.2s'
                    }}>
                      <button
                        onClick={() => toggleSelect(doc.id)}
                        style={{
                          border: 'none', background: 'transparent', cursor: 'pointer',
                          padding: 4, display: 'flex', alignItems: 'center'
                        }}
                      >
                        {selectedIds.has(doc.id) ? (
                          <CheckSquare size={18} color="var(--amber)" />
                        ) : (
                          <Square size={18} color="var(--border)" />
                        )}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.projectNickname || doc.originalName}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {doc.supplierName || 'Unknown'} · {doc.property || 'Other'} · {formatCurrency(doc.totalPrice)}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                          Uploaded {formatDate(doc.uploadedAt)}
                          {doc.isActive === 1 && (
                            <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 4, background: '#e8f0e8', color: '#2d5a2d', fontWeight: 700 }}>
                              ACTIVE
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          if (!confirm('Delete this document permanently?')) return;
                          try {
                            const res = await fetch(`${API_URL}/documents/${doc.id}`, {
                              method: 'DELETE',
                              headers: getAuthHeaders()
                            });
                            if (res.ok) {
                              fetchDuplicates();
                              onDelete();
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        style={{
                          border: 'none', background: 'transparent', cursor: 'pointer',
                          padding: 6, color: 'var(--danger)'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
