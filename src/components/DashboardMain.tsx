import React, { 
  useState, 
  useCallback, 
  useMemo, 
  useEffect,
  useRef
} from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  LayoutDashboard, 
  Search, 
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
  Clock3,
  MoreHorizontal,
  Tag,
  ArrowUpRight
} from 'lucide-react';
import { 
  useRealtimeTasks, 
  useTesterAuth, 
  useTaskFilter,
  DashboardStats,
  Task,
  TaskStatus
} from '../components/useDashboard';
import wecinemaLogo from "../../../wecinema.png";

// ==========================================
// CONSTANTS & CONFIGURATION (keep all your existing constants)
// ==========================================

const STATUS_CONFIG: Record<TaskStatus, {
  bg: string;
  text: string;
  border: string;
  icon: React.ElementType;
  label: string;
  color: string;
  gradient: string;
}> = {
  completed: { 
    bg: 'bg-emerald-100', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    icon: CheckCircle,
    label: 'Completed',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600'
  },
  'in-progress': { 
    bg: 'bg-amber-100', 
    text: 'text-amber-700', 
    border: 'border-amber-200',
    icon: Clock,
    label: 'In Progress',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600'
  },
  pending: { 
    bg: 'bg-slate-100', 
    text: 'text-slate-600', 
    border: 'border-slate-200',
    icon: AlertCircle,
    label: 'Pending',
    color: 'slate',
    gradient: 'from-slate-500 to-gray-600'
  },
  blocked: { 
    bg: 'bg-rose-100', 
    text: 'text-rose-700', 
    border: 'border-rose-200',
    icon: AlertCircle,
    label: 'Blocked',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600'
  }
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse'
} as const;

const PHASES = [
  { name: 'Phase 1', range: [1, 6], color: 'emerald', desc: 'Core Platform', icon: Shield },
  { name: 'Phase 2', range: [7, 10], color: 'amber', desc: 'Hypemode', icon: TrendingUp },
  { name: 'Phase 3', range: [11, 14], color: 'indigo', desc: 'Seller', icon: CheckSquare },
  { name: 'Phase 4', range: [15, 17], color: 'violet', desc: 'Buyer', icon: User },
  { name: 'Phase 5-6', range: [18, 20], color: 'rose', desc: 'Advanced', icon: BarChart3 },
] as const;

// ==========================================
// ALL UTILITY COMPONENTS (StatusBadge, PriorityBadge, ProgressBar, StatCard, LoadingSpinner, EmptyState)
// ==========================================

const StatusBadge: React.FC<{ 
  status: TaskStatus; 
  showIcon?: boolean; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = React.memo(({ status, showIcon = true, size = 'sm', className = '' }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium border 
      ${config.bg} ${config.text} ${config.border} 
      ${sizeClasses[size]} ${className}
      transition-all duration-200 hover:shadow-sm
    `}>
      {showIcon && <Icon className={`${size === 'sm' ? 'w-3 h-3 mr-1' : size === 'md' ? 'w-4 h-4 mr-1.5' : 'w-5 h-5 mr-2'}`} />}
      {config.label}
    </span>
  );
});

const PriorityBadge: React.FC<{ 
  priority: Task['priority']; 
  size?: 'sm' | 'md';
}> = React.memo(({ priority, size = 'sm' }) => {
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-3 py-1 text-xs';
    
  return (
    <span className={`
      rounded-md font-bold border ${PRIORITY_COLORS[priority]} ${sizeClasses}
      transition-transform hover:scale-105
    `}>
      {priority.toUpperCase()}
    </span>
  );
});

const ProgressBar: React.FC<{ 
  current: number; 
  total: number; 
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}> = React.memo(({ current, total, color = 'indigo', size = 'sm', showLabel = true }) => {
  const percentage = useMemo(() => 
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0
  , [current, total]);
  
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className={`font-medium text-slate-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>Progress</span>
          <span className={`font-bold text-slate-800 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div 
          className={`bg-${color}-600 ${heightClasses[size]} rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
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
  onClick?: () => void;
}> = React.memo(({ title, value, subtitle, icon: Icon, color, trend, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      bg-white rounded-xl shadow-sm border border-slate-200 p-4 
      transition-all duration-200 hover:shadow-md hover:border-slate-300
      ${onClick ? 'cursor-pointer active:scale-95' : ''}
    `}
  >
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 mb-1 truncate">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1.5 font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
            {Math.abs(trend)}% from last week
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-50 flex-shrink-0 ml-3`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </div>
));

const LoadingSpinner: React.FC<{ text?: string; fullScreen?: boolean }> = ({ 
  text = "Loading...", 
  fullScreen = false 
}) => (
  <div className={`${fullScreen ? 'min-h-screen' : 'h-full min-h-[200px]'} bg-slate-50 flex items-center justify-center p-4`}>
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <div className="absolute inset-0 w-10 h-10 border-4 border-indigo-100 rounded-full" />
      </div>
      <p className="text-slate-600 font-medium text-sm text-center animate-pulse">{text}</p>
    </div>
  </div>
);

const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
      <Icon className="w-8 h-8 text-slate-300" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
    {action}
  </div>
);

// ==========================================
// VELOCITY WIDGET COMPONENT
// ==========================================

const VelocityWidget: React.FC = React.memo(() => {
  const data = [
    { day: 'M', completed: 2 },
    { day: 'T', completed: 3 },
    { day: 'W', completed: 1 },
    { day: 'T', completed: 4 },
    { day: 'F', completed: 2 },
    { day: 'S', completed: 3 },
    { day: 'S', completed: 1 },
  ];

  const maxVal = Math.max(...data.map(d => d.completed));
  const total = data.reduce((acc, d) => acc + d.completed, 0);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full -ml-12 -mb-12 blur-xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg">Velocity</h3>
            <p className="text-indigo-200 text-xs">Tasks completed per day</p>
          </div>
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
            <BarChart3 className="w-5 h-5 text-indigo-300" />
          </div>
        </div>
        
        <div className="flex items-end justify-between h-24 gap-2 mb-4">
          {data.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center flex-1 gap-2">
              <div 
                className="w-full bg-indigo-400/30 rounded-t-lg relative overflow-hidden transition-all duration-500 hover:bg-indigo-400/50"
                style={{ height: `${(item.completed / maxVal) * 100}%` }}
              >
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-400 to-indigo-300 transition-all duration-500" style={{ height: '100%' }} />
              </div>
              <span className="text-xs font-medium text-indigo-300">{item.day}</span>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
          <div>
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs text-indigo-300">This week</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-400 text-sm font-bold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +12%
            </p>
            <p className="text-xs text-indigo-400">vs last week</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// PASSWORD MODAL
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isLocked && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isLocked]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLocked && password) {
      onLogin(password);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            {isLocked ? <Lock className="w-7 h-7 text-white" /> : <Shield className="w-7 h-7 text-white" />}
          </div>
          <h3 className="text-2xl font-bold">{isLocked ? 'Access Locked' : 'Tester Access'}</h3>
          <p className="text-indigo-100 text-sm mt-2">
            {isLocked ? 'Too many failed attempts. Please wait.' : 'Enter your credentials to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLocked}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pr-12 text-base disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder={isLocked ? 'Account locked' : 'Enter password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3 animate-in slide-in-from-top-1">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLocked || !password}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-lg shadow-indigo-200"
          >
            <LogIn className="w-5 h-5" />
            {isLocked ? 'Locked' : attempts > 0 ? `Unlock (${3 - attempts} left)` : 'Unlock Access'}
          </button>

          {isLocked && (
            <p className="text-center text-sm text-rose-600 font-medium">
              Account locked. Please try again in 5 minutes.
            </p>
          )}
        </form>

        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Secure testing environment • Encrypted connection
          </p>
        </div>
      </div>
    </div>
  );
});

// ==========================================
// VIEW COMPONENTS (OverviewView, ClientView, TesterView)
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
        const hoursSinceUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
        return hoursSinceUpdate < 48;
      })
      .sort((a, b) => {
        const aTime = a.lastUpdated instanceof Date ? a.lastUpdated.getTime() : new Date(a.lastUpdated).getTime();
        const bTime = b.lastUpdated instanceof Date ? b.lastUpdated.getTime() : new Date(b.lastUpdated).getTime();
        return bTime - aTime;
      })
      .slice(0, 8)
  , [tasks]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {phaseProgress.map((phase) => (
          <button 
            key={phase.name} 
            onClick={() => {
              const firstTask = tasks.find(t => t.day >= phase.range[0] && t.day <= phase.range[1]);
              if (firstTask) onSelectTask(firstTask);
            }}
            className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all text-left relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1 h-full bg-${phase.color}-500`} />
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <phase.icon className={`w-4 h-4 text-${phase.color}-600`} />
                  <h3 className="font-bold text-slate-900">{phase.name}</h3>
                </div>
                <p className="text-xs text-slate-400">{phase.desc}</p>
              </div>
              <span className={`text-sm font-bold text-${phase.color}-600 bg-${phase.color}-50 px-3 py-1 rounded-lg`}>
                {phase.completed}/{phase.total}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`bg-${phase.color}-500 h-2 rounded-full transition-all duration-700 ease-out relative`}
                style={{ width: `${phase.progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{Math.round(phase.progress)}% complete</span>
              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-indigo-500" />
            Recent Updates
          </h3>
          <span className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live
          </span>
        </div>
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
          {recentUpdates.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No recent updates</p>
            </div>
          ) : (
            recentUpdates.map(task => (
              <button 
                key={task.id} 
                onClick={() => onSelectTask(task)}
                className="w-full px-5 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    task.status === 'completed' ? 'bg-emerald-500' : 
                    task.status === 'in-progress' ? 'bg-amber-500' : 
                    task.status === 'blocked' ? 'bg-rose-500' : 'bg-slate-300'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      Day {task.day}: {task.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{task.module} • {task.category}</p>
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

  if (tasks.length === 0) {
    return (
      <EmptyState 
        icon={CheckSquare}
        title="No tasks found"
        description="Try adjusting your filters to see more results."
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <ProgressBar 
          current={progress.completed} 
          total={progress.total} 
          color="emerald"
          size="md"
        />
      </div>
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {tasks.map((task) => (
          <button 
            key={task.id} 
            onClick={() => onSelectTask(task)}
            className="w-full p-5 hover:bg-slate-50 active:bg-slate-100 transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm flex-shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  {task.day}
                </div>
                <div className="min-w-0">
                  <h4 className={`font-semibold ${task.status === 'pending' ? 'text-slate-500' : 'text-slate-900'} truncate group-hover:text-indigo-600 transition-colors`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-400 font-medium">{task.module}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-xs text-slate-400">{task.estimatedHours}h estimated</span>
                    {task.actualHours && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-xs text-emerald-600 font-medium">{task.actualHours}h actual</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                      @{task.assignedTo}
                    </span>
                    <div className="flex gap-1">
                      {task.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={task.status} showIcon={false} />
                <PriorityBadge priority={task.priority} />
              </div>
            </div>
            {task.findings && (
              <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-2">
                <span className="font-medium text-emerald-700">Findings: </span>
                {task.findings}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

const TesterView: React.FC<{
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>;
  onSelectTask: (t: Task) => void;
  updating: string | null;
}> = React.memo(({ tasks, onUpdateStatus, onSelectTask, updating }) => {
  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    if (updating === taskId) return;
    await onUpdateStatus(taskId, newStatus);
  }, [onUpdateStatus, updating]);

  if (tasks.length === 0) {
    return (
      <EmptyState 
        icon={CheckSquare}
        title="No tasks available"
        description="All tasks have been filtered out or none exist yet."
      />
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
            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button 
                onClick={() => onSelectTask(task)}
                className="flex items-start gap-4 flex-1 text-left min-w-0 group"
              >
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${statusConfig.bg} ${statusConfig.text} group-hover:scale-110 transition-transform`}>
                  <statusConfig.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">Day {task.day}</span>
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs text-slate-400">{task.estimatedHours}h</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {task.title}
                  </h4>
                  <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
                  <span className="text-xs text-indigo-600 font-semibold mt-1 inline-block">@{task.assignedTo}</span>
                </div>
              </button>
              
              <div className="flex items-center gap-3 sm:flex-shrink-0">
                <select
                  value={task.status}
                  disabled={isUpdating}
                  onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                  className={`
                    px-4 py-2.5 text-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold disabled:opacity-50 cursor-pointer min-w-[140px]
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
                  <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
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
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>;
  isTesterAuthenticated: boolean;
  updating: boolean;
  onClose: () => void;
}> = React.memo(({ task, onUpdateStatus, isTesterAuthenticated, updating, onClose }) => {
  const [localUpdating, setLocalUpdating] = useState(false);
  
  const lastUpdated = useMemo(() => 
    task.lastUpdated instanceof Date ? task.lastUpdated : new Date(task.lastUpdated)
  , [task.lastUpdated]);

  const handleStatusClick = useCallback(async (status: TaskStatus) => {
    if (!isTesterAuthenticated || updating || localUpdating) return;
    setLocalUpdating(true);
    try {
      await onUpdateStatus(task.id, status);
    } finally {
      setLocalUpdating(false);
    }
  }, [isTesterAuthenticated, updating, localUpdating, onUpdateStatus, task.id]);

  const isUpdating = updating || localUpdating;

  return (
    <div className="p-5 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
            Day {task.day}
          </span>
          <PriorityBadge priority={task.priority} size="md" />
          <StatusBadge status={task.status} size="sm" />
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors lg:hidden"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-3">{task.title}</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{task.module}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>{task.category}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {task.estimatedHours}h estimated
          </span>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
            {task.assignedTo?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-indigo-600">@{task.assignedTo}</span>
        </div>
      </div>

      {isTesterAuthenticated ? (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 block">
            Update Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['pending', 'in-progress', 'completed', 'blocked'] as const).map((status) => {
              const config = STATUS_CONFIG[status];
              const isActive = task.status === status;
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusClick(status)}
                  disabled={isUpdating}
                  className={`
                    relative px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden
                    ${isActive 
                      ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg` 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}
                  `}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-white/20" />
                  )}
                  <config.icon className={`w-4 h-4 ${isActive ? 'text-white' : `text-${config.color}-500`}`} />
                  {config.label}
                </button>
              );
            })}
          </div>
          {isUpdating && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-indigo-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Updating...
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Lock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-900">Tester access required</p>
            <p className="text-sm text-amber-700">Authenticate to update task status</p>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <MoreHorizontal className="w-4 h-4" />
          Description
        </h4>
        <p className="text-sm sm:text-base text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
          {task.description}
        </p>
      </div>
      
      {task.findings && (
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Findings
          </h4>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
            <p className="text-sm sm:text-base text-emerald-800 leading-relaxed">{task.findings}</p>
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-slate-100 space-y-3 text-sm">
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 flex items-center gap-2">
            <User className="w-4 h-4" /> Assigned to
          </span>
          <span className="font-semibold text-slate-900">{task.assignedTo}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 flex items-center gap-2">
            <Timer className="w-4 h-4" /> Time tracking
          </span>
          <span className="font-semibold text-slate-900">
            <span className={task.actualHours ? 'text-emerald-600' : 'text-slate-400'}>
              {task.actualHours || 0}h
            </span>
            <span className="text-slate-400 mx-1">/</span>
            {task.estimatedHours}h
          </span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Last updated
          </span>
          <span className="font-semibold text-slate-900 text-xs sm:text-sm">
            {lastUpdated.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {task.tags.map(tag => (
          <span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {tag}
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
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>;
  isTesterAuthenticated: boolean;
  updating: boolean;
}> = ({ task, isOpen, onClose, ...props }) => {
  if (!task || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={task.status} size="md" />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl mt-2">
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
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>;
  isTesterAuthenticated: boolean;
  updating: boolean;
}> = ({ task, onClose, ...props }) => {
  if (!task) return (
    <EmptyState 
      icon={LayoutDashboard}
      title="No Task Selected"
      description="Select a task from the list to view details and update status."
    />
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hidden lg:block">
      <TaskDetailContent task={task} onClose={onClose} {...props} />
    </div>
  );
};

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================

type TabType = 'overview' | 'client' | 'tester';

export const DashboardMain: React.FC = () => {
  const { 
    tasks, 
    loading, 
    lastSync, 
    error, 
    updateStatus, 
    stats, 
    refresh 
  } = useRealtimeTasks();
  
  const testerAuth = useTesterAuth();
  const { 
    filteredTasks, 
    filterStatus, 
    setFilterStatus, 
    searchQuery, 
    setSearchQuery, 
    clearFilters 
  } = useTaskFilter(tasks);
  
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

  const handleStatusUpdate = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    setUpdatingTask(taskId);
    try {
      await updateStatus(taskId, newStatus);
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
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
    { 
      id: 'tester' as const, 
      label: 'Tester', 
      icon: testerAuth.isAuthenticated ? CheckCircle : Lock, 
      locked: !testerAuth.isAuthenticated 
    },
  ], [testerAuth.isAuthenticated]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return <LoadingSpinner text="Connecting to Firestore..." fullScreen />;
  
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-rose-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Connection Error</h3>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">{error}</p>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors text-sm font-semibold"
            >
              Retry
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm font-semibold"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
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

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
                        
                          <img
  src={wecinemaLogo}
  alt="WeCinema"
  className="w-10 h-10 object-contain"
/>
         
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                  wecinema.co
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block font-medium">Testing Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lastSync && (
                <span className="hidden md:block text-xs text-slate-400 font-medium mr-2">
                  Synced {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className={`
                  p-2.5 rounded-xl transition-all relative
                  ${isSyncing ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'}
                `}
                aria-label="Sync data"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>

              <button className="relative p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              </button>

              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                HM
              </div>

              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 absolute w-full shadow-xl animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.id === 'tester' ? handleTesterTabClick() : handleTabClick(tab.id)}
                  className={`
                    px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-all
                    ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <span className="flex items-center gap-3">
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </span>
                  {tab.locked && <Lock className="w-4 h-4 text-slate-400" />}
                  {tab.id === 'tester' && testerAuth.isAuthenticated && (
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:hidden mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks by title, module, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => tab.id === 'tester' ? handleTesterTabClick() : handleTabClick(tab.id)}
                    className={`
                      flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                      ${activeTab === tab.id 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}
                    `}
                  >
                    {tab.label}
                    {tab.locked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    {tab.id === 'tester' && testerAuth.isAuthenticated && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto px-2">
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
                    className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer font-semibold text-slate-700 min-w-[120px]"
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
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    aria-label="Clear filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                {activeTab === 'overview' && <LayoutDashboard className="w-5 h-5 text-indigo-500" />}
                {activeTab === 'client' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {activeTab === 'tester' && (testerAuth.isAuthenticated ? 
                  <CheckCircle className="w-5 h-5 text-indigo-500" /> : 
                  <Lock className="w-5 h-5 text-rose-500" />
                )}
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <div className="flex items-center gap-2">
                {activeTab === 'tester' && !testerAuth.isAuthenticated && (
                  <span className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-lg">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </span>
                )}
                {testerAuth.isAuthenticated && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5" /> Unlocked
                  </span>
                )}
              </div>
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'overview' && (
                <OverviewView stats={stats} tasks={filteredTasks} onSelectTask={handleTaskSelect} />
              )}
              {activeTab === 'client' && (
                <ClientView tasks={filteredTasks} onSelectTask={handleTaskSelect} />
              )}
              {activeTab === 'tester' && (
                !testerAuth.isAuthenticated ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Lock className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Tester Access Required</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                      Enter your credentials to access the testing interface and update task statuses in real-time.
                    </p>
                    <button
                      onClick={testerAuth.openLoginModal}
                      disabled={testerAuth.isLocked}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 mx-auto shadow-lg shadow-indigo-200"
                    >
                      <LogIn className="w-5 h-5" />
                      {testerAuth.isLocked ? 'Account Locked' : 'Enter Password'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900">Access Granted</p>
                          <p className="text-sm text-emerald-700">Changes are saved to Firestore in real-time</p>
                        </div>
                      </div>
                      <button
                        onClick={testerAuth.logout}
                        className="text-sm text-emerald-700 hover:text-emerald-900 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
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

          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <DesktopTaskPanel
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdateStatus={handleStatusUpdate}
                isTesterAuthenticated={testerAuth.isAuthenticated}
                updating={updatingTask === selectedTask?.id}
              />
              <VelocityWidget />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardMain;