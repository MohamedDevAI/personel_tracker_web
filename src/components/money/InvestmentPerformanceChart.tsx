import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, BarChart3, LineChart } from 'lucide-react';
import type { InvestmentHolding } from '../../types';
import { formatINR, formatINRCompact, formatPercent } from '../../utils/formatters';

interface InvestmentPerformanceChartProps {
  holdings: InvestmentHolding[];
}

export default function InvestmentPerformanceChart({
  holdings
}: InvestmentPerformanceChartProps) {
  const [viewMode, setViewMode] = useState<'trend' | 'bar'>('trend');

  // Compute 90-day historical trend based on holdings priceHistory
  // If price history is available, aggregate daily total portfolio value
  const historyLength = Math.max(
    ...holdings.map((h) => h.priceHistory?.length || 0),
    0
  );

  const totalInvested = holdings.reduce(
    (sum, h) => sum + h.buyPrice * h.quantity,
    0
  );

  // Generate historical curve
  const trendData = [];
  const points = Math.min(historyLength > 0 ? historyLength : 30, 30);

  for (let i = 0; i < points; i++) {
    // sample evenly across the history
    let dayValue = 0;
    for (const h of holdings) {
      if (h.priceHistory && h.priceHistory.length > 0) {
        const histIndex = Math.floor(
          (i / (points - 1)) * (h.priceHistory.length - 1)
        );
        dayValue += (h.priceHistory[histIndex] || h.currentPrice) * h.quantity;
      } else {
        // Fallback smooth trend
        const progress = i / (points - 1);
        const interpolated =
          h.buyPrice * h.quantity +
          (h.currentPrice * h.quantity - h.buyPrice * h.quantity) * progress;
        dayValue += interpolated;
      }
    }

    const dayLabel = i === points - 1 ? 'Today' : `D-${points - 1 - i}`;
    trendData.push({
      day: dayLabel,
      invested: Math.round(totalInvested),
      currentValue: Math.round(dayValue),
      gain: Math.round(dayValue - totalInvested)
    });
  }

  // Category comparison bar data
  const categories = [
    { label: 'Stocks', match: ['Stocks'], color: '#6366f1' },
    { label: 'SIPs & MFs', match: ['Mutual Funds', 'SIPs'], color: '#10b981' },
    { label: 'Bonds', match: ['Bonds'], color: '#06b6d4' },
    { label: 'FDs', match: ['FDs'], color: '#fbbf24' }
  ];

  const barData = categories.map((cat) => {
    const matching = holdings.filter((h) => cat.match.includes(h.category));
    const invested = matching.reduce((s, h) => s + h.buyPrice * h.quantity, 0);
    const currentValue = matching.reduce((s, h) => s + h.currentPrice * h.quantity, 0);
    return {
      category: cat.label,
      Invested: Math.round(invested),
      Current: Math.round(currentValue),
      returnPct: invested > 0 ? ((currentValue - invested) / invested) * 100 : 0
    };
  });

  return (
    <div className="vis-card">
      <div className="vis-header">
        <div>
          <div className="vis-title">
            <TrendingUp size={18} color="#34d399" />
            <span>Investment Performance & Growth</span>
          </div>
          <div className="vis-subtitle">
            {viewMode === 'trend'
              ? 'Portfolio value trajectory vs capital invested'
              : 'Invested capital vs current value per asset class'}
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255, 255, 255, 0.04)', padding: 3, borderRadius: 10 }}>
          <button
            onClick={() => setViewMode('trend')}
            className={`btn-glass ${viewMode === 'trend' ? 'active' : ''}`}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: 8,
              background: viewMode === 'trend' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: viewMode === 'trend' ? '#34d399' : 'var(--text-secondary)',
              border: viewMode === 'trend' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <LineChart size={13} />
            <span>Growth Curve</span>
          </button>

          <button
            onClick={() => setViewMode('bar')}
            className={`btn-glass ${viewMode === 'bar' ? 'active' : ''}`}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: 8,
              background: viewMode === 'bar' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: viewMode === 'bar' ? '#34d399' : 'var(--text-secondary)',
              border: viewMode === 'bar' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <BarChart3 size={13} />
            <span>Asset Comparison</span>
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height: 260, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'trend' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="currentValGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(val) => formatINRCompact(val)}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const curr = payload.find((p) => p.dataKey === 'currentValue')?.value as number;
                    const inv = payload.find((p) => p.dataKey === 'invested')?.value as number;
                    const gain = curr - inv;
                    return (
                      <div className="money-custom-tooltip">
                        <div className="tooltip-title">{label}</div>
                        <div className="tooltip-item" style={{ color: '#34d399', fontWeight: 700 }}>
                          Current Value: {formatINR(curr || 0)}
                        </div>
                        <div className="tooltip-item" style={{ color: '#818cf8' }}>
                          Invested Basis: {formatINR(inv || 0)}
                        </div>
                        <div className="tooltip-item" style={{ color: gain >= 0 ? '#34d399' : '#fb7185' }}>
                          Net Gain: {gain >= 0 ? '+' : ''}
                          {formatINR(gain)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="currentValue"
                name="Current Portfolio Value"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#currentValGrad)"
              />
              <Area
                type="monotone"
                dataKey="invested"
                name="Invested Capital"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#investedGrad)"
              />
            </AreaChart>
          ) : (
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(val) => formatINRCompact(val)}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const inv = payload.find((p) => p.dataKey === 'Invested')?.value as number;
                    const cur = payload.find((p) => p.dataKey === 'Current')?.value as number;
                    const p = cur - inv;
                    return (
                      <div className="money-custom-tooltip">
                        <div className="tooltip-title">{label}</div>
                        <div className="tooltip-item" style={{ color: '#818cf8' }}>
                          Invested: {formatINR(inv || 0)}
                        </div>
                        <div className="tooltip-item" style={{ color: '#34d399', fontWeight: 700 }}>
                          Current Value: {formatINR(cur || 0)}
                        </div>
                        <div className="tooltip-item">
                          Return: {p >= 0 ? '+' : ''}
                          {formatINR(p)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '0.78rem', paddingTop: '8px' }}
                formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
              />
              <Bar dataKey="Invested" name="Invested Capital" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Current" name="Current Value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
