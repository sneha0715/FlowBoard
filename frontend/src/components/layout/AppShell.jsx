import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronRight,
  Layout,
  LogOut,
  Settings,
  User,
  Search,
  Plus,
  Home,
  ChevronDown,
  Calendar,
  Users,
  Grid,
  CheckSquare,
  Briefcase,
  Sun,
  Moon
} from "lucide-react";
import { logout } from "../../store/slices/authSlice";
import NotificationsDrawer from "./NotificationsDrawer";
import { notificationApi, workspaceApi } from "../../api/services";
import { isPlatformAdmin } from "../../utils/roles";
import { useTheme } from "../theme-provider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AppShell({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const { theme, setTheme } = useTheme();
  
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [workspaces, setWorkspaces] = useState([]);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  const isAdmin = isPlatformAdmin(user);

  useEffect(() => {
    if (!user?.userId) return;
    notificationApi.unreadCount(user.userId).then(setUnreadCount).catch(() => {});
    workspaceApi.byMember(user.userId).then(setWorkspaces).catch(() => {});
  }, [user?.userId, location]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const breadcrumbs = location.pathname.split('/').filter(Boolean);

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-72 bg-card border-r border-border flex flex-col sticky top-0 h-screen z-50">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Layout className="text-primary-foreground" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-card-foreground">FlowBoard</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <SidebarItem to="/" icon={Grid} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/tasks" icon={CheckSquare} label="My Tasks" active={location.pathname === '/tasks'} />
          
          <div className="pt-4">
            <button 
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-3">
                <Briefcase size={18} />
                <span className="text-sm font-semibold">Projects</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isProjectsOpen ? '' : '-rotate-90'}`} />
            </button>
            
            <AnimatePresence>
              {isProjectsOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-1 ml-4 border-l border-border space-y-1 overflow-hidden"
                >
                  {workspaces.map(ws => (
                    <Link
                      key={ws.workspaceId}
                      to={`/workspaces/${ws.workspaceId}`}
                      className={`flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${location.pathname.includes(`/workspaces/${ws.workspaceId}`) ? 'text-foreground bg-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="truncate">{ws.name}</span>
                    </Link>
                  ))}
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground h-9 px-4 mt-1">
                    <Plus size={14} className="mr-2" />
                    New Project
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <SidebarItem to="/calendar" icon={Calendar} label="Calendar" active={location.pathname === '/calendar'} />
          <SidebarItem to="/team" icon={Users} label="Team" active={location.pathname === '/team'} />
          {isAdmin && <SidebarItem to="/admin" icon={Settings} label="Admin" active={location.pathname === '/admin'} />}
        </nav>

        <div className="p-6 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full h-14 justify-start px-2 hover:bg-accent">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName}`} />
                    <AvatarFallback>{user?.fullName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start truncate">
                    <span className="text-sm font-semibold truncate max-w-[120px]">{user?.fullName || 'User'}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email || 'user@example.com'}</span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>Toggle Theme</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-10 sticky top-0 z-40">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
            <Home size={16} />
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb} className="flex items-center gap-3">
                <ChevronRight size={14} className="opacity-50" />
                <span className={`capitalize ${i === breadcrumbs.length - 1 ? 'text-foreground font-bold' : ''}`}>
                  {crumb.replace(/-/g, ' ')}
                </span>
              </div>
            ))}
            {breadcrumbs.length === 0 && (
               <div className="flex items-center gap-3">
                <ChevronRight size={14} className="opacity-50" />
                <span className="text-foreground font-bold">Dashboard</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                placeholder="Search anything..." 
                className="w-72 h-10 pl-10 rounded-full bg-accent/50 border-transparent focus:bg-background"
              />
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="rounded-full relative"
              onClick={() => setNotifOpen(true)}
            >
              <Bell size={18} className="text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-destructive rounded-full border-2 border-background" />
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-10 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {notifOpen && (
        <NotificationsDrawer
          onClose={() => {
            setNotifOpen(false);
            if (user?.userId) notificationApi.unreadCount(user.userId).then(setUnreadCount);
          }}
        />
      )}
    </div>
  );
}

function SidebarItem({ to, icon: Icon, label, active }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
        active 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}
