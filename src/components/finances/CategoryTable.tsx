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
    <div className="glass-panel finance-card-fixed-90vh">
      <div className="finance-table-scroll">
        <table className="finance-table">
          <thead>
            <tr>
              <th>CATEGORY NAME</th>
              <th>TYPE</th>
              <th className="th-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id || cat._id} className="table-row-hover">
                <td className="cat-name-cell">{cat.name}</td>
                <td>
                  <span className={String(cat.type).toUpperCase() === 'CREDIT' ? 'badge badge-emerald' : 'badge badge-rose'}>
                    {cat.type}
                  </span>
                </td>
                <td className="tx-delete-action">
                  <button
                    onClick={() => (cat.id || cat._id) && onDeleteCategory((cat.id || cat._id)!)}
                    className="btn-icon tx-delete-btn" 
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
    </div>
  );
}
