import { Sparkles } from 'lucide-react';
import './habits.css';

export default function HabitsView() {
  return (
    <div className="habits-container">
      <div className="habits-clean-slate">
        <div className="habits-clean-slate-icon">
          <Sparkles size={32} />
        </div>
        <h2 className="habits-clean-slate-title">Habit Tracker Ready</h2>
        <p className="habits-clean-slate-desc">
          The previous habit tracker has been completely removed.
          Describe the first feature you want to build, and we will implement it step by step.
        </p>
      </div>
    </div>
  );
}
