import React, { useRef } from 'react';
import { X, Printer, FileText, Building2, DollarSign, Calendar, Tag, Repeat, AlertCircle } from 'lucide-react';

export default function CompareView({ docs, onClose, formatCurrency, formatDate }) {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  const fields = [
    { key: 'estimateDate', label: 'Estimate Date', format: formatDate, icon: Calendar },
    { key: 'supplierName', label: 'Supplier Name', format: v => v, icon: Building2 },
    { key: 'property', label: 'Property', format: v => v, icon: Building2 },
    { key: 'description', label: 'Description', format: v => v, icon: FileText },
    { key: 'keywords', label: 'Keywords', format: v => v, icon: Tag },
    { key: 'serviceCategory', label: 'Service Category', format: v => v, icon: Tag },
    { key: 'totalPrice', label: 'Total Price', format: formatCurrency, icon: DollarSign, highlight: true },
    { key: 'recurring', label: 'Recurring', format: v => v === 1 ? 'Yes' : 'No', icon: Repeat },
    { key: 'billingInterval', label: 'Billing Interval', format: v => v, icon: Calendar },
    { key: 'intervalAmount', label: 'Interval Amount', format: formatCurrency, icon: DollarSign },
    { key: 'expirationDate', label: 'Expiration Date', format: formatDate, icon: Calendar },
    { key: 'cancellationTerms', label: 'Cancellation Terms', format: v => v, icon: AlertCircle },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: 40, paddingBottom: 40, overflow: 'auto' }}>
      <div
        ref={printRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 'var(--radius)', maxWidth: 1400, width: '100%',
          animation: 'slideUp 0.3s ease', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{
          padding: '24px 32px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }} className="no-print">
          <h2 style={{ fontSize: 22 }}>Compare Documents ({docs.length})</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} style={{
              padding: '8px 16px', background: 'var(--charcoal)', color: 'white', border: 'none',
              borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <Printer size={16} />
              Print / Export PDF
            </button>
            <button onClick={onClose} style={{
              padding: '8px', background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', cursor: 'pointer'
            }}>
              <X size={20} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        <div style={{ padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{
                  padding: '16px 20px', textAlign: 'left', borderBottom: '2px solid var(--charcoal)',
                  fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: 'var(--text-muted)', background: 'var(--warm-white)', width: 200
                }}>Field</th>
                {docs.map(doc => (
                  <th key={doc.id} style={{
                    padding: '16px 20px', textAlign: 'left', borderBottom: '2px solid var(--charcoal)',
                    minWidth: 220, background: 'var(--warm-white)'
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{doc.originalName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doc.supplierName || 'Unknown'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field, rowIdx) => {
                const Icon = field.icon;
                return (
                  <tr key={field.key} style={{ background: rowIdx % 2 === 0 ? 'white' : 'var(--warm-white)' }}>
                    <td style={{
                      padding: '14px 20px', borderBottom: '1px solid var(--border)',
                      fontWeight: 600, color: 'var(--text-secondary)', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <Icon size={14} color="var(--amber)" />
                      {field.label}
                    </td>
                    {docs.map(doc => {
                      const val = doc[field.key];
                      const formatted = field.format(val);
                      return (
                        <td key={doc.id} style={{
                          padding: '14px 20px', borderBottom: '1px solid var(--border)',
                          fontWeight: field.highlight ? 700 : 400,
                          fontFamily: field.highlight ? 'Playfair Display, serif' : 'Source Sans 3, sans-serif',
                          color: 'var(--charcoal)', fontSize: field.highlight ? 16 : 14
                        }}>
                          {field.key === 'keywords' && val ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {val.split(',').map((k, i) => (
                                <span key={i} style={{
                                  fontSize: 11, padding: '2px 8px', borderRadius: 10,
                                  background: 'var(--cream)', color: 'var(--text-secondary)'
                                }}>{k.trim()}</span>
                              ))}
                            </div>
                          ) : field.key === 'description' ? (
                            <p style={{ lineHeight: 1.5, margin: 0 }}>{formatted || '—'}</p>
                          ) : (
                            formatted || '—'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }} className="no-print">
          Generated by Contract & Estimate Parser on {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
