import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Task } from '../firebase';
import {
  subscribeToTasks,
  updateTaskStatus,
  updateTask as updateTaskInFirestore,
  fetchTasks,
  checkTasksExist,
  initializeTasks,
} from '../firebase';

// Constants
const TESTER_PASSWORD = 'wecinema4464';
const MAX_ATTEMPTS = 3;
const AUTH_STORAGE_KEY = 'wecinema_tester_auth';
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

// Types
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completionRate: number;
  totalHours: number;
  velocity: number;
}

interface UseTesterAuthReturn {
  isAuthenticated: boolean;
  showLoginModal: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  password: string;
  setPassword: (pwd: string) => void;
  error: string;
  attempts: number;
  isLocked: boolean;
  login: (inputPassword: string) => boolean;
  logout: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

interface UseRealtimeTasksReturn {
  tasks: Task[];
  loading: boolean;
  lastSync: Date | null;
  error: string | null;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateStatus: (taskId: string, newStatus: Task['status']) => Promise<void>;
  stats: DashboardStats;
  refresh: () => Promise<void>;
}

interface UseTaskFilterReturn {
  filterStatus: Task['status'] | 'all';
  setFilterStatus: (status: Task['status'] | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredTasks: Task[];
  clearFilters: () => void;
}

// Optimized: Memoized stats calculation
const calculateStats = (tasks: Task[]): DashboardStats => {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  const totalHours = tasks.reduce((acc, t) => acc + (t.actualHours || t.estimatedHours || 0), 0);

  return {
    totalTasks: tasks.length,
    completedTasks: completed,
    inProgressTasks: inProgress,
    blockedTasks: blocked,
    completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
    totalHours,
    velocity: completed / 6,
  };
};

// Hook: Optimized Tester Authentication with lockout
export const useTesterAuth = (): UseTesterAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const lockoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check existing auth on mount
  useEffect(() => {
    const auth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const lockoutEnd = localStorage.getItem(`${AUTH_STORAGE_KEY}_lockout`);
    
    if (lockoutEnd && new Date().getTime() < parseInt(lockoutEnd)) {
      setIsLocked(true);
      const remaining = parseInt(lockoutEnd) - new Date().getTime();
      lockoutTimerRef.current = setTimeout(() => setIsLocked(false), remaining);
    } else if (auth === 'true') {
      setIsAuthenticated(true);
    }

    return () => {
      if (lockoutTimerRef.current) clearTimeout(lockoutTimerRef.current);
    };
  }, []);

  const login = useCallback((inputPassword: string): boolean => {
    if (isLocked) {
      setError('Account temporarily locked. Please try again later.');
      return false;
    }

    if (inputPassword !== TESTER_PASSWORD) {
      setAttempts((prev) => {
        const newAttempts = prev + 1;
        const remaining = MAX_ATTEMPTS - newAttempts;
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setError('Too many failed attempts. Account locked for 5 minutes.');
          setIsLocked(true);
          const lockoutEnd = new Date().getTime() + LOCKOUT_DURATION;
          localStorage.setItem(`${AUTH_STORAGE_KEY}_lockout`, lockoutEnd.toString());
          lockoutTimerRef.current = setTimeout(() => setIsLocked(false), LOCKOUT_DURATION);
        } else {
          setError(`Invalid password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
        }
        
        return newAttempts;
      });
      return false;
    }

    setIsAuthenticated(true);
    setShowLoginModal(false);
    setError('');
    setAttempts(0);
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
    localStorage.removeItem(`${AUTH_STORAGE_KEY}_lockout`);
    return true;
  }, [isLocked]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setPassword('');
    setError('');
    setAttempts(0);
    setShowLoginModal(false);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const openLoginModal = useCallback(() => {
    if (!isLocked) {
      setShowLoginModal(true);
      setPassword('');
      setError('');
    }
  }, [isLocked]);

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
    setPassword('');
    setError('');
  }, []);

  return {
    isAuthenticated,
    showLoginModal,
    showPassword,
    setShowPassword,
    password,
    setPassword,
    error,
    attempts,
    isLocked,
    login,
    logout,
    openLoginModal,
    closeLoginModal,
  };
};

// Hook: Optimized Real-time Tasks with better error handling
export const useRealtimeTasks = (): UseRealtimeTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize Firestore data if needed
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const exists = await checkTasksExist();
        if (!exists && mounted) {
          await initializeTasks();
        }
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) setError('Failed to initialize database');
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Optimized: Single subscription with cleanup
  useEffect(() => {
    setLoading(true);
    setError(null);

    const setupSubscription = async () => {
      try {
        // Initial fetch
        const initialTasks = await fetchTasks();
        setTasks(initialTasks);
        setLastSync(new Date());
        setLoading(false);

        // Real-time subscription
        unsubscribeRef.current = subscribeToTasks((updatedTasks) => {
          setTasks(updatedTasks);
          setLastSync(new Date());
          setLoading(false);
        });
      } catch (err) {
        setError('Failed to load tasks');
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const freshTasks = await fetchTasks();
      setTasks(freshTasks);
      setLastSync(new Date());
    } catch (err) {
      setError('Failed to refresh tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTaskInFirestore(taskId, updates);
    } catch (err) {
      console.error('Failed to update task:', err);
      throw new Error('Failed to update task. Please try again.');
    }
  }, []);

  const updateStatus = useCallback(async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      throw new Error('Failed to update status. Please try again.');
    }
  }, []);

  const stats = useMemo(() => calculateStats(tasks), [tasks]);

  return {
    tasks,
    loading,
    lastSync,
    error,
    updateTask,
    updateStatus,
    stats,
    refresh,
  };
};

// Hook: Optimized Task Filtering with debounced search
export const useTaskFilter = (tasks: Task[]): UseTaskFilterReturn => {
  const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.toLowerCase().trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!debouncedQuery && filterStatus === 'all') return tasks;

    return tasks.filter((task) => {
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      
      if (!debouncedQuery) return matchesStatus;
      
      const searchLower = debouncedQuery;
      const matchesSearch =
        task.title?.toLowerCase().includes(searchLower) ||
        task.module?.toLowerCase().includes(searchLower) ||
        task.tags?.some((tag) => tag.toLowerCase().includes(searchLower));
        
      return matchesStatus && matchesSearch;
    });
  }, [tasks, filterStatus, debouncedQuery]);

  const clearFilters = useCallback(() => {
    setFilterStatus('all');
    setSearchQuery('');
  }, []);

  return {
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    filteredTasks,
    clearFilters,
  };
};