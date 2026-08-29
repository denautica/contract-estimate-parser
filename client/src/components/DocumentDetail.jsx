import React from 'react';
import { X, FileText, Building2, DollarSign, Calendar, Tag, Repeat, AlertCircle, ExternalLink } from 'lucide-react';

export default function DocumentDetail({ doc, onClose, formatCurrency, formatDate }) {
  const fields = [
    { label: 'Estimate Date', value: formatDate(doc.estimateDate), icon: Calendar },
    { label: 'Supplier Name', value: doc.supplierName, icon: Building2 },
    { label: 'Property', value: doc.property, icon: Building2 },
    { label: 'Service Category', value: doc.serviceCategory, icon: Tag },
    { label: 'Total Price', value: formatCurrency(doc.totalPrice), icon: DollarSign, highlight: true },
    { label: 'Recurring', value: doc.recurring === 1 ? 'Yes' : 'No', icon: Repeat },
    { label: 'Billing Interval', value: doc.billingInterval || '—', icon: Calendar },
    { label: 'Interval Amount', value: formatCurrency(doc.intervalAmount), icon: DollarSign },
    { label: 'Expiration Date', value: formatDate(doc.expirationDate), icon: Calendar },
    { label: 'Cancellation Terms', value: doc.cancellationTerms, icon: AlertCircle },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 'var(--radius)', maxWidth: 700, width: '100%',
          maxHeight: '90vh', overflow: 'auto', padding: 0, animation: 'slideUp 0.3s ease',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{
          padding: '24px 32px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '2px 10px', borderRadius: 12,
                background: doc.property === 'Canyon View' ? '#e8f0e8' : doc.property === 'Rockpoint' ? '#e8e8f0' : doc.property === 'Boulder Canyon' ? '#f0e8e0' : '#f0f0f0',
                color: doc.property === 'Canyon View' ? '#2d5a2d' : doc.property === 'Rockpoint' ? '#3d3d5a' : doc.property === 'Boulder Canyon' ? '#5a3d2d' : '#5a5a5a'
              }}>{doc.property || 'Other'}</span>
              {doc.recurring === 1 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                  padding: '2px 10px', borderRadius: 12, background: 'var(--amber-light)', color: 'var(--charcoal)'
                }}>Recurring</span>
              )}
            </div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>{doc.originalName}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Uploaded {formatDate(doc.uploadedAt)}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}>
            <X size={24} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ padding: '24px 32px', flex: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>AI Description</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{doc.description || 'No description available'}</p>
          </div>

          {doc.keywords && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>Keywords</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {doc.keywords.split(',').map((k, i) => (
                  <span key={i} style={{
                    fontSize: 12, padding: '4px 10px', borderRadius: 12, background: 'var(--cream)',
                    color: 'var(--text-secondary)', fontWeight: 500
                  }}>{k.trim()}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {fields.map((field, i) => {
              const Icon = field.icon;
              return (
                <div key={i} style={{
                  padding: 14, borderRadius: 'var(--radius)', background: field.highlight ? 'var(--warm-white)' : 'transparent',
                  border: field.highlight ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon size={14} color="var(--amber)" />
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{field.label}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: field.highlight ? 700 : 500, color: 'var(--charcoal)', fontFamily: field.highlight ? 'Playfair Display, serif' : 'Source Sans 3, sans-serif' }}>
                    {field.value || '—'}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <a href={`/uploads/${doc.filename}`} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--amber)',
              textDecoration: 'none', fontWeight: 600
            }}>
              <ExternalLink size={14} />
              View Original File
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
