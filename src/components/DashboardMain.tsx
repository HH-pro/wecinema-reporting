import React, { useState, useCallback, useMemo, Suspense, lazy } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  LayoutDashboard, 
  Search, 
  ChevronRight,
  Filter,
  TrendingUp,
  Activity,
  Bell,
  RefreshCw,
  CheckSquare,
  Timer,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Film,
  BarChart3,
  Shield,
  X,
  Menu,
  User,
  Calendar,
  Clock3
} from 'lucide-react';
import { 
  useRealtimeTasks, 
  useTesterAuth, 
  useTaskFilter,
  DashboardStats,
  Task 
} from './useDashboard';
import wecinemaLogo from "../../public/wecinema.png";
// Lazy load heavy components for better initial load
const VelocityChart = lazy(() => import('./VelocityChart'));

// ==========================================
// CONSTANTS & CONFIG
// ==========================================

const STATUS_CONFIG = {
  completed: { 
    bg: 'bg-emerald-100', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    icon: CheckCircle,
    label: 'Completed',
    color: 'emerald'
  },
  'in-progress': { 
    bg: 'bg-amber-100', 
    text: 'text-amber-700', 
    border: 'border-amber-200',
    icon: Clock,
    label: 'In Progress',
    color: 'amber'
  },
  pending: { 
    bg: 'bg-slate-100', 
    text: 'text-slate-600', 
    border: 'border-slate-200',
    icon: AlertCircle,
    label: 'Pending',
    color: 'slate'
  },
  blocked: { 
    bg: 'bg-rose-100', 
    text: 'text-rose-700', 
    border: 'border-rose-200',
    icon: AlertCircle,
    label: 'Blocked',
    color: 'rose'
  }
} as const;

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-rose-100 text-rose-700 animate-pulse'
} as const;

const PHASES = [
  { name: 'Phase 1', range: [1, 6], color: 'emerald', desc: 'Core Platform' },
  { name: 'Phase 2', range: [7, 10], color: 'amber', desc: 'Hypemode' },
  { name: 'Phase 3', range: [11, 14], color: 'indigo', desc: 'Seller' },
  { name: 'Phase 4', range: [15, 17], color: 'violet', desc: 'Buyer' },
  { name: 'Phase 5-6', range: [18, 20], color: 'rose', desc: 'Advanced' },
] as const;

// ==========================================
// UTILITY COMPONENTS
// ==========================================

