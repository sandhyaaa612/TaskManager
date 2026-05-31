import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, TaskStage, TaskPriority } from '../types';

interface TaskDialogProps {
  isOpen: boolean;
  taskToEdit?: Task | null; // If provided, we are editing, otherwise creating
  defaultStage?: TaskStage;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description: string;
    stage: TaskStage;
    priority: TaskPriority;
    dueDate?: string;
  }) => Promise<void>;
}

export default function TaskDialog({
  isOpen,
  taskToEdit,
  defaultStage = 'Todo',
  onClose,
  onSave,
}: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<TaskStage>('Todo');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setStage(taskToEdit.stage);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate || '');
    } else {
      // Create mode
      setTitle('');
      setDescription('');
      setStage(defaultStage);
      setPriority('Medium');
      setDueDate('');
    }
    setErrorMsg(null);
  }, [taskToEdit, defaultStage, isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Task Title is required');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        description: description.trim(),
        stage,
        priority,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!taskToEdit;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
          {/* Backdrop layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          ></motion.div>

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 max-w-lg w-full overflow-hidden z-10 relative flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {isEdit ? 'Edit Task Specifications' : 'Draft New Workspace Task'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Review code architecture..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-slate-950 dark:text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Description Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                  Detailed Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide context, links, or expectations for this workflow task item."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-slate-950 dark:text-slate-100 text-sm focus:outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Grid: Stage, Priority, Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stage Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                    Orchestrated Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as TaskStage)}
                    className="w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-250 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  >
                    <option value="Todo" className="dark:bg-slate-900">Todo (Backlog)</option>
                    <option value="In Progress" className="dark:bg-slate-900">In Progress (Active)</option>
                    <option value="Done" className="dark:bg-slate-900">Done (Validated)</option>
                  </select>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                    Priority Factor
                  </label>
                  <div className="flex gap-2">
                    {(['Low', 'Medium', 'High'] as TaskPriority[]).map((p) => {
                      // Determine border of selection
                      const isSelected = priority === p;
                      let selectColor = 'btn-secondary text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900';
                      
                      if (isSelected) {
                        if (p === 'Low') selectColor = 'bg-slate-100 border-slate-400 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 font-semibold shadow-xs';
                        if (p === 'Medium') selectColor = 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/20 dark:border-amber-80 *0 dark:text-amber-400 dark:border-amber-900/40 font-semibold shadow-xs';
                        if (p === 'High') selectColor = 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/20 dark:border-rose-850 dark:text-rose-400 dark:border-rose-900/40 font-semibold shadow-xs';
                      }

                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`flex-1 py-1.5 text-xs border rounded-xl transition-all cursor-pointer ${selectColor}`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Due Date Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                  Completion Deadline
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-slate-800 dark:text-slate-250 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Display Validation Error */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer hover:shadow-lg hover:shadow-indigo-600/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>{isEdit ? 'Update Task' : 'Produce Task'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
