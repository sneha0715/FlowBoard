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
  Globe,
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

  useEffect(() => {
    if (!user?.userId) return;
    notificationApi.unreadCount(user.userId).then(setUnreadCount).catch(() => { });
    workspaceApi.byMember(user.userId).then(setWorkspaces).catch(() => { });
  }, [user?.userId, location]);

  useEffect(() => {
    const activeWsId = workspaces.find(ws => location.pathname.includes(`/workspaces/${ws.workspaceId}`))?.workspaceId;
    if (activeWsId && expandedWorkspaces[activeWsId] === undefined) {
      setExpandedWorkspaces(prev => ({ ...prev, [activeWsId]: true }));
    }
  }, [location.pathname, workspaces]);

  const toggleWorkspace = (id) => {
    setExpandedWorkspaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

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
    if (paths.length === 0) return [];

    if (paths[0] === 'workspaces' && paths[1]) {
      const wsId = paths[1];
      const ws = workspaces.find(w => String(w.workspaceId) === wsId) || activeWorkspace;
      if (ws) {
        crumbs.push({
          name: toTitleCase(ws.name),
          path: `/workspaces/${ws.workspaceId}`,
          icon: <Layers size={12} strokeWidth={2.5} />
        });
      }
    }

    if (paths[0] === 'boards' && paths[1]) {
      const isRegistry = paths[2] === 'registry' && paths[3];
      if (activeBoard) {
        const ws = workspaces.find(w => w.workspaceId === activeBoard.workspaceId) || activeWorkspace;
        if (ws) {
          crumbs.push({
            name: toTitleCase(ws.name),
            path: `/workspaces/${ws.workspaceId}`,
            icon: <Layers size={12} strokeWidth={2.5} />
          });
        }
        crumbs.push({
          name: toTitleCase(activeBoard.name),
          path: `/boards/${activeBoard.boardId}`,
          icon: <LayoutGrid size={12} strokeWidth={2.5} />
        });
        if (isRegistry && activeCard) {
          crumbs.push({
            name: activeCard.title,
            path: location.pathname,
            icon: <CheckSquare size={12} strokeWidth={2.5} />
          });
        }
      }
    }
    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      <Sidebar variant="floating" collapsible="icon" className="border-none bg-transparent pt-4">
        <SidebarHeader className="px-5 mb-8 flex flex-row items-center justify-between group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <Link to="/" className="flex items-center gap-3.5 no-underline group-data-[collapsible=icon]:hidden transition-all">
            <div className="w-8 h-8 rounded-xl bg-[#A29BFE]/20 flex items-center justify-center shrink-0 border border-[#A29BFE]/30 shadow-[0_0_15px_rgba(162,155,254,0.1)] transition-transform active:scale-95">
              <Box className="text-[#A29BFE]" size={18} strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-foreground">FlowBoard</span>
          </Link>
          <SidebarTrigger className="h-8 w-8 rounded-xl hover:bg-secondary transition-all opacity-40 hover:opacity-100" />
        </SidebarHeader>

        <SidebarContent className="px-3 space-y-6">
          <SidebarGroup className="p-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/'}
                  tooltip="Global"
                  className="h-10 px-3.5 rounded-xl data-[active=true]:bg-secondary/50 data-[active=true]:text-foreground transition-all duration-200"
                >
                  <Link to="/" className="flex items-center gap-3">
                    <Globe size={18} strokeWidth={2} className="shrink-0 opacity-70" />
                    <span className="font-medium text-[13px] group-data-[collapsible=icon]:hidden">Global Workspaces</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/my-workspaces'}
                  tooltip="My Workspaces"
                  className="h-10 px-3.5 rounded-xl data-[active=true]:bg-secondary/50 data-[active=true]:text-foreground transition-all duration-200"
                >
                  <Link to="/my-workspaces" className="flex items-center gap-3">
                    <Home size={18} strokeWidth={2} className="shrink-0 opacity-70" />
                    <span className="font-medium text-[13px] group-data-[collapsible=icon]:hidden">My Workspaces</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-3 group-data-[collapsible=icon]:hidden">Workspaces</SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
              {workspaces.map(ws => {
                const isActive = location.pathname.includes(`/workspaces/${ws.workspaceId}`);
                const isExpanded = expandedWorkspaces[ws.workspaceId];
                return (
                  <SidebarMenuItem key={ws.workspaceId}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={ws.name}
                      onClick={() => toggleWorkspace(ws.workspaceId)}
                      className="h-10 px-3.5 rounded-xl data-[active=true]:bg-secondary/50 data-[active=true]:text-foreground transition-all flex items-center justify-between"
                    >
                      <Link to={`/workspaces/${ws.workspaceId}`} className="flex items-center gap-3">
                        <FolderKanban size={18} strokeWidth={2} className="shrink-0 opacity-70" />
                        <span className="font-medium text-[13px] truncate group-data-[collapsible=icon]:hidden">{ws.name}</span>
                        <ChevronDown size={14} className={`ml-auto transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'} group-data-[collapsible=icon]:hidden opacity-40`} />
                      </Link>
                    </SidebarMenuButton>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <SidebarMenuSub className="ml-9 mt-1 border-l border-border/50 pl-2 space-y-1">
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={location.search.includes('tab=members')} className="h-8 text-[12px] font-medium rounded-lg px-3 data-[active=true]:text-primary data-[active=true]:bg-primary/5">
                                <Link to={`/workspaces/${ws.workspaceId}?tab=members`}>Collaborators</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center h-8 w-full px-1 rounded-full bg-secondary/5 border border-white/5 hover:bg-secondary/10 transition-all group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:mx-auto overflow-hidden">
                <Link to="/profile" className="flex flex-1 items-center gap-2 pl-1 pr-1.5 min-w-0">
                  <Avatar className="h-5 w-5 shrink-0 border-none ring-0">
                    <AvatarFallback className="text-[9px] font-black bg-[#A29BFE]/10 text-[#A29BFE]">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start truncate group-data-[collapsible=icon]:hidden">
                    <span className="text-[11px] font-black text-foreground tracking-tight leading-none">{user?.fullName || 'User'}</span>
                  </div>
                </Link>
                <div className="w-px h-2 bg-white/5 mx-0.5 group-data-[collapsible=icon]:hidden" />
                <button
                  onClick={handleLogout}
                  className="h-6 w-6 rounded-full flex items-center justify-center text-rose-500/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all group-data-[collapsible=icon]:hidden"
                  title="Logout"
                >
                  <LogOut size={12} />
                </button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background flex flex-col relative overflow-hidden transition-all duration-300">
        <header className="h-14 flex items-center justify-between px-8 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4 text-[12px] font-semibold tracking-tight text-[#a098fa]">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-all">
                <Box size={14} strokeWidth={3} className="text-white" />
                <span>Station</span>
              </Link>
              {crumbs.map((crumb, i) => (
                <div key={crumb.path + i} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <ChevronRight size={14} className="opacity-40 text-white" strokeWidth={3} />
                  <Link to={crumb.path} className="flex items-center gap-2 hover:opacity-80 transition-all">
                    <span className="text-white/60 flex items-center">{crumb.icon}</span>
                    <span className="truncate max-w-[150px]">{crumb.name}</span>
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme Capsule Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="group relative h-7 w-12 rounded-full bg-[#A29BFE]/10 border border-[#A29BFE]/20 hover:border-[#A29BFE]/40 transition-all duration-300"
            >
              <div className={`absolute top-1 left-1 h-5 w-5 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center ${theme === 'dark' ? 'translate-x-5 bg-[#A29BFE] text-black' : 'translate-x-0 bg-white/10 text-white'}`}>
                {theme === 'dark' ? <Moon size={11} fill="currentColor" /> : <Sun size={11} />}
              </div>
              <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none opacity-20">
                <Sun size={10} className={theme === 'light' ? 'invisible' : ''} />
                <Moon size={10} className={theme === 'dark' ? 'invisible' : ''} />
              </div>
            </button>

            <div className="w-px h-3 bg-white/5 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="group h-8 w-8 rounded-full bg-secondary/30 border border-border/50 transition-all relative text-[#BEF264] hover:bg-secondary/50 hover:text-[#BEF264]"
              onClick={() => setNotifOpen(true)}
            >
              <Bell size={15} className="transition-transform duration-300 group-hover:scale-125" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#BEF264] rounded-full ring-2 ring-background animate-pulse shadow-[0_0_8px_#BEF264]" />
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full px-8"
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
