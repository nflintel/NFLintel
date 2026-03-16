import { useState, useEffect, useMemo } from 'react';
import { Project, CodeState, INITIAL_CODE } from '../types';

const STORAGE_KEY = 'deepsite_projects';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'default',
    name: 'Main Project',
    code: INITIAL_CODE,
    updatedAt: Date.now(),
    userId: 'local'
  }
];

export function useProjects(token: string | null) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved projects', e);
      }
    }
    return INITIAL_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>('default');

  useEffect(() => {
    const loadProjects = async () => {
      if (!token) return;
      try {
        const [ownedRes, sharedRes] = await Promise.all([
          fetch('/api/projects/list', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/projects/shared', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (ownedRes.ok && sharedRes.ok) {
          const owned = await ownedRes.json();
          const shared = await sharedRes.json();
          const cloudProjects = [...owned, ...shared];
          
          setProjects(prev => {
            const merged = [...cloudProjects];
            prev.forEach(lp => {
              if (!merged.find(cp => cp.id === lp.id)) {
                merged.push(lp);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to sync projects:', err);
      }
    };
    loadProjects();
  }, [token]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    
    const syncProjects = async () => {
      if (!token) return;
      try {
        const active = projects.find(p => p.id === activeProjectId);
        if (active) {
          await fetch('/api/projects', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(active)
          });
        }
      } catch (err) {
        console.error('Failed to sync projects', err);
      }
    };

    const timeoutId = setTimeout(syncProjects, 2000);
    return () => clearTimeout(timeoutId);
  }, [projects, token, activeProjectId]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const updateActiveProjectCode = (newCode: Partial<CodeState>) => {
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { ...p, code: { ...p.code, ...newCode }, updatedAt: Date.now() }
        : p
    ));
  };

  const createProject = (name: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      code: INITIAL_CODE,
      updatedAt: Date.now(),
      userId: 'local'
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };

  const deleteProject = (id: string) => {
    if (projects.length <= 1) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(projects.find(p => p.id !== id)?.id || 'default');
    }
  };

  const renameProject = (id: string, newName: string) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p
    ));
  };

  const updateProjectSharing = async (id: string, updates: Partial<Project>) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/projects/${id}/sharing`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setProjects(prev => prev.map(p => p.id === id ? updated : p));
      }
    } catch (err) {
      console.error('Failed to update sharing:', err);
      throw err;
    }
  };

  return { 
    projects, 
    setProjects, 
    activeProjectId, 
    setActiveProjectId, 
    activeProject, 
    updateActiveProjectCode,
    createProject,
    deleteProject,
    renameProject,
    updateProjectSharing
  };
}
