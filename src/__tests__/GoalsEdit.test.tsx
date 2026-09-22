import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GoalModal from '../components/life_os/goals/GoalModal';
import { api } from '../services/api';
import type { Goal } from '../types';

describe('Strategic Goals Editing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('pre-populates GoalModal with goal data when initialGoal is provided', () => {
    const existingGoal: Goal = {
      id: 'g-101',
      title: 'Acquire PMP Certification',
      category: 'Career',
      targetDate: '2026-12-31',
      progress: 45,
      targetValue: 100,
      currentValue: 45,
      unit: '%',
      status: 'IN_PROGRESS',
    };

    const handleClose = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <GoalModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialGoal={existingGoal}
      />
    );

    // Header should be in edit mode
    expect(screen.getByText('Edit Strategic Milestone')).toBeDefined();

    // Fields should reflect existingGoal
    const titleInput = screen.getByDisplayValue('Acquire PMP Certification') as HTMLInputElement;
    expect(titleInput).toBeDefined();

    // Submit button should read "Update Strategic Milestone"
    const submitBtn = screen.getByRole('button', { name: /Update Strategic Milestone/i });
    expect(submitBtn).toBeDefined();

    // Modifying title and submitting
    fireEvent.change(titleInput, { target: { value: 'Acquire PMP & PMI-ACP Certification' } });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'g-101',
        title: 'Acquire PMP & PMI-ACP Certification',
        category: 'Career',
      })
    );
  });

  it('updates a goal via api.updateGoal with local storage fallback', async () => {
    const initialGoals: Goal[] = [
      {
        id: '1',
        title: 'Save SAR 5,000',
        category: 'Financial',
        progress: 20,
        targetValue: 5000,
        currentValue: 1000,
        unit: 'SAR',
      },
    ];
    localStorage.setItem('pt_goals', JSON.stringify(initialGoals));

    const updatedGoal: Goal = {
      id: '1',
      title: 'Save SAR 10,000 Emergency Fund',
      category: 'Financial',
      progress: 50,
      targetValue: 10000,
      currentValue: 5000,
      unit: 'SAR',
    };

    const result = await api.updateGoal(updatedGoal);
    expect(result.title).toBe('Save SAR 10,000 Emergency Fund');
    expect(result.targetValue).toBe(10000);

    const stored = JSON.parse(localStorage.getItem('pt_goals') || '[]');
    expect(stored[0].title).toBe('Save SAR 10,000 Emergency Fund');
    expect(stored[0].progress).toBe(50);
  });
});
