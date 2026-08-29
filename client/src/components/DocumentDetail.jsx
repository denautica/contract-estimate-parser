import React, { useState, useEffect } from 'react';
import { X, FileText, Building2, DollarSign, Calendar, Tag, Repeat, AlertCircle, ExternalLink, Pencil, Save, XCircle, Eye } from 'lucide-react';

const API_URL = '/api';
const PROPS = ['Canyon View', 'Rockpoint', 'Boulder Canyon', 'Other'];

export default function DocumentDetail({ doc, onClose, formatCurrency, formatDate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localDoc, setLocalDoc] = useState(doc);
  const [editForm, setEditForm] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

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

  const viewFields = [
    { label: 'Estimate Date', value: formatDate(localDoc.estimateDate), icon: Calendar },
    { label: 'Supplier Name', value: localDoc.supplierName, icon: Building2 },
    { label: 'Property', value: localDoc.property, icon: Building2 },
    { label: 'Service Category', value: localDoc.serviceCategory, icon: Tag },
    { label: 'Total Price', value: formatCurrency(localDoc.totalPrice), icon: DollarSign, highlight: true },
    { label: 'Recurring', value: localDoc.recurring === 1 ? 'Yes' : 'No', icon: Repeat },
    { label: 'Billing Interval', value: localDoc.billingInterval || '—', icon: Calendar },
    { label: 'Interval Amount', value: formatCurrency(localDoc.intervalAmount), icon: DollarSign },
    { label: 'Expiration Date', value: formatDate(localDoc.expirationDate), icon: Calendar },
    { label: 'Cancellation Terms', value: localDoc.cancellationTerms, icon: AlertCircle },
  ];

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontFamily: 'Source Sans 3, sans-serif',
    background: 'white'
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
          maxWidth: 900,
          width: '100%',
          maxHeight: '95vh',
          overflow: 'auto',
          padding: 0,
          animation: 'slideUp 0.3s ease',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
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
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>{localDoc.originalName}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Uploaded {formatDate(localDoc.uploadedAt)}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="no-print">
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
          <div style={{ padding: '12px 32px', background: '#fff0f0', color: 'var(--danger)', fontSize: 14, borderBottom: '1px solid var(--border)' }}>
            {error}
          </div>
        )}

        <div style={{ padding: '24px 32px', flex: 1 }}>
          <div style={{ marginBottom: 20 }} className="no-print">
            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{
                padding: '8px 14px', background: 'var(--warm-white)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, color: 'var(--charcoal)'
              }}
            >
              <Eye size={14} />
              {showPreview ? 'Hide Document Preview' : 'Show Document Preview'}
            </button>
          </div>

          {showPreview && (
            <div style={{
              marginBottom: 24,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              background: 'var(--warm-white)',
              minHeight: 400
            }}>
              {isPdf ? (
                <iframe
                  src={fileUrl}
                  style={{ width: '100%', height: 500, border: 'none' }}
                  title="Document Preview"
                />
              ) : isImage ? (
                <img
                  src={fileUrl}
                  alt="Document Preview"
                  style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
                />
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p>Preview not available for this file type</p>
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>AI Description</h3>
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              />
            ) : (
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{localDoc.description || 'No description available'}</p>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>Keywords</h3>
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
              ) : <p style={{ color: 'var(--text-muted)' }}>No keywords</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {isEditing ? (
              <>
                <div>
                  <label style={labelStyle}>Estimate Date</label>
                  <input type="date" value={editForm.estimateDate} onChange={e => setEditForm(f => ({ ...f, estimateDate: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Supplier Name</label>
                  <input type="text" value={editForm.supplierName} onChange={e => setEditForm(f => ({ ...f, supplierName: e.target.value }))} style={inputStyle} />
                </div>
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
                <div>
                  <label style={labelStyle}>Billing Interval</label>
                  <input type="text" value={editForm.billingInterval} onChange={e => setEditForm(f => ({ ...f, billingInterval: e.target.value }))} style={inputStyle} placeholder="e.g., Monthly, Annual" />
                </div>
                <div>
                  <label style={labelStyle}>Interval Amount</label>
                  <input type="number" step="0.01" value={editForm.intervalAmount} onChange={e => setEditForm(f => ({ ...f, intervalAmount: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Expiration Date</label>
                  <input type="date" value={editForm.expirationDate} onChange={e => setEditForm(f => ({ ...f, expirationDate: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
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
              viewFields.map((field, i) => {
                const Icon = field.icon;
                return (
                  <div key={i} style={{
                    padding: 14, borderRadius: 'var(--radius)',
                    background: field.highlight ? 'var(--warm-white)' : 'transparent',
                    border: field.highlight ? '1px solid var(--border)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Icon size={14} color="var(--amber)" />
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{field.label}</span>
                    </div>
                    <p style={{
                      fontSize: 15, fontWeight: field.highlight ? 700 : 500,
                      color: 'var(--charcoal)',
                      fontFamily: field.highlight ? 'Playfair Display, serif' : 'Source Sans 3, sans-serif'
                    }}>
                      {field.value || '—'}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--amber)',
              textDecoration: 'none', fontWeight: 600
            }}>
              <ExternalLink size={14} />
              Open Original File in New Tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
