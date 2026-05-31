import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, AlertTriangle, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, UserDTO, TaskStage, TaskPriority } from './types';
import AuthScreen from './components/AuthScreen';
import Navbar from './components/Navbar';
import TaskBoard from './components/TaskBoard';
import TaskDialog from './components/TaskDialog';
import Toast, { ToastMessage } from './components/Toast';

export default function App() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Theme and UI Configuration
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('task_manager_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  // Dialog management
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultStage, setDefaultStage] = useState<TaskStage>('Todo');

  // Custom Delete confirm state
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Custom Logout confirm state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toggle theme action
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync theme to root class names
  useEffect(() => {
    localStorage.setItem('task_manager_theme', theme);
    const rootElement = document.documentElement;
    const bodyElement = document.body;
    if (theme === 'dark') {
      rootElement.classList.add('dark');
      bodyElement.classList.add('dark');
    } else {
      rootElement.classList.remove('dark');
      bodyElement.classList.remove('dark');
    }
  }, [theme]);

  // Toast helper
  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial login check
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = localStorage.getItem('task_manager_auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Retrieve logged-in user info
        const userRes = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!userRes.ok) {
          // Token is invalid/expired
          localStorage.removeItem('task_manager_auth_token');
          setLoading(false);
          return;
        }

        const userData = await userRes.json();
        setUser(userData.user);

        // Fetch User's tasks
        const tasksRes = await fetch('/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData.tasks);
        }
      } catch (err) {
        console.error('Session boot failure:', err);
        addToast('Connection failed. Working with cached offline state.', 'info');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, []);

  // 2. Fetch Helper
  const fetchTasks = async (token: string) => {
    try {
      const tasksRes = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks);
      }
    } catch (err) {
      console.error('Failed to update tasks lists:', err);
    }
  };

  // 3. User Interaction Actions
  const handleAuthSuccess = (data: { user: UserDTO; token: string }) => {
    setUser(data.user);
    fetchTasks(data.token);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    setShowLogoutConfirm(false);
    const token = localStorage.getItem('task_manager_auth_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error('Logout request error:', err);
      }
    }

    localStorage.removeItem('task_manager_auth_token');
    setUser(null);
    setTasks([]);
    addToast('Logged out of workspace successfully', 'info');
  };

  // Trigger Add Task Modal
  const triggerAddTask = (stage: TaskStage = 'Todo') => {
    setTaskToEdit(null);
    setDefaultStage(stage);
    setDialogOpen(true);
  };

  // Trigger Edit Task Modal
  const triggerEditTask = (task: Task) => {
    setTaskToEdit(task);
    setDialogOpen(true);
  };

  // Handle Save / Edit Task Payload
  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    stage: TaskStage;
    priority: TaskPriority;
    dueDate?: string;
  }) => {
    const token = localStorage.getItem('task_manager_auth_token');
    if (!token) {
      addToast('Authentication expired. Please log in again.', 'error');
      return;
    }

    const endpoint = taskToEdit ? `/api/tasks/${taskToEdit.id}` : '/api/tasks';
    const method = taskToEdit ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sync task item to backend.');
    }

    // Update local listing state instantly
    if (taskToEdit) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskToEdit.id ? data.task : t))
      );
      addToast(`Task "${taskData.title}" specs updated.`, 'success');
    } else {
      setTasks((prev) => [...prev, data.task]);
      addToast(`Task "${taskData.title}" created.`, 'success');
    }
  };

  // Quick Move stage workflow helper (Shift arrows)
  const handleStageMove = async (taskId: string, targetStage: TaskStage) => {
    const token = localStorage.getItem('task_manager_auth_token');
    if (!token) return;

    // Optimistically update frontend arrays for maximum fluidity & speed
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, stage: targetStage, updatedAt: new Date().toISOString() } : t))
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ stage: targetStage }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update stage on database.');
      }
    } catch (err: any) {
      // Revert optimistic state back upon failures
      setTasks(prevTasks);
      addToast(err.message || 'Stage movement failed to sync.', 'error');
    }
  };

  // Delete Task Trigger & Execution Flow
  const triggerDeleteTask = (taskId: string) => {
    const foundTask = tasks.find((t) => t.id === taskId);
    if (foundTask) {
      setTaskToDelete(foundTask);
    }
  };

  const executeDeleteTask = async () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;
    const token = localStorage.getItem('task_manager_auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task.');
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      addToast(`Task "${taskToDelete.title}" permanently deleted.`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Deletion failed', 'error');
    } finally {
      setTaskToDelete(null);
    }
  };

  // Loading indicator for token checks
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-mono tracking-wider">Syncing secure full-stack workspace...</p>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return (
      <>
        <AuthScreen onAuthSuccess={handleAuthSuccess} addToast={addToast} />
        <Toast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16 font-sans transition-colors duration-200">
      <Navbar
        user={user}
        tasks={tasks}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Workspace Intro Card */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
            Production Stage Board
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">
            Manage your project modules. Create tasks, set completion dates and priority factors, and shift them across stages.
          </p>
        </div>

        {/* Task Board Column Core Grid */}
        <TaskBoard
          tasks={tasks}
          onAddTaskClick={triggerAddTask}
          onEditTask={triggerEditTask}
          onDeleteTask={triggerDeleteTask}
          onStageMove={handleStageMove}
        />
      </main>

      {/* Task Creation & Editing Dialog Modal */}
      <TaskDialog
        isOpen={dialogOpen}
        taskToEdit={taskToEdit}
        defaultStage={defaultStage}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveTask}
      />

      {/* Custom In-App Delete Confirmation Modal */}
      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskToDelete(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl z-10 font-sans"
            >
              {/* Close Button */}
              <button
                onClick={() => setTaskToDelete(null)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    Delete Task Module
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">"{taskToDelete.title}"</span>? This action is irreversible.
                  </p>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setTaskToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteTask}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl z-10 font-sans"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    Confirm Log Out
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Are you sure you want to log out of your <span className="font-semibold text-slate-800 dark:text-slate-200">"{user.username}"</span> workspace session?
                  </p>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeLogout}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast Messaging System */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
