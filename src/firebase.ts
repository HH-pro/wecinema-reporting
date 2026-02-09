import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  writeBatch,
  enableIndexedDbPersistence,
  getDoc,
  setDoc,
  deleteDoc,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';

// Firebase configuration with validation
const getFirebaseConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Validate required config in production
  if (import.meta.env.PROD) {
    const missing = Object.entries(config)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    
    if (missing.length > 0) {
      throw new Error(`Missing Firebase config: ${missing.join(', ')}`);
    }
  }

  return {
    ...config,
    apiKey: config.apiKey || "demo-key",
    authDomain: config.authDomain || "demo.firebaseapp.com",
    projectId: config.projectId || "demo-project",
  };
};

const app = initializeApp(getFirebaseConfig());
export const db = getFirestore(app);

// Enable offline persistence for better UX
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support offline persistence');
    }
  });
}

const TASKS_COLLECTION = 'wecinema_tasks';
const BATCH_SIZE = 500; // Firestore batch limit

export type TaskStatus = 'completed' | 'in-progress' | 'pending' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskCategory = 
  | 'Auth' 
  | 'Media' 
  | 'Engagement' 
  | 'Search' 
  | 'UI' 
  | 'Personalization' 
  | 'Subscription' 
  | 'Marketplace' 
  | 'Advanced';

export interface Task {
  id: string;
  day: number;
  title: string;
  module: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  description: string;
  findings?: string;
  assignedTo?: string;
  estimatedHours: number;
  actualHours?: number;
  lastUpdated: Timestamp | Date;
  tags: string[];
}

// Cache for tasks to reduce reads
let tasksCache: Task[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const convertTimestamp = (timestamp: Timestamp | Date | unknown): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  // Handle Firestore timestamp objects
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as Timestamp).toDate();
  }
  return new Date();
};

