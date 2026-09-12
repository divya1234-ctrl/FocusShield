import React from 'react';
import {
  CheckCircle2,
  Play,
  Clock,
  Flame,
  BookOpen,
  Code2,
  FileQuestion,
  Sparkles,
  ArrowRight,
  RotateCw
} from 'lucide-react';
import { StudyPlanTask } from '../../types';

interface AgentStudyPlanProps {
  tasks: StudyPlanTask[];
  currentTaskId: string;
  onSelectTask?: (taskId: string) => void;
  onAdvanceTask?: () => void;
}

export const AgentStudyPlan: React.FC<AgentStudyPlanProps> = ({
  tasks,
  currentTaskId,
  onSelectTask,
  onAdvanceTask
}) => {
  const getTaskIcon = (type: StudyPlanTask['type']) => {
    switch (type) {
      case 'concept':
        return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'code':
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'quiz':
        return <FileQuestion className="w-4 h-4 text-purple-400" />;
      case 'practice':
        return <Flame className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getDifficultyBadge = (diff: StudyPlanTask['difficulty']) => {
    switch (diff) {
      case 'beginner':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Easy
          </span>
        );
      case 'advanced':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Hard
          </span>
        );
      case 'intermediate':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Medium
          </span>
        );
    }
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = Math.round((completedCount / (tasks.length || 1)) * 100);

  return (
    <div
      id="agent-study-plan"
      className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
    >
      {/* Title & Progress */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Adaptive Study Plan</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              ({completedCount}/{tasks.length} Completed)
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Autonomous multi-step curriculum dynamically re-ordered based on mastery.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-indigo-400">
            {progressPercent}% Complete
          </span>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.map((task, idx) => {
          const isCurrent = task.status === 'current';
          const isCompleted = task.status === 'completed';

          return (
            <div
              key={task.id}
              onClick={() => onSelectTask && onSelectTask(task.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : isCompleted
                  ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 text-slate-400'
                  : 'bg-slate-950/60 border-slate-800/60 hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-2.5 min-w-0">
                  {/* Status icon */}
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center animate-pulse">
                        <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-600 flex items-center justify-center text-[9px] font-mono text-slate-400">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Task details */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span
                        className={`text-xs font-bold leading-snug ${
                          isCurrent
                            ? 'text-white'
                            : isCompleted
                            ? 'line-through text-slate-400'
                            : 'text-slate-200'
                        }`}
                      >
                        {task.stepNumber}. {task.title}
                      </span>

                      {task.isAdapted && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          <RotateCw className="w-2.5 h-2.5 animate-spin" /> Adapted
                        </span>
                      )}

                      {getDifficultyBadge(task.difficulty)}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                </div>

                {/* Right side metadata */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{task.estimatedMinutes}m</span>
                  </span>

                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      {onAdvanceTask && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={onAdvanceTask}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <span>Complete &amp; Advance Next Task</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
