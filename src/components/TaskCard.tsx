import React from 'react';
import { Calendar, Trash2, Edit2, ArrowLeft, ArrowRight, AlertCircle, Check, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { Task, TaskStage, TaskPriority } from '../types';

interface TaskCardProps {
  key?: string;
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStageMove: (taskId: string, targetStage: TaskStage) => void;
}

export default function TaskCard({ task, onEdit, onDelete, onStageMove }: TaskCardProps) {
  // Determine Priority Color styling
  let priorityTag = 'bg-slate-100 text-slate-800 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/50';
  if (task.priority === 'Medium') {
    priorityTag = 'bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/35';
  } else if (task.priority === 'High') {
    priorityTag = 'bg-rose-50 text-rose-800 border-rose-200/60 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/35';
  }

  // Calculate if overdue (only if task is not already done)
  let isOverdue = false;
  if (task.dueDate && task.stage !== 'Done') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    isOverdue = due < today;
  }

  // Format creation and updating human format
  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', duration: 0.25 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-5 shadow-xs hover:shadow-md transition-all group relative flex flex-col justify-between font-sans"
    >
      {/* Upper Section */}
      <div>
        <div className="flex justify-between items-start mb-3">
          {/* Priority indicator */}
          <span className={`px-2.5 py-0.5 text-[10px] font-bold border rounded-full uppercase tracking-wider ${priorityTag}`}>
            {task.priority} Priority
          </span>

          {/* Quick Actions */}
          <div className="flex gap-1.5 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Edit Task Specs"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Task title and narrative */}
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-1.5 break-words">
          {task.title}
        </h4>
        
        {task.description ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words mb-4 line-clamp-3">
            {task.description}
          </p>
        ) : (
          <div className="h-2"></div>
        )}
      </div>

      {/* Footer Section */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3">
        {/* Due Date Indicator */}
        {formattedDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`} />
            <span className={`text-[11px] font-medium font-mono ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
              {formattedDate} {isOverdue && '(Overdue)'}
            </span>
            {isOverdue && (
              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
            )}
          </div>
        )}

        {/* Explicit Action Stage Flow Buttons */}
        <div className="flex gap-2">
          {task.stage === 'Todo' && (
            <button
              onClick={() => onStageMove(task.id, 'In Progress')}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Move to In Progress</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {task.stage === 'In Progress' && (
            <>
              {/* Back to Todo */}
              <button
                onClick={() => onStageMove(task.id, 'Todo')}
                className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs transition-all cursor-pointer"
                title="Move back to Todo"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              
              {/* Mark as Done */}
              <button
                onClick={() => onStageMove(task.id, 'Done')}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Mark as Done</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {task.stage === 'Done' && (
            <>
              {/* Validated Indicator */}
              <div className="flex-1 py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 select-none text-[11px]">
                <Check className="w-3.5 h-3.5" />
                <span>Task Completed</span>
              </div>

              {/* RotateCcw Reopen */}
              <button
                onClick={() => onStageMove(task.id, 'In Progress')}
                className="py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs transition-all cursor-pointer"
                title="Reopen: Move to In Progress"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
