import React from 'react';
import { Plus, CheckSquare, RefreshCw, ClipboardList } from 'lucide-react';
import { Task, TaskStage } from '../types';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  stage: TaskStage;
  tasks: Task[];
  onAddTaskClick: (stage: TaskStage) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStageMove: (taskId: string, targetStage: TaskStage) => void;
}

export default function TaskColumn({
  stage,
  tasks,
  onAddTaskClick,
  onEditTask,
  onDeleteTask,
  onStageMove,
}: TaskColumnProps) {
  // Styling indicators based on Stage
  let headerColor = 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300';
  let badgeColor = 'bg-slate-200/80 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600';
  let dotColor = 'bg-slate-400';
  let stageTitleStr = 'Todo';
  let EmptyIcon = ClipboardList;

  if (stage === 'In Progress') {
    headerColor = 'bg-indigo-50 border-indigo-100 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-300';
    badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-850';
    dotColor = 'bg-indigo-600 dark:bg-indigo-400';
    stageTitleStr = 'In Progress (Active)';
    EmptyIcon = RefreshCw;
  } else if (stage === 'Done') {
    headerColor = 'bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-850';
    dotColor = 'bg-emerald-500';
    stageTitleStr = 'Done (Validated)';
    EmptyIcon = CheckSquare;
  }

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 w-full font-sans min-h-[450px] transition-colors duration-200">
      {/* Column Header */}
      <div className={`flex justify-between items-center px-4 py-3 rounded-2xl border mb-5 ${headerColor}`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
          <span className="text-xs font-bold uppercase tracking-wider">{stageTitleStr}</span>
          <span className={`text-[11px] font-bold font-mono px-2 py-0.5 border rounded-full ${badgeColor}`}>
            {tasks.length}
          </span>
        </div>

        {/* Plus Insert Trigger */}
        <button
          onClick={() => onAddTaskClick(stage)}
          className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 transition-all cursor-pointer shadow-none hover:shadow-xs"
          title={`Draft Task in ${stage}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List container */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1.5">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStageMove={onStageMove}
            />
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl text-center">
            <EmptyIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Empty Stage</p>
            <button
              onClick={() => onAddTaskClick(stage)}
              className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              + Create task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
