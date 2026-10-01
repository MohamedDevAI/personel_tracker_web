import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../../services/api';
import { getCurrentMonth, getCurrentYear } from '../../../utils/dateHelpers';
import { useDeleteConfirmation } from '../../../hooks/useDeleteConfirmation';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';
import HabitsDateBuddy from './HabitsDateBuddy';
import HabitsKpiCards from './HabitsKpiCards';
import HabitsToolbar, { HabitStatusFilter, HabitViewMode } from './HabitsToolbar';
import TodayFocusBar from './TodayFocusBar';
import StreaksRingView from './StreaksRingView';
import HabitCard from './HabitCard';
import HabitMatrixSheet from './HabitMatrixSheet';
import HabitModal from './HabitModal';
import { useHabitsQuery } from '../../../hooks';
import { playHabitChime } from './habitHelpers';
import './habits.css';

export default function HabitsView() {
  const queryClient = useQueryClient();

  // Data Queries
  const { data: habits = [] } = useHabitsQuery();

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

  // State: View & Filter (Default to iconic iPhone 'streaks' circular rings mode!)
  const [viewMode, setViewMode] = useState<HabitViewMode>('streaks');
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

  // Status Counts
  const pendingCount = useMemo(() => habits.filter((h) => !h.completedToday).length, [habits]);
  const completedCount = useMemo(() => habits.filter((h) => h.completedToday).length, [habits]);

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

  // Handlers with Dopamine Audio & Confetti
  const handleToggle = (id: string, currentlyDone: boolean) => {
    const isNowDone = !currentlyDone;
    toggleMutation.mutate(id);

    // Play synthesized dopamine sound chime
    playHabitChime(isNowDone);

    if (isNowDone) {
      // If this was the last remaining habit, trigger major victory fireworks!
      const remainingAfterThis = pendingCount - 1;
      if (remainingAfterThis <= 0 && habits.length > 0) {
        confetti({
          particleCount: 140,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#ff5500', '#ff7a00', '#ff9500', '#ffffff', '#fbbf24'],
        });
      } else {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#ff5500', '#ff7a00', '#ff9e42'],
        });
      }
    }
  };

  const handleBulkCheckIn = () => {
    const pendingHabits = filteredHabits.filter((h) => !h.completedToday);
    pendingHabits.forEach((h) => {
      toggleMutation.mutate(h.id);
    });

    if (pendingHabits.length > 0) {
      playHabitChime(true);
      confetti({
        particleCount: 160,
        spread: 130,
        origin: { y: 0.45 },
        colors: ['#ff5500', '#ff7a00', '#ff9500', '#ffffff', '#fbbf24'],
      });
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
      {/* 1. Toolbar & Filters & View Switcher (Top Command Line) */}
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
        pendingCount={pendingCount}
        completedCount={completedCount}
      />

      {/* 2. Date Buddy (Only displayed when exploring Matrix Sheet historical view) */}
      {viewMode === 'sheet' && (
        <HabitsDateBuddy
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          onJumpToday={handleJumpToday}
        />
      )}

      {/* 3. Primary Content View: Streaks iPhone Rings vs Matrix Sheet vs Cards */}
      {filteredHabits.length > 0 ? (
        viewMode === 'streaks' ? (
          <>
            <StreaksRingView
              habits={filteredHabits}
              onToggle={handleToggle}
              onDelete={(id) => deleteConfirm.confirm(id, 'Habit Routine')}
              onBulkCheckIn={handleBulkCheckIn}
              onOpenAddModal={() => setShowAddModal(true)}
            />
            {/* KPI Overview below the rings */}
            <HabitsKpiCards habits={habits} />
          </>
        ) : viewMode === 'sheet' ? (
          <>
            <HabitsKpiCards habits={habits} />
            <TodayFocusBar
              habits={habits}
              onToggle={handleToggle}
              onBulkCheckIn={handleBulkCheckIn}
            />
            <HabitMatrixSheet
              habits={filteredHabits}
              onToggle={handleToggle}
              onDelete={(id) => deleteConfirm.confirm(id, 'Habit Routine')}
              onBulkCheckIn={handleBulkCheckIn}
            />
          </>
        ) : (
          <>
            <HabitsKpiCards habits={habits} />
            <TodayFocusBar
              habits={habits}
              onToggle={handleToggle}
              onBulkCheckIn={handleBulkCheckIn}
            />
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
          </>
        )
      ) : (
        <div className="glass-panel habits-empty-state">
          <div className="habits-empty-icon">
            <Flame size={28} />
          </div>
          <h3 className="habits-empty-title">No Habit Routines Found</h3>
          <p className="habits-empty-sub">
            {searchQuery || statusFilter !== 'ALL' || selectedCategory !== 'ALL'
              ? 'No habit routines match your active filter parameters. Try clearing your search or status filters.'
              : 'You have not built any habit routines yet. Start creating your daily consistency rituals.'}
          </p>
          <button onClick={() => setShowAddModal(true)} className="streaks-btn-orange-solid" style={{ marginTop: 8 }}>
            <Plus size={16} /> Create First Routine
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
