import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Download,
  MessageSquare,
  Bell,
  User,
  BarChart3,
  FileSpreadsheet,
  Briefcase,
  ArrowUpRight,
  Menu,
  X,
  Home,
  Loader2,
} from 'lucide-react';

// Types
interface UserData {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// API URL
const API_URL = import.meta.env?.PROD
  ? 'https://api.jasperfinance.org'
  : 'http://localhost:3001';

// Auth hook
function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          // Not authenticated, redirect to login
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const logout = () => {
    window.location.href = `${API_URL}/auth/logout`;
  };

  return { user, loading, logout };
}

// Navigation Component
function Navbar({ user }: { user: UserData | null }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-navy/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <img
                src="/images/jasper-icon.png"
                alt="JASPER"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if image doesn't load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-lg tracking-tight">JASPER</span>
              <span className="text-brand-muted text-[10px] -mt-1 tracking-widest">PORTAL</span>
            </div>
          </a>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-brand-muted hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-emerald rounded-full" />
            </button>
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-surface flex items-center justify-center">
                <User className="w-4 h-4 text-brand-muted" />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Sidebar Component
function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'My Projects', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 bottom-0 w-64 bg-brand-navy border-r border-white/5 z-40
        transform transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${activeTab === item.id
                  ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
                  : 'text-brand-muted hover:text-white hover:bg-white/5'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <a
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-brand-muted hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Back to Site</span>
          </a>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// Stats Card Component
function StatCard({ title, value, change, icon: Icon, color }: {
  title: string;
  value: string;
  change?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-dark/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-brand-muted text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className="text-brand-emerald text-sm mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// Project Card Component
function ProjectCard({ project }: { project: any }) {
  const statusColors = {
    'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Under Review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Completed': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Pending': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const statusIcons = {
    'In Progress': Clock,
    'Under Review': AlertCircle,
    'Completed': CheckCircle2,
    'Pending': Clock,
  };

  const StatusIcon = statusIcons[project.status as keyof typeof statusIcons] || Clock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-brand-dark/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-brand-emerald/30 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-brand-emerald" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{project.name}</h3>
            <p className="text-brand-muted text-sm">{project.type}</p>
          </div>
        </div>
        <ArrowUpRight className="w-5 h-5 text-brand-muted group-hover:text-brand-emerald transition-colors" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-brand-muted">Progress</span>
          <span className="text-white">{project.progress}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-brand-emerald to-brand-glow"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[project.status as keyof typeof statusColors]}`}>
          <StatusIcon className="w-3 h-3 inline mr-1" />
          {project.status}
        </span>
        <span className="text-brand-muted text-sm flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {project.dueDate}
        </span>
      </div>
    </motion.div>
  );
}

// Document Item Component
function DocumentItem({ doc }: { doc: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-emerald/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-brand-emerald" />
        </div>
        <div>
          <p className="text-white font-medium">{doc.name}</p>
          <p className="text-brand-muted text-sm">{doc.size} • {doc.date}</p>
        </div>
      </div>
      <button className="p-2 text-brand-muted hover:text-brand-emerald transition-colors opacity-0 group-hover:opacity-100">
        <Download className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: any }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <div className={`w-2 h-2 rounded-full mt-2 ${activity.color}`} />
      <div>
        <p className="text-white text-sm">{activity.message}</p>
        <p className="text-brand-muted text-xs mt-1">{activity.time}</p>
      </div>
    </div>
  );
}

// Dashboard Content
function DashboardContent({ userName }: { userName?: string }) {
  const stats = [
    { title: 'Active Projects', value: '3', change: '+1 this month', icon: Briefcase, color: 'bg-brand-emerald' },
    { title: 'Documents', value: '12', icon: FileText, color: 'bg-blue-500' },
    { title: 'Messages', value: '5', icon: MessageSquare, color: 'bg-purple-500' },
    { title: 'Completion Rate', value: '87%', change: '+12%', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const recentActivity = [
    { message: 'Financial model draft completed for Series A project', time: '2 hours ago', color: 'bg-green-400' },
    { message: 'New comment on Solar Farm feasibility study', time: '5 hours ago', color: 'bg-blue-400' },
    { message: 'Document uploaded: Revenue projections v2.xlsx', time: 'Yesterday', color: 'bg-purple-400' },
    { message: 'Project milestone achieved: Phase 1 complete', time: '2 days ago', color: 'bg-brand-emerald' },
  ];

  // Get first name only
  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}</h1>
        <p className="text-brand-muted mt-1">Here's what's happening with your projects</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-brand-dark/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <button className="text-brand-emerald text-sm hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-brand-dark/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl text-brand-emerald hover:bg-brand-emerald/20 transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span>Send Message</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors">
              <FileText className="w-5 h-5" />
              <span>Upload Document</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors">
              <Calendar className="w-5 h-5" />
              <span>Schedule Meeting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Projects Content
function ProjectsContent() {
  const projects = [
    {
      name: 'Solar Farm Feasibility',
      type: 'Infrastructure Model',
      status: 'In Progress',
      progress: 65,
      dueDate: '15 Dec 2025',
    },
    {
      name: 'Series A Financial Model',
      type: 'Startup Valuation',
      status: 'Under Review',
      progress: 90,
      dueDate: '20 Dec 2025',
    },
    {
      name: 'Agri-Processing Plant',
      type: 'Project Finance',
      status: 'Pending',
      progress: 15,
      dueDate: '10 Jan 2026',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Projects</h1>
          <p className="text-brand-muted mt-1">Track and manage your financial models</p>
        </div>
        <a
          href="/contact"
          className="px-4 py-2 bg-brand-emerald text-white rounded-xl font-medium hover:bg-brand-emerald/90 transition-colors flex items-center gap-2"
        >
          <span>New Project</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </div>
  );
}

// Documents Content
function DocumentsContent() {
  const documents = [
    { name: 'Solar Farm Model v3.xlsx', size: '2.4 MB', date: '5 Dec 2025' },
    { name: 'Series A Projections.pdf', size: '1.1 MB', date: '3 Dec 2025' },
    { name: 'Due Diligence Checklist.docx', size: '245 KB', date: '1 Dec 2025' },
    { name: 'Market Analysis Report.pdf', size: '3.8 MB', date: '28 Nov 2025' },
    { name: 'Financial Assumptions.xlsx', size: '890 KB', date: '25 Nov 2025' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-brand-muted mt-1">Access and download your project files</p>
        </div>
        <button className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>Download All</span>
        </button>
      </div>

      <div className="bg-brand-dark/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <DocumentItem key={doc.name} doc={doc} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Analytics Content
function AnalyticsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-brand-muted mt-1">Insights and performance metrics</p>
      </div>

      <div className="bg-brand-dark/50 backdrop-blur-sm border border-white/5 rounded-2xl p-8 text-center">
        <BarChart3 className="w-16 h-16 text-brand-muted mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Analytics Coming Soon</h3>
        <p className="text-brand-muted max-w-md mx-auto">
          We're building powerful analytics to help you track ROI, compare scenarios, and make data-driven decisions.
        </p>
      </div>
    </div>
  );
}

// Settings Content
function SettingsContent({ user }: { user: UserData | null }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-brand-muted mt-1">Manage your account preferences</p>
      </div>

      <div className="bg-brand-dark/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-brand-emerald/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-surface flex items-center justify-center">
                <User className="w-8 h-8 text-brand-muted" />
              </div>
            )}
            <div>
              <p className="text-white font-medium">{user?.name || 'User'}</p>
              <p className="text-brand-muted text-sm">{user?.email || 'No email'}</p>
            </div>
          </div>
          <div>
            <label className="block text-brand-muted text-sm mb-2">Full Name</label>
            <input
              type="text"
              defaultValue={user?.name || ''}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-emerald focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-brand-muted text-sm mb-2">Email</label>
            <input
              type="email"
              defaultValue={user?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 cursor-not-allowed"
            />
            <p className="text-brand-muted text-xs mt-1">Email is managed by Google</p>
          </div>
          <div>
            <label className="block text-brand-muted text-sm mb-2">Company</label>
            <input
              type="text"
              placeholder="Your company name"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-emerald focus:outline-none"
            />
          </div>
          <button className="px-6 py-3 bg-brand-emerald text-white rounded-xl font-medium hover:bg-brand-emerald/90 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Portal Page
export default function PortalPage() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-navy flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-emerald animate-spin mx-auto mb-4" />
          <p className="text-brand-muted">Loading your portal...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent userName={user?.name} />;
      case 'projects':
        return <ProjectsContent />;
      case 'documents':
        return <DocumentsContent />;
      case 'analytics':
        return <AnalyticsContent />;
      case 'settings':
        return <SettingsContent user={user} />;
      default:
        return <DashboardContent userName={user?.name} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy">
      <Navbar user={user} />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={logout}
      />

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 z-50 lg:hidden w-14 h-14 bg-brand-emerald rounded-full flex items-center justify-center shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Main content */}
      <main className="pt-16 lg:pl-64">
        <div className="p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