const StatusBadge: React.FC<{ status: Task['status']; showIcon?: boolean; size?: 'sm' | 'md' }> = 
  React.memo(({ status, showIcon = true, size = 'sm' }) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
    
    return (
      <span className={`inline-flex items-center rounded-full font-medium border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
        {showIcon && <Icon className={`${size === 'sm' ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1.5'}`} />}
        {config.label}
      </span>
    );
  });

const PriorityBadge: React.FC<{ priority: Task['priority']; size?: 'sm' | 'md' }> = 
  React.memo(({ priority, size = 'sm' }) => {
    const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';
    return (
      <span className={`rounded font-bold ${PRIORITY_COLORS[priority]} ${sizeClasses}`}>
        {priority.toUpperCase()}
      </span>
    );
  });

const ProgressBar: React.FC<{ current: number; total: number; color?: string; size?: 'sm' | 'md' }> = 
  React.memo(({ current, total, color = 'indigo', size = 'sm' }) => {
    const percentage = useMemo(() => 
      total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0
    , [current, total]);
    
    const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';
    
    return (
      <div className="w-full">
        <div className="flex justify-between mb-1">
          <span className={`font-medium text-slate-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>Progress</span>
          <span className={`font-bold text-slate-800 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{percentage}%</span>
        </div>
        <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
          <div 
            className={`bg-${color}-600 ${heightClass} rounded-full transition-all duration-500 ease-out`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  });

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
}> = React.memo(({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow duration-200`}>
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 mb-0.5 truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{value}</h3>
        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`text-[10px] mt-0.5 font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}% from last week
          </p>
        )}
      </div>
      <div className={`p-2.5 rounded-xl bg-${color}-50 flex-shrink-0 ml-2`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
    </div>
  </div>
));

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <div className="absolute inset-0 w-8 h-8 border-2 border-indigo-100 rounded-full" />
      </div>
      <p className="text-slate-600 font-medium text-sm text-center">{text}</p>
    </div>
  </div>
);

// ==========================================
// MODAL COMPONENT
// ==========================================

const PasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLogin: (pwd: string) => boolean;
  password: string;
  setPassword: (pwd: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  error: string;
  attempts: number;
  isLocked: boolean;
}> = React.memo(({ 
  isOpen, 
  onClose, 
  onLogin, 
  password, 
  setPassword, 
  showPassword, 
  setShowPassword, 
  error, 
  attempts,
  isLocked 
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLocked) {
      onLogin(password);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            {isLocked ? <Lock className="w-6 h-6 text-white" /> : <Shield className="w-6 h-6 text-white" />}
          </div>
          <h3 className="text-xl font-bold">{isLocked ? 'Access Locked' : 'Tester Access'}</h3>
          <p className="text-indigo-100 text-sm mt-1">
            {isLocked ? 'Too many failed attempts' : 'Enter password to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLocked}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pr-10 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder={isLocked ? 'Locked' : 'Enter password'}
                autoFocus={!isLocked}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2.5 rounded-lg text-sm flex items-start gap-2 animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLocked || !password}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <LogIn className="w-4 h-4" />
            {isLocked ? 'Locked' : attempts > 0 ? `Unlock (${MAX_ATTEMPTS - attempts} left)` : 'Unlock Access'}
          </button>

          {isLocked && (
            <p className="text-center text-xs text-rose-600">
              Account locked. Please try again in 5 minutes.
            </p>
          )}
        </form>

        <div className="px-6 pb-4 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Secure testing environment
          </p>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// VIEW COMPONENTS
// ==========================================

const OverviewView: React.FC<{
  stats: DashboardStats;
  tasks: Task[];
  onSelectTask: (t: Task) => void;
}> = React.memo(({ stats, tasks, onSelectTask }) => {
  const phaseProgress = useMemo(() => 
    PHASES.map((phase) => {
      const phaseTasks = tasks.filter(t => t.day >= phase.range[0] && t.day <= phase.range[1]);
      const completed = phaseTasks.filter(t => t.status === 'completed').length;
      return {
        ...phase,
        total: phaseTasks.length,
        completed,
        progress: phaseTasks.length > 0 ? (completed / phaseTasks.length) * 100 : 0
      };
    })
  , [tasks]);

  const recentUpdates = useMemo(() => 
    tasks
      .filter(t => {
        const lastUpdate = t.lastUpdated instanceof Date ? t.lastUpdated : new Date(t.lastUpdated);
        return (new Date().getTime() - lastUpdate.getTime()) < 86400000;
      })
      .sort((a, b) => {
        const aTime = a.lastUpdated instanceof Date ? a.lastUpdated.getTime() : new Date(a.lastUpdated).getTime();
        const bTime = b.lastUpdated instanceof Date ? b.lastUpdated.getTime() : new Date(b.lastUpdated).getTime();
        return bTime - aTime;
      })
      .slice(0, 5)
  , [tasks]);

  return (
    <div className="space-y-4">
      {/* Phase Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {phaseProgress.map((phase) => (
          <button 
            key={phase.name} 
            onClick={() => {
              const firstTask = tasks.find(t => t.day >= phase.range[0] && t.day <= phase.range[1]);
              if (firstTask) onSelectTask(firstTask);
            }}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{phase.name}</h3>
                <p className="text-xs text-slate-400">{phase.desc}</p>
              </div>
              <span className={`text-xs font-bold text-${phase.color}-600 bg-${phase.color}-50 px-2 py-1 rounded-lg`}>
                {phase.completed}/{phase.total}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`bg-${phase.color}-500 h-2 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${phase.progress}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Recent Updates */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-indigo-500" />
            Recent Updates
          </h3>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
          {recentUpdates.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No recent updates
            </div>
          ) : (
            recentUpdates.map(task => (
              <button 
                key={task.id} 
                onClick={() => onSelectTask(task)}
                className="w-full px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.status === 'completed' ? 'bg-emerald-500' : 
                    task.status === 'in-progress' ? 'bg-amber-500' : 'bg-slate-300'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">Day {task.day}: {task.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{task.module}</p>
                  </div>
                </div>
                <StatusBadge status={task.status} showIcon={false} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

const ClientView: React.FC<{
  tasks: Task[];
  onSelectTask: (t: Task) => void;
}> = React.memo(({ tasks, onSelectTask }) => {
  const progress = useMemo(() => ({
    completed: tasks.filter(t => t.status === 'completed').length,
    total: tasks.length
  }), [tasks]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <ProgressBar 
          current={progress.completed} 
          total={progress.total} 
          color="emerald"
          size="md"
        />
      </div>
      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          tasks.map((task) => (
            <button 
              key={task.id} 
              onClick={() => onSelectTask(task)}
              className="w-full p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex-shrink-0">
                    {task.day}
                  </span>
                  <div className="min-w-0">
                    <h4 className={`font-medium text-sm ${task.status === 'pending' ? 'text-slate-500' : 'text-slate-900'} truncate`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">{task.module}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-xs text-slate-400">{task.estimatedHours}h</span>
                    </div>
                    <span className="text-xs text-indigo-600 font-medium">@{task.assignedTo}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <StatusBadge status={task.status} showIcon={false} />
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>
              {task.findings && (
                <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-2">
                  {task.findings}
                </p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
});

const TesterView: React.FC<{
  tasks: Task[];
  onUpdateStatus: (id: string, status: Task['status']) => Promise<void>;
  onSelectTask: (t: Task) => void;
  updating: string | null;
}> = React.memo(({ tasks, onUpdateStatus, onSelectTask, updating }) => {
  const handleStatusChange = useCallback(async (taskId: string, newStatus: Task['status']) => {
    if (updating === taskId) return;
    await onUpdateStatus(taskId, newStatus);
  }, [onUpdateStatus, updating]);

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-200" />
        <p className="text-slate-500 text-sm">No tasks available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isUpdating = updating === task.id;
        const statusConfig = STATUS_CONFIG[task.status];
        
        return (
          <div 
            key={task.id} 
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button 
                onClick={() => onSelectTask(task)}
                className="flex items-start gap-3 flex-1 text-left min-w-0"
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${statusConfig.bg} ${statusConfig.text}`}>
                  <statusConfig.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Day {task.day}</span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <h4 className="font-medium text-sm text-slate-900 mt-1 line-clamp-1">{task.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                  <span className="text-xs text-indigo-600 font-medium">@{task.assignedTo}</span>
                </div>
              </button>
              
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <select
                  value={task.status}
                  disabled={isUpdating}
                  onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                  className={`
                    px-3 py-2 text-xs border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium disabled:opacity-50 min-w-[120px]
                    ${task.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 
                      task.status === 'in-progress' ? 'border-amber-200 bg-amber-50 text-amber-700' : 
                      task.status === 'blocked' ? 'border-rose-200 bg-rose-50 text-rose-700' :
                      'border-slate-200 bg-white text-slate-600'}
                  `}
                >
                  <option value="pending">⏸ Pending</option>
                  <option value="in-progress">▶ In Progress</option>
                  <option value="completed">✓ Completed</option>
                  <option value="blocked">⛔ Blocked</option>
                </select>
                {isUpdating && (
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ==========================================
// TASK DETAIL COMPONENTS
// ==========================================

const TaskDetailContent: React.FC<{
  task: Task;
  onUpdateStatus: (id: string, status: Task['status']) => Promise<void>;
  isTesterAuthenticated: boolean;
  updating: boolean;
  onClose: () => void;
}> = React.memo(({ task, onUpdateStatus, isTesterAuthenticated, updating, onClose }) => {
  const [localUpdating, setLocalUpdating] = useState(false);
  
  const lastUpdated = useMemo(() => 
    task.lastUpdated instanceof Date ? task.lastUpdated : new Date(task.lastUpdated)
  , [task.lastUpdated]);

  const handleStatusClick = useCallback(async (status: Task['status']) => {
    if (!isTesterAuthenticated || updating || localUpdating) return;
    setLocalUpdating(true);
    try {
      await onUpdateStatus(task.id, status);
    } finally {
      setLocalUpdating(false);
    }
  }, [isTesterAuthenticated, updating, localUpdating, onUpdateStatus, task.id]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
            Day {task.day}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{task.title}</h3>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-2 flex-wrap">
          <span className="font-medium text-slate-700">{task.module}</span>
          <span>•</span>
          <span>{task.category}</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="w-3 h-3 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-indigo-600">@{task.assignedTo}</span>
        </div>
      </div>

      {isTesterAuthenticated ? (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <label className="text-xs font-semibold text-slate-500 uppercase mb-3 block tracking-wide">
            Update Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['pending', 'in-progress', 'completed', 'blocked'] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusClick(status)}
                disabled={updating || localUpdating}
                className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                  task.status === status 
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 ring-offset-1' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                {status === 'in-progress' && <Clock className="w-3.5 h-3.5" />}
                {status === 'blocked' && <AlertCircle className="w-3.5 h-3.5" />}
                {status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                {status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900">Tester access required</p>
            <p className="text-xs text-amber-700">Authenticate to update task status</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Description</h4>
          <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
            {task.description}
          </p>
        </div>
        
        {task.findings && (
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">Findings</h4>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
              <p className="text-sm text-emerald-800 leading-relaxed">{task.findings}</p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-3 text-xs sm:text-sm">
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Assigned
          </span>
          <span className="font-medium text-slate-900">{task.assignedTo}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 flex items-center gap-2">
            <Timer className="w-3.5 h-3.5" /> Time
          </span>
          <span className="font-medium text-slate-900">{task.actualHours || 0}h / {task.estimatedHours}h</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" /> Updated
          </span>
          <span className="font-medium text-slate-900">{lastUpdated.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {task.tags.map(tag => (
          <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium hover:bg-slate-200 transition-colors">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
});

const MobileTaskDrawer: React.FC<{
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Task['status']) => Promise<void>;
  isTesterAuthenticated: boolean;
  updating: boolean;
}> = ({ task, isOpen, onClose, ...props }) => {
  if (!task || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between z-10">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={task.status} size="md" />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg mt-2">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <TaskDetailContent task={task} onClose={onClose} {...props} />
      </div>
    </div>
  );
};

const DesktopTaskPanel: React.FC<{
  task: Task | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Task['status']) => Promise<void>;
  isTesterAuthenticated: boolean;
  updating: boolean;
}> = ({ task, onClose, ...props }) => {
  if (!task) return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center hidden lg:block h-fit">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
        <LayoutDashboard className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">No Task Selected</h3>
      <p className="text-sm text-slate-500">Select a task to view details</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hidden lg:block h-fit sticky top-24">
      <TaskDetailContent task={task} onClose={onClose} {...props} />
    </div>
  );
};

// ==========================================
// MAIN DASHBOARD
// ==========================================

type TabType = 'overview' | 'client' | 'tester';

const DashboardMain: React.FC = () => {
  const { tasks, loading, lastSync, error, updateStatus, stats, refresh } = useRealtimeTasks();
  const testerAuth = useTesterAuth();
  const { filteredTasks, filterStatus, setFilterStatus, searchQuery, setSearchQuery, clearFilters } = useTaskFilter(tasks);
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    await refresh();
    setTimeout(() => setIsSyncing(false), 500);
  }, [refresh]);

  const handleStatusUpdate = useCallback(async (taskId: string, newStatus: Task['status']) => {
    setUpdatingTask(taskId);
    try {
      await updateStatus(taskId, newStatus);
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      // Error handled by hook, show toast or notification here
      console.error('Update failed:', err);
    } finally {
      setUpdatingTask(null);
    }
  }, [updateStatus, selectedTask]);

  const handleTaskSelect = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsMobileDrawerOpen(true);
  }, []);

  const handleTesterTabClick = useCallback(() => {
    setActiveTab('tester');
    if (!testerAuth.isAuthenticated && !testerAuth.isLocked) {
      testerAuth.openLoginModal();
    }
  }, [testerAuth]);

  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  }, []);

  const tabs = useMemo(() => [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'client' as const, label: 'Client Review', icon: CheckCircle },
    { id: 'tester' as const, label: 'Tester', icon: testerAuth.isAuthenticated ? CheckCircle : Lock, locked: !testerAuth.isAuthenticated },
  ], [testerAuth.isAuthenticated]);

  if (loading) return <LoadingSpinner text="Connecting to Firestore..." />;
  
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-rose-200 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Connection Error</h3>
          <p className="text-slate-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors text-sm font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <PasswordModal
        isOpen={testerAuth.showLoginModal}
        onClose={testerAuth.closeLoginModal}
        onLogin={testerAuth.login}
        password={testerAuth.password}
        setPassword={testerAuth.setPassword}
        showPassword={testerAuth.showPassword}
        setShowPassword={testerAuth.setShowPassword}
        error={testerAuth.error}
        attempts={testerAuth.attempts}
        isLocked={testerAuth.isLocked}
      />

      <MobileTaskDrawer
        task={selectedTask}
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onUpdateStatus={handleStatusUpdate}
        isTesterAuthenticated={testerAuth.isAuthenticated}
        updating={updatingTask === selectedTask?.id}
      />

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-md">
               <img
  src={wecinemaLogo}
  alt="WeCinema"
  className="w-5 h-5 object-contain"
/>

              </div>
              <div>
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                  wecinema.co
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {lastSync && (
                <span className="hidden md:block text-[10px] text-slate-400 mr-2">
                  Synced {lastSync.toLocaleTimeString()}
                </span>
              )}
              
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className={`p-2 rounded-xl transition-all ${
                  isSyncing ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'
                }`}
                aria-label="Sync"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>

              <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              </button>

              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                TM
              </div>

              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-3 py-3 absolute w-full shadow-lg">
            <div className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.id === 'tester' ? handleTesterTabClick() : handleTabClick(tab.id)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                    activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                  {tab.locked && <Lock className="w-3 h-3" />}
                  {tab.id === 'tester' && testerAuth.isAuthenticated && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 lg:py-6">
        {/* Search & Filter Bar - Mobile */}
        <div className="lg:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard 
            title="Total Tasks" 
            value={stats.totalTasks} 
            subtitle={`${stats.completedTasks} completed`}
            icon={CheckSquare}
            color="indigo"
            trend={12}
          />
          <StatCard 
            title="Progress" 
            value={`${stats.completionRate}%`} 
            subtitle="Completion rate"
            icon={TrendingUp}
            color="emerald"
            trend={8}
          />
          <StatCard 
            title="Active" 
            value={stats.inProgressTasks} 
            subtitle={`${stats.blockedTasks} blocked`}
            icon={Activity}
            color="amber"
          />
          <StatCard 
            title="Hours" 
            value={stats.totalHours} 
            subtitle={`${stats.velocity.toFixed(1)}/day velocity`}
            icon={Timer}
            color="violet"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Desktop Tabs & Search */}
            <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => tab.id === 'tester' ? handleTesterTabClick() : handleTabClick(tab.id)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      activeTab === tab.id 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                    {tab.locked && <Lock className="w-3 h-3" />}
                    {tab.id === 'tester' && testerAuth.isAuthenticated && (
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as Task['status'] | 'all')}
                    className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer font-medium text-slate-700"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                {(searchQuery || filterStatus !== 'all') && (
                  <button 
                    onClick={clearFilters}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Clear filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Tab Indicator */}
            <div className="lg:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                {activeTab === 'overview' && <LayoutDashboard className="w-4 h-4 text-indigo-500" />}
                {activeTab === 'client' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                {activeTab === 'tester' && (testerAuth.isAuthenticated ? <CheckCircle className="w-4 h-4 text-indigo-500" /> : <Lock className="w-4 h-4 text-rose-500" />)}
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <div className="flex items-center gap-2">
                {activeTab === 'tester' && !testerAuth.isAuthenticated && (
                  <span className="flex items-center gap-1 text-xs text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded-lg">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
                {testerAuth.isAuthenticated && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-lg">
                    <CheckCircle className="w-3 h-3" /> Unlocked
                  </span>
                )}
              </div>
            </div>

            {/* Content Views */}
            <div className="min-h-[400px]">
              {activeTab === 'overview' && (
                <OverviewView stats={stats} tasks={filteredTasks} onSelectTask={handleTaskSelect} />
              )}
              {activeTab === 'client' && (
                <ClientView tasks={filteredTasks} onSelectTask={handleTaskSelect} />
              )}
              {activeTab === 'tester' && (
                !testerAuth.isAuthenticated ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Tester Access Required</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">Enter your credentials to access the testing interface and update task statuses.</p>
                    <button
                      onClick={testerAuth.openLoginModal}
                      disabled={testerAuth.isLocked}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 mx-auto shadow-lg shadow-indigo-200"
                    >
                      <LogIn className="w-4 h-4" />
                      {testerAuth.isLocked ? 'Account Locked' : 'Enter Password'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">Access Granted</p>
                          <p className="text-xs text-emerald-700">Changes are saved to Firestore in real-time</p>
                        </div>
                      </div>
                      <button
                        onClick={testerAuth.logout}
                        className="text-sm text-emerald-700 hover:text-emerald-900 font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                    <TesterView 
                      tasks={filteredTasks} 
                      onUpdateStatus={handleStatusUpdate}
                      onSelectTask={handleTaskSelect}
                      updating={updatingTask}
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Panel - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <DesktopTaskPanel
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdateStatus={handleStatusUpdate}
                isTesterAuthenticated={testerAuth.isAuthenticated}
                updating={updatingTask === selectedTask?.id}
              />
              <Suspense fallback={<div className="h-48 bg-slate-100 rounded-xl animate-pulse" />}>
                <VelocityChart />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardMain;