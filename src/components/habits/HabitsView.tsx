import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { getCurrentMonth, getCurrentYear } from '../../utils/dateHelpers';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import type { Habit } from '../../types';
import HabitsDateBuddy from './HabitsDateBuddy';
import HabitsKpiCards from './HabitsKpiCards';
import HabitsToolbar, { HabitStatusFilter, HabitViewMode } from './HabitsToolbar';
import HabitCard from './HabitCard';
import HabitMatrixSheet from './HabitMatrixSheet';
import HabitModal from './HabitModal';
import './habits.css';

export default function HabitsView() {
  const queryClient = useQueryClient();

  // Data Queries
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: api.getHabits,
  });

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: api.toggleHabit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const createMutation = useMutation({
    mutationFn: api.createHabit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteHabit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  // State: Date Buddy Filter
  const [selectedYear, setSelectedYear] = useState<number>(() => getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonth());

  // State: View & Filter
  const [viewMode, setViewMode] = useState<HabitViewMode>('sheet'); // Default to high-density Matrix Sheet!
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<HabitStatusFilter>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const deleteConfirm = useDeleteConfirmation<string>();

  // Jump to Today
  const handleJumpToday = () => {
    setSelectedYear(getCurrentYear());
    setSelectedMonth(getCurrentMonth());
  };

  // Filtering
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = h.title.toLowerCase().includes(q);
        const matchesCat = (h.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && h.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'PENDING') return !h.completedToday;
      if (statusFilter === 'COMPLETED') return h.completedToday;
      if (statusFilter === 'HOT_STREAK') return h.streak >= 5;

      return true;
    });
  }, [habits, searchQuery, selectedCategory, statusFilter]);

  // Handlers
  const handleToggle = (id: string, isDone: boolean) => {
    toggleMutation.mutate(id);
    if (!isDone) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.65 } });
    }
  };

  const handleBulkCheckIn = () => {
    const pendingHabits = filteredHabits.filter((h) => !h.completedToday);
    pendingHabits.forEach((h) => {
      toggleMutation.mutate(h.id);
    });
    if (pendingHabits.length > 0) {
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
    }
  };

  const handleCreate = (data: { title: string; category: string; targetFrequency: string }) => {
    createMutation.mutate(data);
  };

  const handleDeleteConfirm = () => {
    deleteConfirm.execute((id) => deleteMutation.mutate(id));
  };

  return (
    <div className="habits-view-container">
      {/* 1. Date Buddy Bar */}
      <HabitsDateBuddy
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onJumpToday={handleJumpToday}
      />

      {/* 2. KPI Cards Header */}
      <HabitsKpiCards habits={habits} />

      {/* 3. Toolbar & Filters & View Switcher */}
      <HabitsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAddModal={() => setShowAddModal(true)}
      />

      {/* 4. Content Views (Matrix Sheet vs Cards Grid) */}
      {filteredHabits.length > 0 ? (
        viewMode === 'sheet' ? (
          <HabitMatrixSheet
            habits={filteredHabits}
            onToggle={handleToggle}
            onDelete={(id) => deleteConfirm.confirm(id, 'Habit Routine')}
            onBulkCheckIn={handleBulkCheckIn}
          />
        ) : (
          <div className="habits-cards-grid">
            {filteredHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggle}
                onDelete={(id) => deleteConfirm.confirm(id, habit.title)}
              />
            ))}
          </div>
        )
      ) : (
        <div className="habits-empty-state">
          <div className="habits-empty-icon">
            <Flame size={28} />
          </div>
          <h3 className="habits-empty-title">No Habit Routines Found</h3>
          <p className="habits-empty-sub">
            {searchQuery || statusFilter !== 'ALL' || selectedCategory !== 'ALL'
              ? 'No habit routines match your active filter parameters. Try clearing your filters or search term.'
              : 'You have not built any habit routines yet. Start by creating your first daily consistency routine.'}
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ marginTop: 8 }}>
            <Plus size={16} /> Create First Habit
          </button>
        </div>
      )}

      {/* Modal: Add Habit */}
      <HabitModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreate}
      />

      {/* Modal: Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Habit Routine"
        message={`Are you sure you want to delete "${deleteConfirm.itemName}"? Historical streak data for this habit will be removed.`}
        onConfirm={handleDeleteConfirm}
        onCancel={deleteConfirm.cancel}
      />
    </div>
  );
}
