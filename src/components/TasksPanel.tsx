import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Task, TaskPriority, TaskStatus } from '../types';

interface TasksPanelProps {
  project: Project;
  token: string | null;
  onUpdateProject: (project: Project) => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({ project, token, onUpdateProject }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');

  const tasks = project.tasks || [];

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !token) return;

    const newTask: Task = {
      id: editingTaskId || crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      createdAt: Date.now()
    };

    let updatedTasks = [...tasks];
    if (editingTaskId) {
      updatedTasks = updatedTasks.map(t => t.id === editingTaskId ? newTask : t);
    } else {
      updatedTasks.push(newTask);
    }

    try {
      const res = await fetch(`/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...project, tasks: updatedTasks })
      });

      if (res.ok) {
        onUpdateProject({ ...project, tasks: updatedTasks });
        resetForm();
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;
    const updatedTasks = tasks.filter(t => t.id !== taskId);

    try {
      const res = await fetch(`/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...project, tasks: updatedTasks })
      });

      if (res.ok) {
        onUpdateProject({ ...project, tasks: updatedTasks });
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    if (!token) return;
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: t.status === 'done' ? 'todo' : 'done' as TaskStatus };
      }
      return t;
    });

    try {
      const res = await fetch(`/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...project, tasks: updatedTasks })
      });

      if (res.ok) {
        onUpdateProject({ ...project, tasks: updatedTasks });
      }
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setStatus(task.status);
    setIsAdding(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('todo');
    setEditingTaskId(null);
    setIsAdding(false);
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'low': return 'text-emerald-500 bg-emerald-500/10';
    }
  };

  return (
    <div className="flex flex-col border-b border-slate-200 dark:border-slate-800">
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            Tasks
            {tasks.length > 0 && (
              <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-[9px]">
                {tasks.length}
              </span>
            )}
          </span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (!isExpanded) setIsExpanded(true);
            resetForm();
            setIsAdding(true);
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-400"
          title="Add Task"
        >
          <Plus size={14} />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {isAdding ? (
                <form onSubmit={handleSaveTask} className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    autoFocus
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (optional)..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs focus:outline-none focus:border-emerald-500 dark:text-white resize-none h-16"
                  />
                  <div className="flex gap-2">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={!title.trim()}
                      className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {editingTaskId ? 'Update' : 'Add'} Task
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : tasks.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckSquare className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500">No tasks yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:border-emerald-500/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => handleToggleComplete(task.id)}
                          className={`mt-0.5 shrink-0 w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                            task.status === 'done' 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                          }`}
                        >
                          {task.status === 'done' && <CheckSquare size={10} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-xs font-bold dark:text-white truncate ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditing(task)} className="p-1 text-slate-400 hover:text-emerald-500 rounded">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-500 rounded">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          {task.description && (
                            <p className={`text-[10px] text-slate-500 mb-2 line-clamp-2 ${task.status === 'done' ? 'opacity-50' : ''}`}>
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                              {task.status.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