export const initializeTasks = async (force = false): Promise<void> => {
  try {
    const exists = await checkTasksExist();
    if (exists && !force) {
      console.log('Tasks already initialized');
      return;
    }

    const initialTasks: Omit<Task, 'id'>[] = [
      {
        day: 1,
        title: 'Authentication & Access Control',
        module: 'Auth System',
        status: 'completed',
        priority: 'high',
        category: 'Auth',
        description: 'Email/Google OAuth, Session Handling, Role Protection.',
        findings: 'System stable. No session leakage detected. Role-based access functioning correctly.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 8,
        actualHours: 7,
        lastUpdated: new Date(),
        tags: ['security', 'oauth', 'testing']
      },
      {
        day: 2,
        title: 'Video & Script Upload System',
        module: 'Storage',
        status: 'completed',
        priority: 'high',
        category: 'Media',
        description: 'Multi-format upload, metadata tagging, interruption handling.',
        findings: 'Upload system stable. No data corruption. Metadata stored accurately.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 10,
        actualHours: 12,
        lastUpdated: new Date(),
        tags: ['storage', 'upload', 'performance']
      },
      {
        day: 3,
        title: 'Engagement & Interaction',
        module: 'Social',
        status: 'completed',
        priority: 'medium',
        category: 'Engagement',
        description: 'Likes, Comments, Bookmarks, Real-time UI.',
        findings: 'Engagement layer synchronized. Real-time updates working.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 6,
        actualHours: 6,
        lastUpdated: new Date(),
        tags: ['real-time', 'social', 'ux']
      },
      {
        day: 4,
        title: 'Search & Discovery Engine',
        module: 'Search',
        status: 'completed',
        priority: 'high',
        category: 'Search',
        description: 'Voice search, Filters, Graph data aggregation.',
        findings: 'Search queries optimized. Filter logic verified. Graph data accurate.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 12,
        actualHours: 14,
        lastUpdated: new Date(),
        tags: ['search', 'performance', 'algorithm']
      },
      {
        day: 5,
        title: 'UI/UX & Static Pages',
        module: 'Frontend',
        status: 'completed',
        priority: 'medium',
        category: 'UI',
        description: 'Dark Mode, Responsive Design, Legal Pages.',
        findings: 'UI responsive across devices. Dark mode consistent.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 8,
        actualHours: 7,
        lastUpdated: new Date(),
        tags: ['ui', 'responsive', 'design-system']
      },
      {
        day: 6,
        title: 'Personalization & User Data',
        module: 'Data',
        status: 'completed',
        priority: 'medium',
        category: 'Personalization',
        description: 'Watch history, Liked videos, Data isolation.',
        findings: 'User data properly isolated. Personal dashboard stable.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 6,
        actualHours: 5,
        lastUpdated: new Date(),
        tags: ['privacy', 'data', 'isolation']
      },
      {
        day: 7,
        title: 'Hypemode Role & Access',
        module: 'Subscription',
        status: 'in-progress',
        priority: 'critical',
        category: 'Subscription',
        description: 'Role assignment (User/Studio), Feature access control.',
        findings: 'Testing role switching and premium badge verification...',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 10,
        actualHours: 4,
        lastUpdated: new Date(),
        tags: ['subscription', 'roles', 'access-control']
      },
      {
        day: 8,
        title: 'PayPal Integration',
        module: 'Payments',
        status: 'pending',
        priority: 'critical',
        category: 'Subscription',
        description: 'Subscription flow, Webhooks, Expiry detection.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 12,
        lastUpdated: new Date(),
        tags: ['payment', 'paypal', 'webhooks']
      },
      {
        day: 9,
        title: 'Subscription Edge Cases',
        module: 'Payments',
        status: 'pending',
        priority: 'high',
        category: 'Subscription',
        description: 'Cancel/Renew logic, Duplicate payment prevention.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 8,
        lastUpdated: new Date(),
        tags: ['edge-cases', 'payment', 'renewal']
      },
      {
        day: 10,
        title: 'Premium Feature Enforcement',
        module: 'Access',
        status: 'pending',
        priority: 'high',
        category: 'Subscription',
        description: 'Seller dashboard restriction, Downgrade behavior.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 6,
        lastUpdated: new Date(),
        tags: ['enforcement', 'premium', 'downgrade']
      },
      {
        day: 11,
        title: 'Seller Dashboard Functional',
        module: 'Marketplace',
        status: 'pending',
        priority: 'high',
        category: 'Marketplace',
        description: 'CRUD listings, Visibility settings.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 14,
        lastUpdated: new Date(),
        tags: ['seller', 'crud', 'dashboard']
      },
      {
        day: 12,
        title: 'Stripe Connect Setup',
        module: 'Finance',
        status: 'pending',
        priority: 'critical',
        category: 'Marketplace',
        description: 'Account connection, KYC, Webhook mapping.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 16,
        lastUpdated: new Date(),
        tags: ['stripe', 'kyc', 'onboarding']
      },
      {
        day: 13,
        title: 'Earnings & Withdrawal',
        module: 'Finance',
        status: 'pending',
        priority: 'high',
        category: 'Marketplace',
        description: 'Commission logic, Withdrawal requests.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 10,
        lastUpdated: new Date(),
        tags: ['earnings', 'withdrawal', 'commission']
      },
      {
        day: 14,
        title: 'Offer & Order Management',
        module: 'Marketplace',
        status: 'pending',
        priority: 'medium',
        category: 'Marketplace',
        description: 'Accept/Reject offers, Order creation triggers.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 12,
        lastUpdated: new Date(),
        tags: ['offers', 'orders', 'workflow']
      },
      {
        day: 15,
        title: 'Buyer Dashboard Testing',
        module: 'Orders',
        status: 'pending',
        priority: 'medium',
        category: 'Marketplace',
        description: 'Order states, Visibility, History.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 8,
        lastUpdated: new Date(),
        tags: ['buyer', 'orders', 'history']
      },
      {
        day: 16,
        title: 'Order Lifecycle & Stripe',
        module: 'Orders',
        status: 'pending',
        priority: 'high',
        category: 'Marketplace',
        description: 'Payment verification, State transitions.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 14,
        lastUpdated: new Date(),
        tags: ['lifecycle', 'stripe', 'verification']
      },
      {
        day: 17,
        title: 'Buyer-Seller Messaging',
        module: 'Chat',
        status: 'pending',
        priority: 'medium',
        category: 'Marketplace',
        description: 'Real-time chat, Order-linked conversations.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 16,
        lastUpdated: new Date(),
        tags: ['chat', 'real-time', 'messaging']
      },
      {
        day: 18,
        title: 'Video Editor & Processing',
        module: 'Advanced',
        status: 'pending',
        priority: 'low',
        category: 'Advanced',
        description: 'Editing workflow, Export validation, Memory optimization.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 20,
        lastUpdated: new Date(),
        tags: ['video-editor', 'processing', 'memory']
      },
      {
        day: 19,
        title: 'AI Chatbot & Support',
        module: 'Advanced',
        status: 'pending',
        priority: 'medium',
        category: 'Advanced',
        description: 'AI accuracy, Escalation flows.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 18,
        lastUpdated: new Date(),
        tags: ['ai', 'chatbot', 'support']
      },
      {
        day: 20,
        title: 'Final Audit & Launch Readiness',
        module: 'Audit',
        status: 'pending',
        priority: 'critical',
        category: 'Advanced',
        description: 'Full regression testing, Performance audit.',
        assignedTo: 'Hamza Manzoor',
        estimatedHours: 24,
        lastUpdated: new Date(),
        tags: ['audit', 'regression', 'launch']
      }
    ];

    // Use batched writes for better performance
    const batch = writeBatch(db);
    const now = Timestamp.now();
    
    initialTasks.forEach((task, index) => {
      const docRef = doc(db, TASKS_COLLECTION, `task_${String(index + 1).padStart(3, '0')}`);
      batch.set(docRef, {
        ...task,
        lastUpdated: now,
        createdAt: now,
        order: index + 1
      });
    });

    await batch.commit();
    tasksCache = null; // Invalidate cache
    console.log('Tasks initialized successfully');
  } catch (error) {
    console.error('Error initializing tasks:', error);
    throw new Error('Failed to initialize tasks. Please try again.');
  }
};

export const fetchTasks = async (options?: { 
  useCache?: boolean;
  limit?: number;
}): Promise<Task[]> => {
  const { useCache = true, limit: limitCount } = options || {};
  
  // Return cached data if fresh
  if (useCache && tasksCache && (Date.now() - lastCacheTime) < CACHE_DURATION) {
    return limitCount ? tasksCache.slice(0, limitCount) : tasksCache;
  }

  try {
    let q = query(
      collection(db, TASKS_COLLECTION), 
      orderBy('day', 'asc')
    );
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastUpdated: convertTimestamp(data.lastUpdated)
      } as Task;
    });

    // Update cache
    tasksCache = tasks;
    lastCacheTime = Date.now();

    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // Return cached data if available, even if stale
    if (tasksCache) return tasksCache;
    throw new Error('Failed to fetch tasks. Please check your connection.');
  }
};

export const subscribeToTasks = (
  callback: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(collection(db, TASKS_COLLECTION), orderBy('day', 'asc'));
  
  const unsubscribe = onSnapshot(
    q, 
    (snapshot) => {
      const tasks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastUpdated: convertTimestamp(data.lastUpdated)
        } as Task;
      });
      
      // Update cache
      tasksCache = tasks;
      lastCacheTime = Date.now();
      
      callback(tasks);
    }, 
    (error) => {
      console.error('Error in real-time subscription:', error);
      onError?.(error as Error);
    }
  );

  return unsubscribe;
};

export const getTaskById = async (taskId: string): Promise<Task | null> => {
  try {
    const docRef = doc(db, TASKS_COLLECTION, taskId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      lastUpdated: convertTimestamp(data.lastUpdated)
    } as Task;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (
  taskId: string, 
  newStatus: TaskStatus,
  options?: {
    actualHours?: number;
    findings?: string;
    merge?: boolean;
  }
): Promise<void> => {
  const { actualHours, findings, merge = true } = options || {};
  
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const updateData: Record<string, unknown> = {
      status: newStatus,
      lastUpdated: Timestamp.now()
    };
    
    if (actualHours !== undefined) {
      updateData.actualHours = actualHours;
    }
    
    if (findings !== undefined) {
      updateData.findings = findings;
    }

    if (merge) {
      await updateDoc(taskRef, updateData);
    } else {
      await setDoc(taskRef, updateData, { merge: true });
    }
    
    // Optimistic cache update
    if (tasksCache) {
      const taskIndex = tasksCache.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasksCache[taskIndex] = {
          ...tasksCache[taskIndex],
          ...updateData,
          lastUpdated: new Date()
        } as Task;
      }
    }
    
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new Error('Failed to update task status. Please try again.');
  }
};

export const updateTask = async (
  taskId: string, 
  updates: Partial<Omit<Task, 'id'>>,
  options?: { merge?: boolean }
): Promise<void> => {
  const { merge = true } = options || {};
  
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const updateData = {
      ...updates,
      lastUpdated: Timestamp.now()
    };

    if (merge) {
      await updateDoc(taskRef, updateData);
    } else {
      await setDoc(taskRef, updateData, { merge: true });
    }

    // Optimistic cache update
    if (tasksCache) {
      const taskIndex = tasksCache.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasksCache[taskIndex] = {
          ...tasksCache[taskIndex],
          ...updates,
          lastUpdated: new Date()
        } as Task;
      }
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task. Please try again.');
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    // Invalidate cache
    tasksCache = tasksCache?.filter(t => t.id !== taskId) || null;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task. Please try again.');
  }
};

export const checkTasksExist = async (): Promise<boolean> => {
  try {
    const q = query(collection(db, TASKS_COLLECTION), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking tasks:', error);
    return false;
  }
};

export const clearCache = (): void => {
  tasksCache = null;
  lastCacheTime = 0;
};

// Export types for convenience
export { Timestamp };