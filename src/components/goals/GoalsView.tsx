import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import type { Goal } from '../../types';
import GoalsKpiCards from './GoalsKpiCards';
import GoalsToolbar, { GoalStatusFilter, GoalViewMode } from './GoalsToolbar';
import GoalCard from './GoalCard';
import GoalMatrixSheet from './GoalMatrixSheet';
import GoalModal from './GoalModal';
import './goals.css';

export default function GoalsView() {
  const queryClient = useQueryClient();

  // Data Queries
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: api.getGoals,
  });

  // Mutations
  const updateProgressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      api.updateGoalProgress(id, progress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const createMutation = useMutation({
    mutationFn: api.createGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatusFilter>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<GoalViewMode>('cards');

  const deleteConfirm = useDeleteConfirmation<string>();

  // Filtering
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = g.title.toLowerCase().includes(q);
        const matchesCat = (g.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && g.category !== selectedCategory) {
        return false;
      }

      // Status filter
      const isComplete = (g.progress || 0) >= 100;
      if (statusFilter === 'IN_PROGRESS') return !isComplete;
      if (statusFilter === 'ACHIEVED') return isComplete;
      if (statusFilter === 'UPCOMING') {
        if (isComplete || !g.targetDate) return false;
        const target = new Date(g.targetDate);
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return target >= now && target <= thirtyDaysLater;
      }

      return true;
    });
  }, [goals, searchQuery, selectedCategory, statusFilter]);

  // Handlers
  const handleUpdateProgress = (id: string, newProgress: number) => {
    updateProgressMutation.mutate({ id, progress: newProgress });
  };

  const handleCreateGoal = (goalData: Omit<Goal, 'id'>) => {
    createMutation.mutate(goalData);
  };

  const handleDeleteConfirm = () => {
    deleteConfirm.execute((id) => deleteMutation.mutate(id));
  };

  return (
    <div className="goals-view-container">
      {/* 1. KPI Summary Cards */}
      <GoalsKpiCards goals={goals} />

      {/* 2. Toolbar & Filters */}
      <GoalsToolbar
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

      {/* 3. Cards Grid or Matrix Sheet View */}
      {filteredGoals.length > 0 ? (
        viewMode === 'cards' ? (
          <div className="goals-cards-grid">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdateProgress={handleUpdateProgress}
                onDelete={(id) => deleteConfirm.confirm(id, goal.title)}
              />
            ))}
          </div>
        ) : (
          <GoalMatrixSheet
            goals={filteredGoals}
            onUpdateProgress={handleUpdateProgress}
            onDelete={(id) => deleteConfirm.confirm(id, 'Strategic Milestone')}
          />
        )
      ) : (
        <div className="goals-empty-state">
          <div className="goals-empty-icon">
            <Target size={28} />
          </div>
          <h3 className="habits-empty-title">No Strategic Milestones Found</h3>
          <p className="habits-empty-sub">
            {searchQuery || statusFilter !== 'ALL' || selectedCategory !== 'ALL'
              ? 'No strategic goals match your active filter parameters. Try clearing your filters or search term.'
              : 'You have not set any strategic milestones yet. Start by defining your high-leverage targets.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ marginTop: 8 }}
          >
            <Plus size={16} /> Create First Milestone
          </button>
        </div>
      )}

      {/* Modal: Add Goal */}
      <GoalModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateGoal}
      />

      {/* Modal: Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Strategic Milestone"
        message={`Are you sure you want to delete "${deleteConfirm.itemName}"? Tracked progress for this milestone will be removed.`}
        onConfirm={handleDeleteConfirm}
        onCancel={deleteConfirm.cancel}
      />
    </div>
  );
}
