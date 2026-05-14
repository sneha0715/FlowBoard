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
  Users,
  Grid,
  CheckSquare,
  Briefcase,
  Sun,
  Moon,
  PanelLeft,
  ChevronUp,
  FolderKanban,
  User2,
  LayoutGrid,
  Box,
  Layers,
  Pencil,
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

export default function AppShell({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const { theme, setTheme } = useTheme();

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [workspaces, setWorkspaces] = useState([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState({});

  const isAdmin = isPlatformAdmin(user);

  useEffect(() => {
    if (!user?.userId) return;
    notificationApi.unreadCount(user.userId).then(setUnreadCount).catch(() => { });
    workspaceApi.byMember(user.userId).then(setWorkspaces).catch(() => { });
  }, [user?.userId, location]);

  // Sync expanded state with active workspace
  useEffect(() => {
    const activeWsId = workspaces.find(ws => location.pathname.includes(`/workspaces/${ws.workspaceId}`))?.workspaceId;
    if (activeWsId && expandedWorkspaces[activeWsId] === undefined) {
      setExpandedWorkspaces(prev => ({ ...prev, [activeWsId]: true }));
    }
  }, [location.pathname, workspaces]);

  const toggleWorkspace = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedWorkspaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isBoardAdmin = useSelector((state) => state.board.userRole === "ADMIN");

  const activeBoard = useSelector((state) => state.board.activeBoard);
  const activeCard = useSelector((state) => state.board.activeCard);
  const activeWorkspace = useSelector((state) => state.workspace.activeWorkspace);

  const toTitleCase = (str) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const crumbs = [];

    // Dashboard check
    if (paths.length === 0) return [];

    // Workspace path: /workspaces/:id
    if (paths[0] === 'workspaces' && paths[1]) {
      const wsId = paths[1];
      const ws = workspaces.find(w => String(w.workspaceId) === wsId) || activeWorkspace;
      if (ws) {
        crumbs.push({ 
          name: toTitleCase(ws.name), 
          path: `/workspaces/${ws.workspaceId}`,
          icon: <Layers size={12} strokeWidth={3} className="text-white" />
        });
      }
    }

    // Board path: /boards/:id
    if (paths[0] === 'boards' && paths[1]) {
      const isRegistry = paths[2] === 'registry' && paths[3];
      
      if (activeBoard) {
        // Find parent workspace
        const ws = workspaces.find(w => w.workspaceId === activeBoard.workspaceId) || activeWorkspace;
        if (ws) {
          crumbs.push({ 
            name: toTitleCase(ws.name), 
            path: `/workspaces/${ws.workspaceId}`,
            icon: <Layers size={12} strokeWidth={3} className="text-white" />
          });
        }
        crumbs.push({ 
          name: toTitleCase(activeBoard.name), 
          path: `/boards/${activeBoard.boardId}`,
          icon: <Box size={12} strokeWidth={3} className="text-white" />
        });

        if (isRegistry && activeCard) {
          crumbs.push({
            name: activeCard.title,
            path: location.pathname,
            icon: <CheckSquare size={12} strokeWidth={3} className="text-white" />
          });
        }
      } else {
        // Fallback if board not loaded yet
        crumbs.push({ name: "Boards", path: "/", icon: <Box size={12} strokeWidth={3} className="text-white" /> });
        crumbs.push({ name: "...", path: `/boards/${paths[1]}`, icon: <Box size={12} strokeWidth={3} className="text-white" /> });
        
        if (isRegistry && activeCard) {
           crumbs.push({
            name: activeCard.title,
            path: location.pathname,
            icon: <CheckSquare size={12} strokeWidth={3} className="text-white" />
          });
        }
      }
    }

    // Other paths
    if (crumbs.length === 0 && paths.length > 0) {
      paths.forEach((p, i) => {
        crumbs.push({ 
          name: toTitleCase(p.replace(/-/g, ' ')), 
          path: '/' + paths.slice(0, i + 1).join('/'),
          icon: <Box size={12} strokeWidth={3} className="text-white" />
        });
      });
    }

    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      {/* Fluid Responsive Sidebar - Stone Design */}
      <Sidebar variant="floating" collapsible="icon" className="border-none bg-transparent">
        <SidebarHeader className="p-4 flex flex-col items-center gap-3 bg-transparent">
          <div className="flex items-center justify-between w-full px-2 group-data-[collapsible=icon]:justify-center">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div className="w-10 h-10 rounded-xl group-data-[collapsible=icon]:rounded-full bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-primary/20 shrink-0 transition-transform hover:scale-105">
                <Layout className="text-primary" size={22} />
              </div>
              <span className="text-lg font-black tracking-tighter text-foreground group-data-[collapsible=icon]:hidden">FlowBoard</span>
            </Link>
            <SidebarTrigger className="h-7 w-7 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all border border-border/50 group-data-[collapsible=icon]:hidden" />
          </div>
          <div className="group-data-[collapsible=icon]:block hidden">
            <SidebarTrigger className="h-7 w-7 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all border border-border/50" />
          </div>
        </SidebarHeader>

        <SidebarContent className="no-scrollbar overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] px-4 mb-2">Main Navigation</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/'}
                  tooltip="Dashboard"
                  className="h-10 w-full rounded-full group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto px-3 data-[active=true]:bg-primary/10 data-[active=true]:text-primary transition-all flex items-center justify-start"
                >
                  <Link to="/">
                    <Grid size={18} className="shrink-0" />
                    <span className="font-bold text-[13px] group-data-[collapsible=icon]:hidden ml-2">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/tasks'}
                  tooltip="My Tasks"
                  className="h-10 w-full rounded-full group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto px-3 data-[active=true]:bg-primary/10 data-[active=true]:text-primary transition-all flex items-center justify-start"
                >
                  <Link to="/tasks">
                    <CheckSquare size={18} className="shrink-0" />
                    <span className="font-bold text-[13px] group-data-[collapsible=icon]:hidden ml-2">My Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] px-4 mb-2">Workspace Hub</SidebarGroupLabel>
            <SidebarMenu>
              {workspaces.map(ws => {
                const isActive = location.pathname.includes(`/workspaces/${ws.workspaceId}`);
                const isExpanded = expandedWorkspaces[ws.workspaceId];
                return (
                  <SidebarMenuItem key={ws.workspaceId}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={ws.name}
                      className="h-10 w-full rounded-full group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto px-3 data-[active=true]:bg-primary/10 data-[active=true]:text-primary transition-all flex items-center justify-start"
                    >
                      <Link to={`/workspaces/${ws.workspaceId}`}>
                        <Briefcase size={18} className="shrink-0" />
                        <span className="font-bold text-[13px] truncate group-data-[collapsible=icon]:hidden ml-2 capitalize">{ws.name}</span>
                        <ChevronDown size={12} className={`ml-auto transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'} group-data-[collapsible=icon]:hidden text-primary/50`} onClick={(e) => toggleWorkspace(e, ws.workspaceId)} />
                      </Link>
                    </SidebarMenuButton>

                    <AnimatePresence>
                      {isExpanded && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={!location.search || location.search.includes('tab=boards')} className="h-8 text-[11px] font-bold">
                              <Link to={`/workspaces/${ws.workspaceId}?tab=boards`}>
                                <FolderKanban size={13} /> <span>Boards</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={location.search.includes('tab=members')} className="h-8 text-[11px] font-bold">
                              <Link to={`/workspaces/${ws.workspaceId}?tab=members`}>
                                <Users size={13} /> <span>Members</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={location.search.includes('tab=settings')} className="h-8 text-[11px] font-bold">
                              <Link to={`/workspaces/${ws.workspaceId}?tab=settings`}>
                                <Settings size={13} /> <span>Settings</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </AnimatePresence>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton
                  tooltip="Create Workspace"
                  className="h-10 w-full rounded-full group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto px-3 hover:bg-primary/10 transition-all flex items-center justify-start text-muted-foreground"
                >
                  <Plus size={18} className="shrink-0" />
                  <span className="font-bold text-[13px] group-data-[collapsible=icon]:hidden ml-2">New Project</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {isAdmin && (
            <SidebarGroup className="mt-auto">
              <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] px-4 mb-2">System Admin</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/admin'} tooltip="Admin Panel">
                    <Link to="/admin">
                      <Settings size={18} />
                      <span className="font-bold">Admin Console</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/50 bg-transparent">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="sm"
                className="bg-muted/10 hover:bg-muted/20 transition-all rounded-full h-11 px-3 border-none group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto flex items-center justify-center"
              >
                <Link to="/profile" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center w-full">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 ring-1 ring-primary/20 group-data-[collapsible=icon]:mx-auto">
                    <User2 size={14} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-start truncate group-data-[collapsible=icon]:hidden">
                    <span className="text-[12px] font-black truncate text-foreground leading-none">{user?.fullName || 'User'}</span>
                    <span className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">{user?.email}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden transition-all duration-300">
        {/* Subtle Background Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] pointer-events-none rounded-full" />

        <header className="h-14 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 transition-all bg-transparent border-none">
          <div className="flex items-center gap-4">
            {/* Modern Breadcrumbs */}
            <nav className="flex items-center gap-3 text-[11px] font-black tracking-widest text-violet-500">
              <Link to="/" className="flex items-center gap-1.5 hover:text-violet-400 transition-colors">
                <Home size={12} strokeWidth={3} className="text-violet-500" />
                <span>Hub</span>
              </Link>
              {crumbs.map((crumb, i) => (
                <div key={crumb.path + i} className="flex items-center gap-3">
                  <ChevronRight size={10} className="text-violet-500 opacity-80" strokeWidth={4} />
                  <Link 
                    to={crumb.path}
                    className="flex items-center gap-1.5 hover:text-violet-400 transition-all cursor-pointer no-underline"
                  >
                    {crumb.icon}
                    <span className="truncate max-w-[200px]">
                      {crumb.name}
                    </span>
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </Button>

            <div className="w-px h-3 bg-border/50 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-xl gap-2 font-black uppercase tracking-widest text-[9px] text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
              onClick={handleLogout}
            >
              <LogOut size={12} className="text-red-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>

            <div className="w-px h-3 bg-border/50 mx-1" />

            <Button
              variant="outline"
              size="icon"
              className="rounded-xl relative h-8 w-8 border-border/50 bg-background/50 hover:bg-accent transition-all"
              onClick={() => setNotifOpen(true)}
            >
              <Bell size={14} className="text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background animate-pulse" />
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 px-6 lg:px-8 pb-8 pt-2 overflow-y-auto no-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </SidebarInset>

      {notifOpen && (
        <NotificationsDrawer
          onClose={() => {
            setNotifOpen(false);
            if (user?.userId) notificationApi.unreadCount(user.userId).then(setUnreadCount);
          }}
        />
      )}
    </SidebarProvider>
  );
}
