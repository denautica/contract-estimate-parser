import React, { useState, useEffect } from 'react';
import { X, FileText, Building2, DollarSign, Calendar, Tag, Repeat, AlertCircle, ExternalLink, Pencil, Save, XCircle, Eye, EyeOff, Maximize2 } from 'lucide-react';

const API_URL = '/api';
const PROPS = ['Canyon View', 'Rockpoint', 'Boulder Canyon', 'Other'];

export default function DocumentDetail({ doc, onClose, formatCurrency, formatDate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localDoc, setLocalDoc] = useState(doc);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [previewExpanded, setPreviewExpanded] = useState(false);

  useEffect(() => {
    setLocalDoc(doc);
    setEditForm({
      estimateDate: doc.estimateDate || '',
      supplierName: doc.supplierName || '',
      property: doc.property || 'Other',
      description: doc.description || '',
      keywords: doc.keywords || '',
      serviceCategory: doc.serviceCategory || '',
      totalPrice: doc.totalPrice !== null && doc.totalPrice !== undefined ? doc.totalPrice : '',
      recurring: doc.recurring === 1,
      billingInterval: doc.billingInterval || '',
      intervalAmount: doc.intervalAmount !== null && doc.intervalAmount !== undefined ? doc.intervalAmount : '',
      expirationDate: doc.expirationDate || '',
      cancellationTerms: doc.cancellationTerms || ''
    });
    setIsEditing(false);
    setError('');
  }, [doc]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...editForm,
        totalPrice: editForm.totalPrice === '' ? null : parseFloat(editForm.totalPrice),
        intervalAmount: editForm.intervalAmount === '' ? null : parseFloat(editForm.intervalAmount),
        recurring: editForm.recurring
      };
      const res = await fetch(`${API_URL}/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setLocalDoc(data);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setEditForm({
      estimateDate: localDoc.estimateDate || '',
      supplierName: localDoc.supplierName || '',
      property: localDoc.property || 'Other',
      description: localDoc.description || '',
      keywords: localDoc.keywords || '',
      serviceCategory: localDoc.serviceCategory || '',
      totalPrice: localDoc.totalPrice !== null && localDoc.totalPrice !== undefined ? localDoc.totalPrice : '',
      recurring: localDoc.recurring === 1,
      billingInterval: localDoc.billingInterval || '',
      intervalAmount: localDoc.intervalAmount !== null && localDoc.intervalAmount !== undefined ? localDoc.intervalAmount : '',
      expirationDate: localDoc.expirationDate || '',
      cancellationTerms: localDoc.cancellationTerms || ''
    });
  };

  const isPdf = localDoc.filename && localDoc.filename.toLowerCase().endsWith('.pdf');
  const isImage = localDoc.filename && /\.(jpg|jpeg|png)$/i.test(localDoc.filename);
  const fileUrl = `/uploads/${localDoc.filename}`;

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontFamily: 'Source Sans 3, sans-serif',
    background: 'white',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    marginBottom: 4,
    display: 'block'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 'var(--radius)',
          maxWidth: previewExpanded ? 1200 : 1100,
          width: '95vw',
          maxHeight: '95vh',
          overflow: 'hidden',
          padding: 0,
          animation: 'slideUp 0.3s ease',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexShrink: 0
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '2px 10px', borderRadius: 12,
                background: localDoc.property === 'Canyon View' ? '#e8f0e8' : localDoc.property === 'Rockpoint' ? '#e8e8f0' : localDoc.property === 'Boulder Canyon' ? '#f0e8e0' : '#f0f0f0',
                color: localDoc.property === 'Canyon View' ? '#2d5a2d' : localDoc.property === 'Rockpoint' ? '#3d3d5a' : localDoc.property === 'Boulder Canyon' ? '#5a3d2d' : '#5a5a5a'
              }}>{localDoc.property || 'Other'}</span>
              {localDoc.recurring === 1 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                  padding: '2px 10px', borderRadius: 12, background: 'var(--amber-light)', color: 'var(--charcoal)'
                }}>Recurring</span>
              )}
            </div>
            <h2 style={{ fontSize: 20, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={localDoc.originalName}>
              {localDoc.originalName}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Uploaded {formatDate(localDoc.uploadedAt)}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }} className="no-print">
            <button
              onClick={() => setPreviewExpanded(e => !e)}
              title={previewExpanded ? 'Shrink preview' : 'Expand preview'}
              style={{
                padding: '8px 12px', background: 'var(--warm-white)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, color: 'var(--charcoal)'
              }}
            >
              {previewExpanded ? <EyeOff size={14} /> : <Maximize2 size={14} />}
              {previewExpanded ? 'Shrink' : 'Expand'}
            </button>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} style={{
                padding: '8px 14px', background: 'var(--charcoal)', color: 'white', border: 'none',
                borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <Pencil size={14} /> Edit
              </button>
            )}
            {isEditing && (
              <>
                <button onClick={handleSave} disabled={saving} style={{
                  padding: '8px 14px', background: 'var(--success)', color: 'white', border: 'none',
                  borderRadius: 'var(--radius)', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleCancel} style={{
                  padding: '8px 14px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <XCircle size={14} /> Cancel
                </button>
              </>
            )}
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}>
              <X size={24} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 28px', background: '#fff0f0', color: 'var(--danger)', fontSize: 14, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div style={{
            width: previewExpanded ? '60%' : '50%',
            minWidth: 300,
            borderRight: '1px solid var(--border)',
            background: '#f8f7f5',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.3s ease'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={16} color="var(--amber)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>Document Preview</span>
              </div>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{
                fontSize: 12, color: 'var(--amber)', fontWeight: 600, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                <ExternalLink size={12} /> Open in New Tab
              </a>
            </div>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16 }}>
              {isPdf ? (
                <iframe
                  src={fileUrl}
                  style={{
                    width: '100%',
                    height: previewExpanded ? 750 : 600,
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'white'
                  }}
                  title="Document Preview"
                />
              ) : isImage ? (
                <img
                  src={fileUrl}
                  alt="Document Preview"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                />
              ) : (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={64} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <p style={{ fontSize: 15 }}>Preview not available for this file type</p>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', marginTop: 12, fontSize: 14, color: 'var(--amber)', fontWeight: 600
                  }}>
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>

          <div style={{
            width: previewExpanded ? '40%' : '50%',
            overflow: 'auto',
            padding: '24px 28px',
            transition: 'width 0.3s ease'
          }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--charcoal)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6
              }}>
                <FileText size={14} color="var(--amber)" /> AI Description
              </h3>
              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                />
              ) : (
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {localDoc.description || 'No description available'}
                </p>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--charcoal)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6
              }}>
                <Tag size={14} color="var(--amber)" /> Keywords
              </h3>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.keywords}
                  onChange={e => setEditForm(f => ({ ...f, keywords: e.target.value }))}
                  placeholder="Comma-separated keywords"
                  style={inputStyle}
                />
              ) : (
                localDoc.keywords ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {localDoc.keywords.split(',').map((k, i) => (
                      <span key={i} style={{
                        fontSize: 12, padding: '4px 10px', borderRadius: 12, background: 'var(--cream)',
                        color: 'var(--text-secondary)', fontWeight: 500
                      }}>{k.trim()}</span>
                    ))}
                  </div>
                ) : <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No keywords</p>
              )}
            </div>

            <h3 style={{
              fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--charcoal)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6
            }}>
              <Building2 size={14} color="var(--amber)" /> Extracted Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isEditing ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Estimate Date</label>
                      <input type="date" value={editForm.estimateDate} onChange={e => setEditForm(f => ({ ...f, estimateDate: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Supplier Name</label>
                      <input type="text" value={editForm.supplierName} onChange={e => setEditForm(f => ({ ...f, supplierName: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Property</label>
                      <select value={editForm.property} onChange={e => setEditForm(f => ({ ...f, property: e.target.value }))} style={inputStyle}>
                        {PROPS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Service Category</label>
                      <input type="text" value={editForm.serviceCategory} onChange={e => setEditForm(f => ({ ...f, serviceCategory: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Total Price</label>
                      <input type="number" step="0.01" value={editForm.totalPrice} onChange={e => setEditForm(f => ({ ...f, totalPrice: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Recurring</label>
                      <select value={editForm.recurring ? 'yes' : 'no'} onChange={e => setEditForm(f => ({ ...f, recurring: e.target.value === 'yes' }))} style={inputStyle}>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Billing Interval</label>
                      <input type="text" value={editForm.billingInterval} onChange={e => setEditForm(f => ({ ...f, billingInterval: e.target.value }))} style={inputStyle} placeholder="e.g., Monthly, Annual" />
                    </div>
                    <div>
                      <label style={labelStyle}>Interval Amount</label>
                      <input type="number" step="0.01" value={editForm.intervalAmount} onChange={e => setEditForm(f => ({ ...f, intervalAmount: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Expiration Date</label>
                    <input type="date" value={editForm.expirationDate} onChange={e => setEditForm(f => ({ ...f, expirationDate: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Cancellation Terms</label>
                    <textarea
                      value={editForm.cancellationTerms}
                      onChange={e => setEditForm(f => ({ ...f, cancellationTerms: e.target.value }))}
                      style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                      placeholder="Enter cancellation terms or notice period..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <DetailRow icon={Calendar} label="Estimate Date" value={formatDate(localDoc.estimateDate)} />
                  <DetailRow icon={Building2} label="Supplier Name" value={localDoc.supplierName} />
                  <DetailRow icon={Tag} label="Service Category" value={localDoc.serviceCategory} />
                  <div style={{
                    padding: 14, borderRadius: 'var(--radius)', background: 'var(--warm-white)', border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <DollarSign size={14} color="var(--amber)" />
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Total Price</span>
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'Playfair Display, serif' }}>
                      {formatCurrency(localDoc.totalPrice) || '—'}
                    </p>
                  </div>
                  <DetailRow icon={Repeat} label="Recurring" value={localDoc.recurring === 1 ? 'Yes' : 'No'} />
                  <DetailRow icon={Calendar} label="Billing Interval" value={localDoc.billingInterval || '—'} />
                  <DetailRow icon={DollarSign} label="Interval Amount" value={formatCurrency(localDoc.intervalAmount)} />
                  <DetailRow icon={Calendar} label="Expiration Date" value={formatDate(localDoc.expirationDate)} />
                  <DetailRow icon={AlertCircle} label="Cancellation Terms" value={localDoc.cancellationTerms} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 'var(--radius)',
      background: 'transparent',
      border: '1px solid transparent'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <Icon size={14} color="var(--amber)" />
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--charcoal)' }}>
        {value || '—'}
      </p>
    </div>
  );
}
