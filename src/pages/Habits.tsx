import React from 'react';
import HabitsView from '../components/habits/HabitsView';

export default function Habits() {
  return (
    <div className="page-container" style={{ padding: 0, maxWidth: '100%' }}>
      <HabitsView />
    </div>
  );
}
