import React from 'react';
import { Trash2 } from 'lucide-react';
import { Category } from '../../types';

interface CategoryTableProps {
  categories: Category[];
  onDeleteCategory: (id: string) => void;
}

export default function CategoryTable({
  categories,
  onDeleteCategory
}: CategoryTableProps) {
  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <th style={{ padding: '14px 20px' }}>CATEGORY NAME</th>
            <th style={{ padding: '14px 20px' }}>TYPE</th>
            <th style={{ padding: '14px 20px', textAlign: 'center' }}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id || cat._id} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
              <td style={{ padding: '14px 20px', fontWeight: 600 }}>{cat.name}</td>
              <td style={{ padding: '14px 20px' }}>
                <span className={String(cat.type).toUpperCase() === 'CREDIT' ? 'badge badge-emerald' : 'badge badge-rose'}>
                  {cat.type}
                </span>
              </td>
              <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                <button
                  onClick={() => (cat.id || cat._id) && onDeleteCategory((cat.id || cat._id)!)}
                  className="btn-icon" 
                  style={{ margin: '0 auto', width: '30px', height: '30px', color: '#f43f5e' }}
                  title="Delete category"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
