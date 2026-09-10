import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Plus, Coins } from 'lucide-react';
import { TransactionType } from '../../types';
import { getCategoryColor, formatCurrency } from './financeConstants';

interface OutflowBreakdownCardProps {
  selectedMonth: string;
  selectedYear: number;
  totalDebit: number;
  pieData: { name: string; value: number }[];
  onOpenAddModal: (type?: TransactionType) => void;
}

export default function OutflowBreakdownCard({
  selectedMonth,
  selectedYear,
  totalDebit,
  pieData,
  onOpenAddModal
}: OutflowBreakdownCardProps) {
  const isAll = selectedMonth === 'All';
  const periodTitle = isAll ? `${selectedYear} Outflows` : `${selectedMonth} ${selectedYear} Outflows`;

  return (
    <div className="glass-panel outflow-card-panel">
      <div className="outflow-header">
        <h3 className="outflow-title">
          {periodTitle}
        </h3>
        <p className="outflow-subtitle">
          Expenses categorized for selected period
        </p>
      </div>

      {pieData.length > 0 ? (
        <div className="outflow-body-wrapper">
          {/* Donut Chart with Centered Metric (No Overlapping Legend) */}
          <div className="outflow-donut-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      const pct = totalDebit > 0 
                        ? ((item.value / totalDebit) * 100).toFixed(1) 
                        : '0';
                      return (
                        <div className="outflow-tooltip">
                          <div className="outflow-tooltip-title">
                            <span className="outflow-cat-dot" style={{ background: payload[0].color }} />
                            <span>{item.name}</span>
                          </div>
                          <div className="outflow-tooltip-amount">
                            SAR {formatCurrency(item.value)}
                            <span className="outflow-tooltip-pct">
                              ({pct}%)
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Metric Inside Donut */}
            <div className="outflow-donut-center">
              <div className="outflow-donut-label">
                TOTAL
              </div>
              <div className="outflow-donut-val">
                SAR {totalDebit >= 10000 
                  ? `${(totalDebit / 1000).toFixed(1)}k` 
                  : totalDebit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Ranked Category Breakdown Details with Percentages & Bars */}
          <div className="outflow-category-list">
            {pieData.map((item, idx) => {
              const color = getCategoryColor(idx);
              const pct = totalDebit > 0 
                ? ((item.value / totalDebit) * 100).toFixed(1) 
                : '0';

              return (
                <div 
                  key={item.name}
                  className="outflow-category-item"
                >
                  <div className="outflow-cat-top-row">
                    <div className="outflow-cat-name-badge">
                      <span 
                        className="outflow-cat-dot" 
                        style={{ background: color, boxShadow: `0 0 8px ${color}66` }} 
                      />
                      <span>{item.name}</span>
                    </div>
                    <div className="outflow-cat-val-group">
                      <span className="outflow-cat-pct">
                        {pct}%
                      </span>
                      <span className="outflow-cat-amount">
                        SAR {formatCurrency(item.value)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Proportion Bar */}
                  <div className="outflow-bar-track">
                    <div 
                      className="outflow-bar-fill" 
                      style={{ width: `${pct}%`, background: color }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="outflow-empty-state">
          <div className="outflow-empty-icon">
            <Coins size={20} />
          </div>
          <div className="outflow-empty-title">No Outflow Entries</div>
          <p className="outflow-empty-desc">
            Zero debit expenses logged for {isAll ? selectedYear : `${selectedMonth} ${selectedYear}`}.
          </p>
        </div>
      )}

      {/* Quick Action in Card */}
      <div className="outflow-footer-action">
        <button 
          onClick={() => onOpenAddModal('Credit')}
          className="btn btn-secondary outflow-quick-btn"
        >
          <Plus size={14} /> Quick Add Transaction
        </button>
      </div>
    </div>
  );
}
