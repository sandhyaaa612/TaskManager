import React from 'react';
import { LogOut, User, CheckCircle2, ListTodo, Activity, Sun, Moon } from 'lucide-react';
import { UserDTO, Task } from '../types';

interface NavbarProps {
  user: UserDTO;
  tasks: Task[];
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Navbar({ user, tasks, onLogout, theme, onToggleTheme }: NavbarProps) {
  // Compute basic stats
  const totalCount = tasks.length;
  const todoCount = tasks.filter((t) => t.stage === 'Todo').length;
  const inProgressCount = tasks.filter((t) => t.stage === 'In Progress').length;
  const doneCount = tasks.filter((t) => t.stage === 'Done').length;

  const donePercentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand/Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/10 shrink-0">
              <svg
                className="w-4.5 h-4.5 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                ></path>
              </svg>
            </div>
            <div>
              <span className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight block truncate max-w-[110px] sm:max-w-none">
                Task Manager
              </span>
            </div>
          </div>

          {/* Stats Bar (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-6 border-x border-slate-100 dark:border-slate-800 px-6 py-2">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <ListTodo className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <div className="text-xs">
                <span className="block font-medium text-slate-800 dark:text-slate-200">{todoCount}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Todo</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Activity className="w-4 h-4 text-amber-500" />
              <div className="text-xs">
                <span className="block font-medium text-slate-800 dark:text-slate-200">{inProgressCount}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">In Progress</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div className="text-xs">
                <span className="block font-medium text-slate-800 dark:text-slate-200">{doneCount}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Done</span>
              </div>
            </div>

            {/* Quick Completion Progress */}
            <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden ml-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${donePercentage}%` }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">{donePercentage}%</span>
          </div>

          {/* User profile, Mode Toggle & Sign Out */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              aria-label="Toggle theme mode"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              ) : (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
              )}
            </button>

            <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-1.5 sm:pl-2.5 sm:pr-3.5 sm:py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[80px] sm:max-w-[100px] truncate hidden sm:inline">
                {user.username}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 rounded-xl transition-all cursor-pointer group"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-105 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
