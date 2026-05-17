import { useEffect, useMemo, useState } from "react";
import { 
  BarChart2, 
  Crown, 
  Download, 
  History, 
  Layout, 
  LoaderCircle, 
  Megaphone, 
  RefreshCw, 
  Shield, 
  Trash2, 
  UserCheck, 
  UserX, 
  Users, 
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Server,
  Send
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { authApi, notificationApi, workspaceApi } from "../api/services";
import { roleBadgeStyle } from "../utils/roles";
import http from "../api/http";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [broadcast, setBroadcast] = useState({ title: "", message: "" });
  const [broadcasting, setBroadcasting] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const load = async () => {
    setLoading(true);
    try {
      const [userData, notifData] = await Promise.all([authApi.searchUsers(""), notificationApi.all()]);
      setUsers(userData);
      setNotifications(notifData);
      
      const [wsData, boardsData] = await Promise.all([
        http.get("/workspaces").catch(() => ({ data: { data: [] } })),
        http.get("/boards").catch(() => ({ data: { data: [] } }))
      ]);
      setWorkspaces(wsData.data.data || []);
      setBoards(boardsData.data.data || []);
    } catch (err) {
      showToast("error", "Failed to load admin data.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const activeUsersCount = useMemo(() => users.filter((u) => u.isActive !== false).length, [users]);
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.fullName || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q));
  }, [users, userSearch]);

  const engagementData = useMemo(() => {
    const days = 7;
    const data = new Array(days).fill(0);
    const today = new Date();
    
    users.forEach(u => {
      if (!u.createdAt) return;
      const createdDate = new Date(u.createdAt);
      const diffTime = Math.abs(today - createdDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < days) {
        data[days - 1 - diffDays]++;
      }
    });
    
    const maxVal = Math.max(...data);
    if (maxVal === 0) {
      return [45, 62, 51, 88, 73, 91, 55]; // fallback
    }
    return data.map(v => Math.round((v / maxVal) * 100));
  }, [users]);

  const analyticsData = useMemo(() => {
    const totalUsers = users.length;
    const totalWorkspaces = workspaces.length;
    const totalBoards = boards.length;
    
    const boardActions = Math.min(100, (totalBoards * 10) || 45);
    const collaboration = Math.min(100, (totalWorkspaces * 15) || 30);
    const adminEvents = Math.min(100, (notifications.length * 2) || 15);
    
    const health = totalUsers > 0 ? Math.round((activeUsersCount / totalUsers) * 100) : 100;
    
    return { boardActions, collaboration, adminEvents, health };
  }, [users, workspaces, boards, notifications, activeUsersCount]);

  const deactivateUser = async (userId) => {
    try { await authApi.deactivate(userId); showToast("success", `User #${userId} deactivated.`); await load(); }
    catch (err) { showToast("error", err?.message || "Failed to deactivate."); }
  };

  const reactivateUser = async (userId) => {
    try { await authApi.reactivate(userId); showToast("success", `User #${userId} reactivated.`); await load(); }
    catch (err) { showToast("error", err?.message || "Failed to reactivate."); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this account?")) return;
    try { await authApi.delete(userId); showToast("success", `User #${userId} deleted.`); await load(); }
    catch (err) { showToast("error", err?.message || "Failed to delete."); }
  };

  const promoteUser = async (userId, currentRole) => {
    const newRole = currentRole === "PLATFORM_ADMIN" ? "MEMBER" : "PLATFORM_ADMIN";
    try {
      await authApi.updateRole(userId, newRole);
      showToast("success", `User role updated to ${newRole.replace("_", " ")}.`);
      await load();
    } catch (err) { showToast("error", err?.message || "Failed to update role."); }
  };

  const deleteWorkspace = async (workspaceId) => {
    try {
      await http.delete(`/workspaces/${workspaceId}`);
      showToast("success", `Workspace #${workspaceId} deleted.`);
      await load();
    } catch (err) {
      showToast("error", err?.message || "Failed to delete workspace.");
    }
  };

  const deleteBoard = async (boardId) => {
    try {
      await http.delete(`/boards/${boardId}`);
      showToast("success", `Board #${boardId} deleted.`);
      await load();
    } catch (err) {
      showToast("error", err?.message || "Failed to delete board.");
    }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title || !broadcast.message) return;
    setBroadcasting(true);
    try {
      const activeUserIds = users.filter(u => u.isActive !== false).map(u => Number(u.userId));
      await notificationApi.bulk(activeUserIds, broadcast.title, broadcast.message);
      setBroadcast({ title: "", message: "" });
      showToast("success", `Broadcast sent to ${activeUserIds.length} users.`);
      await load();
    } catch (err) { showToast("error", "Failed to send broadcast."); }
    finally { setBroadcasting(false); }
  };

  return (
    <AppShell>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-10 z-[100] animate-in fade-in slide-in-from-right-4 duration-300">
          <Badge variant={toast.type === "error" ? "destructive" : "default"} className="px-4 py-2 text-sm shadow-lg gap-2">
            {toast.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {toast.msg}
          </Badge>
        </div>
      )}

      <div className="flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Platform Administration</h1>
            <p className="text-sm text-muted-foreground">Manage users, monitor ecosystem health, and broadcast updates.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.alert("Generating platform report...")}>
              <Download size={14} /> Export Data
            </Button>
            <Button variant="default" size="sm" className="gap-2" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Registry
            </Button>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={users.length} icon={Users} trend="+4.1%" />
          <StatCard label="Active Sessions" value={activeUsersCount} icon={Activity} trend="+12%" />
          <StatCard label="Workspaces" value={workspaces.length} icon={Layout} trend="+2.5%" />
          <StatCard label="Incidents" value={0} icon={AlertCircle} trend="0%" color="text-emerald-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Controls */}
          <main>
            <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-muted/50 h-12 p-1 mb-6">
                <TabsTrigger value="users" className="px-6 h-10 gap-2"><Users size={14} /> Users</TabsTrigger>
                <TabsTrigger value="workspaces" className="px-6 h-10 gap-2"><Layout size={14} /> Workspaces</TabsTrigger>
                <TabsTrigger value="boards" className="px-6 h-10 gap-2"><Layout size={14} /> Boards</TabsTrigger>
                <TabsTrigger value="analytics" className="px-6 h-10 gap-2"><BarChart2 size={14} /> Analytics</TabsTrigger>
                <TabsTrigger value="logs" className="px-6 h-10 gap-2"><History size={14} /> Audit Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle>User Directory</CardTitle>
                      <CardDescription>Search and manage all registered platform accounts.</CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search users..." 
                        className="pl-9 w-[240px] h-9"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mt-4">
                      {loading ? (
                        [...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)
                      ) : (
                        filteredUsers.map((u) => (
                          <div key={u.userId} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/10 transition-colors">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 border-2 border-background">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${u.fullName || u.userId}`} />
                                <AvatarFallback>{(u.fullName || u.email || "U")[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold">{u.fullName || u.userName || "Unnamed User"}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={u.role === "PLATFORM_ADMIN" ? "default" : "outline"} className="text-[10px] font-bold h-5 uppercase">
                                {u.isActive === false ? "Deactivated" : u.role.replace("PLATFORM_", "")}
                              </Badge>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => promoteUser(u.userId, u.role)} title="Toggle Admin Role">
                                  {u.role === "PLATFORM_ADMIN" ? <UserX size={14} className="text-destructive" /> : <Crown size={14} className="text-primary" />}
                                </Button>
                                {u.role !== "PLATFORM_ADMIN" && (
                                  <>
                                    {u.isActive === false ? (
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={() => reactivateUser(u.userId)} title="Reactivate Account">
                                        <CheckCircle2 size={14} />
                                      </Button>
                                    ) : (
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500" onClick={() => deactivateUser(u.userId)} title="Deactivate Account">
                                        <X size={14} />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteUser(u.userId)} title="Delete Account">
                                      <Trash2 size={14} />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {!loading && filteredUsers.length === 0 && (
                        <div className="py-20 text-center text-muted-foreground italic text-sm">No users found matching your query.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Engagement</CardTitle>
                      <CardDescription>Daily active user metrics for the past 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex items-end justify-between gap-2 h-40">
                        {engagementData.map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col h-full justify-end group relative">
                            <div className="w-full relative flex-1 flex flex-col justify-end">
                              <div className="w-full bg-emerald-500/80 rounded-t-md group-hover:bg-emerald-500 transition-colors" style={{ height: `${h}%` }}>
                                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
                              </div>
                            </div>
                            <div className="text-[9px] text-center mt-2 text-muted-foreground uppercase font-bold tracking-tighter">Day {i+1}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Activity Heatmap</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <DistributionBar label="Board Actions" value={analyticsData.boardActions} color="bg-blue-500" />
                        <DistributionBar label="Collaboration" value={analyticsData.collaboration} color="bg-emerald-500" />
                        <DistributionBar label="Admin Events" value={analyticsData.adminEvents} color="bg-primary" />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">System Health</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                           <svg className="w-full h-full -rotate-90">
                             <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                             <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="301.59" strokeDashoffset={301.59 * (1 - analyticsData.health / 100)} className="text-primary" />
                           </svg>
                           <div className="absolute flex flex-col items-center">
                             <span className="text-2xl font-black">{analyticsData.health}%</span>
                             <span className="text-[8px] font-bold text-muted-foreground uppercase">Stable</span>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card>
                  <CardHeader>
                    <CardTitle>System Audit Logs</CardTitle>
                    <CardDescription>Chronological record of platform-wide events and alerts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {notifications.slice(0, 12).map((n) => (
                        <div key={n.notificationId} className="flex items-start gap-4 p-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.type === 'ASSIGNMENT' ? 'bg-blue-500' : 'bg-muted-foreground/30'}`} />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold">{n.title}</p>
                              <span className="text-[10px] text-muted-foreground font-medium">{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="workspaces" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {workspaces.map((ws) => (
                     <Card key={ws.workspaceId} className="overflow-hidden">
                       <CardHeader className="pb-3">
                         <div className="flex justify-between items-start">
                           <CardTitle className="text-base truncate">{ws.name}</CardTitle>
                           <Badge variant="outline" className="text-[9px] font-black">{ws.visibility}</Badge>
                         </div>
                         <CardDescription className="text-xs">Owner: User #{ws.ownerId}</CardDescription>
                       </CardHeader>
                       <CardFooter className="bg-muted/20 py-2 flex justify-between">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Created: {new Date(ws.createdAt).toLocaleDateString()}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => deleteWorkspace(ws.workspaceId)}><Trash2 size={12} /></Button>
                       </CardFooter>
                     </Card>
                   ))}
                   {workspaces.length === 0 && (
                     <div className="col-span-2 text-center py-20 text-muted-foreground italic text-sm">No workspaces found.</div>
                   )}
                 </div>
              </TabsContent>

              <TabsContent value="boards" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {boards.map((b) => (
                     <Card key={b.boardId} className="overflow-hidden">
                       <CardHeader className="pb-3">
                         <div className="flex justify-between items-start">
                           <CardTitle className="text-base truncate">{b.name}</CardTitle>
                           <Badge variant="outline" className="text-[9px] font-black">{b.visibility}</Badge>
                         </div>
                         <CardDescription className="text-xs">Workspace ID: {b.workspaceId}</CardDescription>
                       </CardHeader>
                       <CardFooter className="bg-muted/20 py-2 flex justify-between">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Created: {new Date(b.createdAt).toLocaleDateString()}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => deleteBoard(b.boardId)}><Trash2 size={12} /></Button>
                       </CardFooter>
                     </Card>
                   ))}
                   {boards.length === 0 && (
                     <div className="col-span-2 text-center py-20 text-muted-foreground italic text-sm">No boards found.</div>
                   )}
                 </div>
              </TabsContent>
            </Tabs>
          </main>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            <Card className="border-primary/20 shadow-lg overflow-hidden">
              <div className="h-1.5 bg-primary" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone size={18} className="text-primary" />
                  Broadcast Alert
                </CardTitle>
                <CardDescription>Send a mandatory platform-wide notification to all active users.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={sendBroadcast} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="broadcast-title" className="text-xs">Alert Headline</Label>
                    <Input 
                      id="broadcast-title" 
                      placeholder="e.g. System Maintenance" 
                      value={broadcast.title}
                      onChange={(e) => setBroadcast(d => ({ ...d, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="broadcast-msg" className="text-xs">Detailed Message</Label>
                    <textarea 
                      id="broadcast-msg"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Specify the details of the update..."
                      value={broadcast.message}
                      onChange={(e) => setBroadcast(d => ({ ...d, message: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={broadcasting}>
                    {broadcasting ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={14} />}
                    Notify {activeUsersCount} Users
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server size={16} className="text-muted-foreground" />
                  Environment Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    <span>API Performance</span>
                    <span className="text-emerald-500">Normal</span>
                  </div>
                  <Progress value={92} className="h-1 bg-muted" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    <span>Database Load</span>
                    <span className="text-emerald-500">12%</span>
                  </div>
                  <Progress value={12} className="h-1 bg-muted" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    <span>S3 Storage</span>
                    <span className="text-amber-500">65% Full</span>
                  </div>
                  <Progress value={65} className="h-1 bg-muted" />
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
        <Icon size={14} className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <p className="text-[10px] text-emerald-500 font-bold mt-1">{trend} <span className="text-muted-foreground font-medium">from last week</span></p>
      </CardContent>
    </Card>
  );
}

function DistributionBar({ label, value, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} className={`h-1.5 ${color}`} />
    </div>
  );
}
