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
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 transition-transform active:scale-95">
              <Box className="text-primary-foreground" size={18} strokeWidth={2.5} />
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
                  tooltip="Hub"
                  className="h-10 px-3.5 rounded-xl data-[active=true]:bg-primary/10 data-[active=true]:text-primary transition-all duration-200"
                >
                  <Link to="/" className="flex items-center gap-3">
                    <Home size={18} strokeWidth={2} />
                    <span className="font-semibold text-[13px] group-data-[collapsible=icon]:hidden">Control Hub</span>
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
              <SidebarMenuButton
                asChild
                className="h-12 w-full rounded-2xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-border transition-all group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto flex items-center justify-center"
              >
                <Link to="/profile" className="flex items-center gap-3 px-3">
                  <Avatar className="h-7 w-7 border-2 border-background ring-1 ring-border/50">
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start truncate group-data-[collapsible=icon]:hidden">
                    <span className="text-[11px] font-bold text-foreground leading-tight">{user?.fullName || 'User'}</span>
                    <span className="text-[9px] text-muted-foreground font-medium truncate w-full">{user?.email}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background flex flex-col relative overflow-hidden transition-all duration-300">
        <header className="h-14 flex items-center justify-between px-8 lg:px-12 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4 text-[12px] font-bold tracking-tight text-violet-400/50">
              <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Box size={14} strokeWidth={3} className="text-white" />
                <span>Station</span>
              </Link>
              {crumbs.map((crumb, i) => (
                <div key={crumb.path + i} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <ChevronRight size={14} className="opacity-30 text-white" strokeWidth={3} />
                  <Link to={crumb.path} className="flex items-center gap-2 hover:text-primary transition-all">
                    <span className="text-white flex items-center">{crumb.icon}</span>
                    <span className="truncate max-w-[150px]">{crumb.name}</span>
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-secondary/80 transition-all relative"
              onClick={() => setNotifOpen(true)}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
              )}
            </Button>
            <div className="w-px h-4 bg-border/50 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-secondary/80 transition-all"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 rounded-xl gap-2 font-bold text-[11px] border-border/50 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
              onClick={handleLogout}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
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
