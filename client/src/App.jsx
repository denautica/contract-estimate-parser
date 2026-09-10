import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, Search, Filter, BarChart3, Trash2, Eye, CheckSquare, Square, X, Activity, AlertTriangle, Clock, CheckCircle, LogOut, User } from 'lucide-react';
import Login from './components/Login';
import UploadModal from './components/UploadModal';
import DocumentDetail from './components/DocumentDetail';
import CompareView from './components/CompareView';

const API_URL = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ totalDocuments: 0, activeDocuments: 0, expiringSoon: 0, properties: [], serviceCategories: [] });
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ property: '', serviceCategory: '', recurring: '', isActive: '' });
  const [selectedDocs, setSelectedDocs] = useState(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [detailDoc, setDetailDoc] = useState(null);
  const [compareDocs, setCompareDocs] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      throw new Error('Session expired. Please sign in again.');
    }
    return res;
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filters.property) params.append('property', filters.property);
    if (filters.serviceCategory) params.append('serviceCategory', filters.serviceCategory);
    if (filters.recurring) params.append('recurring', filters.recurring === 'yes' ? 'true' : 'false');
    if (filters.isActive) params.append('isActive', filters.isActive === 'yes' ? 'true' : 'false');
    
    try {
      const res = await fetchWithAuth(`${API_URL}/documents?${params}`);
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filters, fetchWithAuth]);

  const fetchStats = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchExpiring = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/documents/expiring`);
      const data = await res.json();
      setExpiringDocs(data.filter(d => d.urgency !== 'healthy').slice(0, 6));
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDocs();
  }, [fetchDocs, user]);

  useEffect(() => {
    if (!user) return;
    fetchStats();
    fetchExpiring();
  }, [user]);

  const toggleSelect = (id) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4 || bulkMode) next.add(id);
      return next;
    });
  };

  const clearBulk = () => {
    setSelectedDocs(new Set());
    setBulkMode(false);
  };

  const bulkSetStatus = async (isActive) => {
    if (selectedDocs.size === 0) return;
    setBulkUpdating(true);
    const ids = Array.from(selectedDocs);
    try {
      const res = await fetchWithAuth(`${API_URL}/documents/bulk/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk update failed');
      setSelectedDocs(new Set());
      setBulkMode(false);
      fetchDocs();
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    await fetchWithAuth(`${API_URL}/documents/${id}`, { method: 'DELETE' });
    setSelectedDocs(prev => { const n = new Set(prev); n.delete(id); return n; });
    fetchDocs();
    fetchStats();
    fetchExpiring();
  };

  const handleCompare = async () => {
    if (selectedDocs.size < 2) return;
    const ids = Array.from(selectedDocs);
    const res = await fetchWithAuth(`${API_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    const data = await res.json();
    setCompareDocs(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDate = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const urgencyColor = (u) => {
    if (u === 'expired') return '#8a2d2d';
    if (u === 'critical') return '#c87e3a';
    if (u === 'warning') return '#b8860b';
    if (u === 'notice') return '#2d5a8a';
    return '#5a8a2d';
  };

  const urgencyBg = (u) => {
    if (u === 'expired') return '#fff0f0';
    if (u === 'critical') return '#fff8f0';
    if (u === 'warning') return '#fffdf0';
    if (u === 'notice') return '#f0f8ff';
    return '#f0fff0';
  };

  const urgencyLabel = (u) => {
    if (u === 'expired') return 'Expired';
    if (u === 'critical') return '< 30 days';
    if (u === 'warning') return '< 60 days';
    if (u === 'notice') return '< 90 days';
    return 'Healthy';
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--charcoal)',
        color: 'var(--warm-white)',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius)',
            background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FileText size={22} color="var(--charcoal)" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Contract & Estimate Parser</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {stats.activeDocuments} active / {stats.totalDocuments} total documents
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', padding: '6px 12px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.08)' }}>
            <User size={14} />
            <span>{user.username}</span>
          </div>
          {selectedDocs.size >= 2 && !bulkMode && (
            <button onClick={handleCompare} style={{
              padding: '10px 18px', background: 'var(--amber)', color: 'var(--charcoal)',
              border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 14
            }}>
              <BarChart3 size={16} />
              Compare ({selectedDocs.size})
            </button>
          )}
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              setSelectedDocs(new Set());
            }}
            style={{
              padding: '10px 18px', background: bulkMode ? 'var(--amber-light)' : 'var(--warm-white)',
              color: 'var(--charcoal)', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14
            }}
          >
            <CheckSquare size={16} />
            {bulkMode ? 'Done Selecting' : 'Bulk Edit'}
          </button>
          <button onClick={() => setShowUpload(true)} style={{
            padding: '10px 18px', background: 'var(--warm-white)', color: 'var(--charcoal)',
            border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 14
          }}>
            <Upload size={16} />
            Upload Document
          </button>
          <button onClick={handleLogout} style={{
            padding: '10px 14px', background: 'transparent', color: 'var(--text-muted)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14
          }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', maxWidth: 1600, margin: '0 auto', width: '100%', padding: '24px 32px', gap: 24 }}>
        <aside style={{ width: 260, flexShrink: 0 }} className="no-print">
          <div style={{
            background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            padding: 20, position: 'sticky', top: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Filter size={16} color="var(--amber)" />
              <h3 style={{ fontSize: 15, fontFamily: 'Source Sans 3, sans-serif', fontWeight: 600 }}>Filters</h3>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Property</label>
              <select
                value={filters.property}
                onChange={e => setFilters(f => ({ ...f, property: e.target.value }))}
                style={{ width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'white' }}
              >
                <option value="">All Properties</option>
                {stats.properties.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Category</label>
              <select
                value={filters.serviceCategory}
                onChange={e => setFilters(f => ({ ...f, serviceCategory: e.target.value }))}
                style={{ width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'white' }}
              >
                <option value="">All Categories</option>
                {stats.serviceCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recurring</label>
              <select
                value={filters.recurring}
                onChange={e => setFilters(f => ({ ...f, recurring: e.target.value }))}
                style={{ width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'white' }}
              >
                <option value="">All</option>
                <option value="yes">Recurring</option>
                <option value="no">One-time</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
              <select
                value={filters.isActive}
                onChange={e => setFilters(f => ({ ...f, isActive: e.target.value }))}
                style={{ width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, background: 'white' }}
              >
                <option value="">All</option>
                <option value="yes">Active</option>
                <option value="no">Inactive</option>
              </select>
            </div>

            <button onClick={() => setFilters({ property: '', serviceCategory: '', recurring: '', isActive: '' })} style={{
              width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)'
            }}>
              Clear Filters
            </button>
          </div>
        </aside>

        <main style={{ flex: 1 }}>
          {/* Expiring Dashboard */}
          {expiringDocs.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={18} color="var(--amber)" />
                <h2 style={{ fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)' }}>
                  Expiring & Expired Contracts
                </h2>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                  ({stats.expiringSoon} expiring in 90 days)
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {expiringDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => setDetailDoc(doc)}
                    style={{
                      padding: 14, borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                      background: urgencyBg(doc.urgency), cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'box-shadow 0.2s',
                      borderLeft: `4px solid ${urgencyColor(doc.urgency)}`
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: urgencyColor(doc.urgency), flexShrink: 0
                    }}>
                      {doc.urgency === 'expired' ? <AlertTriangle size={18} color="white" /> : <Clock size={18} color="white" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.projectNickname || doc.originalName}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {doc.supplierName} · Expires {formatDate(doc.expirationDate)}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '2px 8px', borderRadius: 10, background: 'white', color: urgencyColor(doc.urgency),
                      border: `1px solid ${urgencyColor(doc.urgency)}`, flexShrink: 0
                    }}>
                      {urgencyLabel(doc.urgency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Action Bar */}
          {bulkMode && selectedDocs.size > 0 && (
            <div style={{
              marginBottom: 20, padding: 14, borderRadius: 'var(--radius)',
              background: 'var(--warm-white)', border: '2px solid var(--amber)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare size={18} color="var(--amber)" />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>
                  {selectedDocs.size} selected
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => bulkSetStatus(true)}
                  disabled={bulkUpdating}
                  style={{
                    padding: '8px 14px', background: '#2d5a2d', color: 'white', border: 'none',
                    borderRadius: 'var(--radius)', cursor: bulkUpdating ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <CheckCircle size={14} /> {bulkUpdating ? 'Updating...' : 'Mark Active'}
                </button>
                <button
                  onClick={() => bulkSetStatus(false)}
                  disabled={bulkUpdating}
                  style={{
                    padding: '8px 14px', background: '#8a2d2d', color: 'white', border: 'none',
                    borderRadius: 'var(--radius)', cursor: bulkUpdating ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <X size={14} /> {bulkUpdating ? 'Updating...' : 'Mark Inactive'}
                </button>
                <button
                  onClick={clearBulk}
                  style={{
                    padding: '8px 14px', background: 'transparent', color: 'var(--text-secondary)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }} className="no-print">
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search documents, suppliers, descriptions, keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 40px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', fontSize: 14, background: 'white'
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading documents...</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
              <p>No documents found. Upload your first contract or estimate.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {documents.map(doc => (
                <div key={doc.id} style={{
                  background: 'white',
                  borderRadius: 'var(--radius)',
                  border: doc.isActive === 1 ? '2px solid var(--amber)' : '1px solid var(--border)',
                  padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'pointer',
                  boxShadow: doc.isActive === 1 ? '0 0 12px rgba(200, 126, 58, 0.15)' : 'none'
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = doc.isActive === 1 ? '0 4px 16px rgba(200, 126, 58, 0.25)' : '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = doc.isActive === 1 ? '0 0 12px rgba(200, 126, 58, 0.15)' : 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div onClick={() => setDetailDoc(doc)} style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                          padding: '2px 8px', borderRadius: 10,
                          background: doc.property === 'Canyon View' ? '#e8f0e8' : doc.property === 'Rockpoint' ? '#e8e8f0' : doc.property === 'Boulder Canyon' ? '#f0e8e0' : '#f0f0f0',
                          color: doc.property === 'Canyon View' ? '#2d5a2d' : doc.property === 'Rockpoint' ? '#3d3d5a' : doc.property === 'Boulder Canyon' ? '#5a3d2d' : '#5a5a5a'
                        }}>{doc.property || 'Other'}</span>
                        {doc.recurring === 1 && (
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 10, background: 'var(--amber-light)', color: 'var(--charcoal)' }}>
                            Recurring
                          </span>
                        )}
                        {doc.isActive === 1 && (
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 10, background: '#e8f0e8', color: '#2d5a2d' }}>
                            Active
                          </span>
                        )}
                        {doc.supersededById && (
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 10, background: '#f0e8e0', color: '#5a3d2d' }}>
                            Superseded
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>
                        {doc.projectNickname || doc.originalName}
                      </h3>
                      {doc.projectNickname && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 2 }}>
                          {doc.originalName}
                        </p>
                      )}
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{doc.supplierName || 'Unknown Supplier'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }} className="no-print">
                      <button onClick={e => { e.stopPropagation(); toggleSelect(doc.id); }} style={{
                        padding: 6, border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                        background: selectedDocs.has(doc.id) ? 'var(--amber)' : 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {selectedDocs.has(doc.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </div>
                  </div>

                  <div onClick={() => setDetailDoc(doc)} style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {doc.description || 'No description available'}
                    </p>
                  </div>

                  <div onClick={() => setDetailDoc(doc)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Price</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'Playfair Display, serif' }}>{formatCurrency(doc.totalPrice)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{doc.serviceCategory || '—'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                    <div className="no-print" style={{ display: 'flex', gap: 6 }}>
                      <button onClick={e => { e.stopPropagation(); setDetailDoc(doc); }} style={{
                        padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)'
                      }}><Eye size={14} /></button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(doc.id); }} style={{
                        padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)'
                      }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { fetchDocs(); fetchStats(); fetchExpiring(); setShowUpload(false); }}
        />
      )}

      {detailDoc && (
        <DocumentDetail
          doc={detailDoc}
          onClose={() => setDetailDoc(null)}
          onSelect={setDetailDoc}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}

      {compareDocs && (
        <CompareView
          docs={compareDocs}
          onClose={() => setCompareDocs(null)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}
