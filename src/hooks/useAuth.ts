import { useState, useEffect } from 'react';
import { UserProfile } from '../types';

const USER_STORAGE_KEY = 'deepsite_user';
const TOKEN_STORAGE_KEY = 'deepsite_token';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    fetchMe();
  }, [token]);

  const login = (newToken: string, userData: any) => {
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return { user, setUser, token, setToken, login, logout };
}
