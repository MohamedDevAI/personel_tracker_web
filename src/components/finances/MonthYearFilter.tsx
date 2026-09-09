import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES } from '../../services/expenseApi';

interface MonthYearFilterProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableYears: number[];
  monthlyTransactionCounts: Record<string, number>;
  totalTransactionsForYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function MonthYearFilter({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  availableYears,
  monthlyTransactionCounts,
  totalTransactionsForYear,
  onPrevMonth,
  onNextMonth
}: MonthYearFilterProps) {
  return (
    <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', border: '1px solid var(--border-focus)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
        
        {/* Year Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
            <Calendar size={16} color="#6366f1" />
            <span>YEAR:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.25)', padding: '3px 8px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <button 
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="btn-icon" 
              style={{ width: '28px', height: '28px' }}
              title="Previous Year"
            >
              <ChevronLeft size={16} />
            </button>
            
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                padding: '2px 6px',
                fontFamily: 'var(--font-display)'
              }}
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr} style={{ background: '#101522', color: '#fff' }}>
                  {yr}
                </option>
              ))}
            </select>

            <button 
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="btn-icon" 
              style={{ width: '28px', height: '28px' }}
              title="Next Year"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick jump to Current Month */}
          <button 
            onClick={() => { setSelectedYear(2026); setSelectedMonth('Mar'); }}
            className="btn btn-secondary" 
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            Jump to Mar 2026
          </button>
        </div>

        {/* Prev / Next Month Quick Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Browsing: <strong style={{ color: 'var(--text-primary)' }}>{selectedMonth === 'All' ? `Full Year ${selectedYear}` : `${selectedMonth} ${selectedYear}`}</strong>
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={onPrevMonth} 
              className="btn-icon" 
              style={{ width: '32px', height: '32px' }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={onNextMonth} 
              className="btn-icon" 
              style={{ width: '32px', height: '32px' }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 12-Month Strip + All Months Option */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(68px, 1fr))',
        gap: '6px',
        background: 'rgba(0,0,0,0.18)',
        padding: '8px',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* ALL Months Button */}
        <button
          onClick={() => setSelectedMonth('All')}
          style={{
            padding: '8px 4px',
            borderRadius: '8px',
            border: selectedMonth === 'All' ? '1px solid #6366f1' : '1px solid transparent',
            background: selectedMonth === 'All' ? 'var(--accent-gradient)' : 'transparent',
            color: selectedMonth === 'All' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: selectedMonth === 'All' ? 700 : 500,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: selectedMonth === 'All' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
          }}
        >
          <span>All Year</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>
            {totalTransactionsForYear} txs
          </span>
        </button>

        {/* Individual Month Buttons */}
        {MONTH_NAMES.map(month => {
          const isSelected = selectedMonth === month;
          const count = monthlyTransactionCounts[month] || 0;
          const hasData = count > 0;

          return (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              style={{
                padding: '8px 4px',
                borderRadius: '8px',
                border: isSelected 
                  ? '1px solid #10b981' 
                  : hasData ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                background: isSelected 
                  ? 'var(--emerald-gradient)' 
                  : hasData ? 'rgba(255,255,255,0.03)' : 'transparent',
                color: isSelected 
                  ? '#ffffff' 
                  : hasData ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
                position: 'relative'
              }}
            >
              <span>{month}</span>
              <span style={{ 
                fontSize: '0.65rem', 
                opacity: isSelected ? 0.95 : (hasData ? 0.85 : 0.4),
                fontWeight: hasData ? 600 : 400
              }}>
                {count} txs
              </span>

              {hasData && !isSelected && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '6px',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#10b981'
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
