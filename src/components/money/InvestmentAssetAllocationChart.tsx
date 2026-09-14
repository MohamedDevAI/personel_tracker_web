import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, Info } from 'lucide-react';
import type { InvestmentHolding } from '../../types';
import { formatINR, formatINRCompact, formatPercent } from '../../utils/formatters';

interface InvestmentAssetAllocationChartProps {
  holdings: InvestmentHolding[];
  cashLiquidity?: number;
  includeCash?: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  Stocks: { label: 'Stocks (Equities)', color: '#6366f1' },
  'Mutual Funds': { label: 'SIPs & Mutual Funds', color: '#10b981' },
  SIPs: { label: 'SIPs & Mutual Funds', color: '#10b981' },
  Bonds: { label: 'Bonds & G-Secs', color: '#06b6d4' },
  FDs: { label: 'Fixed Deposits (FD)', color: '#fbbf24' },
  Cash: { label: 'Liquid Cash', color: '#38bdf8' },
};

export default function InvestmentAssetAllocationChart({
  holdings,
  cashLiquidity = 0,
  includeCash = false,
}: InvestmentAssetAllocationChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Group holdings into the 4 primary categories
  const stocksVal = holdings
    .filter((h) => h.category === 'Stocks')
    .reduce((s, h) => s + h.currentPrice * h.quantity, 0);

  const sipsVal = holdings
    .filter((h) => h.category === 'Mutual Funds' || h.category === 'SIPs')
    .reduce((s, h) => s + h.currentPrice * h.quantity, 0);

  const bondsVal = holdings
    .filter((h) => h.category === 'Bonds')
    .reduce((s, h) => s + h.currentPrice * h.quantity, 0);

  const fdsVal = holdings
    .filter((h) => h.category === 'FDs')
    .reduce((s, h) => s + h.currentPrice * h.quantity, 0);

  const pieData = [
    { name: 'Stocks (Equities)', key: 'Stocks', value: stocksVal, color: '#6366f1' },
    { name: 'SIPs & Mutual Funds', key: 'Mutual Funds', value: sipsVal, color: '#10b981' },
    { name: 'Bonds', key: 'Bonds', value: bondsVal, color: '#06b6d4' },
    { name: 'Fixed Deposits (FD)', key: 'FDs', value: fdsVal, color: '#fbbf24' },
  ];

  if (includeCash && cashLiquidity > 0) {
    pieData.push({
      name: 'Liquid Cash',
      key: 'Cash',
      value: cashLiquidity,
      color: '#38bdf8',
    });
  }

  const validData = pieData.filter((d) => d.value > 0);
  const totalValue = validData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="vis-card">
      <div className="vis-header">
        <div>
          <div className="vis-title">
            <PieIcon size={18} color="#10b981" />
            <span>Asset Class Allocation</span>
          </div>
          <div className="vis-subtitle">
            Capital distribution across FD, Bonds, Stocks & SIPs
          </div>
        </div>
        <span className="badge badge-emerald">
          {validData.length} Asset Classes
        </span>
      </div>

      <div className="allocation-body">
        {/* Donut Chart */}
        <div className="donut-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={validData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {validData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const pct = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                    return (
                      <div className="money-custom-tooltip">
                        <div className="tooltip-title" style={{ color: item.color }}>
                          {item.name}
                        </div>
                        <div className="tooltip-item" style={{ fontWeight: 700, color: '#fff' }}>
                          {formatINR(item.value)}
                        </div>
                        <div className="tooltip-item">
                          {formatPercent(pct, 1)} of total assets
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total Display */}
          <div className="donut-center-metric">
            <span className="donut-center-label">Total Portfolio</span>
            <div className="donut-center-val">
              {formatINRCompact(totalValue)}
            </div>
          </div>
        </div>

        {/* Legend List */}
        <div className="allocation-legend-list">
          {validData.map((item, index) => {
            const pct = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
            const isHovered = activeIndex === index;
            return (
              <div
                key={item.name}
                className="legend-item-row"
                style={{
                  borderColor: isHovered ? item.color : undefined,
                  background: isHovered ? 'rgba(255, 255, 255, 0.06)' : undefined,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    className="legend-color-dot"
                    style={{ backgroundColor: item.color }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#fff' }}>
                    {formatINRCompact(item.value)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {formatPercent(pct, 1)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
