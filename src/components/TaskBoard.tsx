import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Plus, FileText, ArrowUpDown } from 'lucide-react';
import { Task, TaskStage, TaskPriority } from '../types';
import TaskColumn from './TaskColumn';

interface TaskBoardProps {
  tasks: Task[];
  onAddTaskClick: (stage: TaskStage) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStageMove: (taskId: string, targetStage: TaskStage) => void;
}

type SortOption = 'newest' | 'oldest' | 'priority' | 'dueDate';

export default function TaskBoard({
  tasks,
  onAddTaskClick,
  onEditTask,
  onDeleteTask,
  onStageMove,
}: TaskBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [activeMobileStage, setActiveMobileStage] = useState<TaskStage>('Todo');

  // Priority numerical weighting for sorting
  const priorityWeight = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  // Filter and Sort in alignment
  const processedTasks = useMemo(() => {
    let list = [...tasks];

    // 1. Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // 2. Filter by Priority
    if (priorityFilter !== 'All') {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // 3. Sort tasks
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'priority') {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1; // Put tasks without due date at the bottom
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

    return list;
  }, [tasks, searchQuery, priorityFilter, sortBy]);

  // Distribute tasks across columns
  const todoTasks = useMemo(() => processedTasks.filter((t) => t.stage === 'Todo'), [processedTasks]);
  const inProgressTasks = useMemo(() => processedTasks.filter((t) => t.stage === 'In Progress'), [processedTasks]);
  const doneTasks = useMemo(() => processedTasks.filter((t) => t.stage === 'Done'), [processedTasks]);

  return (
    <div className="font-sans space-y-6">
      {/* Board Controls and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search operations by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-1.5 transition-colors duration-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'All' | TaskPriority)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="All" className="dark:bg-slate-900">All Priorities</option>
              <option value="Low" className="dark:bg-slate-900">Low Priority</option>
              <option value="Medium" className="dark:bg-slate-900">Medium Priority</option>
              <option value="High" className="dark:bg-slate-900">High Priority</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-1.5 transition-colors duration-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="newest" className="dark:bg-slate-900">Sort: Newest First</option>
              <option value="oldest" className="dark:bg-slate-900">Sort: Oldest First</option>
              <option value="priority" className="dark:bg-slate-900">Sort: High Priority</option>
              <option value="dueDate" className="dark:bg-slate-900">Sort: Due Date</option>
            </select>
          </div>

          {/* Add Task Primary Action Button */}
          <button
            onClick={() => onAddTaskClick('Todo')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-2xl shadow-sm hover:shadow-md hover:shadow-indigo-600/10 transition-all flex items-center gap-1.5 cursor-pointer ml-0 md:ml-4"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Mobile Column Tabs Switcher */}
      <div className="flex lg:hidden bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveMobileStage('Todo')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMobileStage === 'Todo'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Todo</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {todoTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveMobileStage('In Progress')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMobileStage === 'In Progress'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>In Progress</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {inProgressTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveMobileStage('Done')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMobileStage === 'Done'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Done</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {doneTasks.length}
          </span>
        </button>
      </div>

      {/* Board Layout (Grid Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1 */}
        <div className={activeMobileStage === 'Todo' ? 'block' : 'hidden lg:block'}>
          <TaskColumn
            stage="Todo"
            tasks={todoTasks}
            onAddTaskClick={onAddTaskClick}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onStageMove={onStageMove}
          />
        </div>

        {/* Column 2 */}
        <div className={activeMobileStage === 'In Progress' ? 'block' : 'hidden lg:block'}>
          <TaskColumn
            stage="In Progress"
            tasks={inProgressTasks}
            onAddTaskClick={onAddTaskClick}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onStageMove={onStageMove}
          />
        </div>

        {/* Column 3 */}
        <div className={activeMobileStage === 'Done' ? 'block' : 'hidden lg:block'}>
          <TaskColumn
            stage="Done"
            tasks={doneTasks}
            onAddTaskClick={onAddTaskClick}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onStageMove={onStageMove}
          />
        </div>
      </div>

      {/* No Results Fallback Indicator */}
      {processedTasks.length === 0 && tasks.length > 0 && (
        <div className="flex flex-col items-center justify-center p-16 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl text-center transition-colors">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h5 className="text-md font-bold text-slate-800 dark:text-slate-155 mb-1">No tasks match criteria</h5>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
            There are tasks in your log, but they do not match your current search terms or priority filters. Change your inputs or clear the search.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setPriorityFilter('All');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors border border-indigo-200 dark:border-indigo-900/40 hover:border-indigo-400 dark:hover:border-indigo-850 rounded-xl bg-slate-50 dark:bg-slate-950"
          >
            Reset query filters
          </button>
        </div>
      )}
    </div>
  );
}
