import React from 'react';
import GoalsView from '../components/goals/GoalsView';

export default function Goals() {
  return (
    <div className="page-container" style={{ padding: 0, maxWidth: '100%' }}>
      <GoalsView />
    </div>
  );
}
