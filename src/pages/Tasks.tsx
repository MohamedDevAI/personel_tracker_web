import React from 'react';
import TasksView from '../components/life_os/tasks/TasksView';

export default function Tasks() {
  return (
    <div className="page-container" style={{ padding: 0, maxWidth: '100%' }}>
      <TasksView />
    </div>
  );
}
