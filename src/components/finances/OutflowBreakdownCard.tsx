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
    <div className="glass-panel" style={{ padding: '22px' }}>
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
          {periodTitle}
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Expenses categorized for selected period
        </p>
      </div>

      {pieData.length > 0 ? (
        <div>
          {/* Donut Chart with Centered Metric (No Overlapping Legend) */}
          <div style={{ position: 'relative', height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
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
                        <div style={{
                          background: 'rgba(16, 21, 34, 0.95)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                          fontSize: '0.82rem',
                          color: '#fff'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: payload[0].color }} />
                            <span>{item.name}</span>
                          </div>
                          <div style={{ fontWeight: 700, marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                            SAR {formatCurrency(item.value)}
                            <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '0.75rem', fontWeight: 500 }}>
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
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                TOTAL
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginTop: '1px' }}>
                SAR {totalDebit >= 10000 
                  ? `${(totalDebit / 1000).toFixed(1)}k` 
                  : totalDebit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Ranked Category Breakdown Details with Percentages & Bars */}
          <div style={{
            marginTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '340px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {pieData.map((item, idx) => {
              const color = getCategoryColor(idx);
              const pct = totalDebit > 0 
                ? ((item.value / totalDebit) * 100).toFixed(1) 
                : '0';

              return (
                <div 
                  key={item.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'var(--transition-smooth)'
                  }}
                  className="table-row-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 8px ${color}66`,
                        flexShrink: 0
                      }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {pct}%
                      </span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                        SAR {formatCurrency(item.value)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Proportion Bar */}
                  <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Coins size={20} />
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No Outflow Entries</div>
          <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>
            Zero debit expenses logged for {isAll ? selectedYear : `${selectedMonth} ${selectedYear}`}.
          </p>
        </div>
      )}

      {/* Quick Action in Card */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <button 
          onClick={() => onOpenAddModal('Credit')}
          className="btn btn-secondary" 
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}
        >
          <Plus size={14} /> Quick Add Transaction
        </button>
      </div>
    </div>
  );
}
