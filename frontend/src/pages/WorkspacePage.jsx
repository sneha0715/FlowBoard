import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Plus, 
  ArrowRight, 
  Users, 
  FolderKanban, 
  Layers,
  MoreVertical,
  Globe,
  Lock,
  Mail
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AppShell from "../components/layout/AppShell";
import { boardApi, workspaceApi } from "../api/services";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function WorkspacePage() {
  const user = useSelector((s) => s.auth.user);
  const [workspaces, setWorkspaces] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [boardsByWorkspace, setBoardsByWorkspace] = useState({});
  const [loading, setLoading] = useState(true);
  const [showWsForm, setShowWsForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wsDraft, setWsDraft] = useState({ name: "", description: "", visibility: "PRIVATE" });

  const refresh = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const [wsList, invites] = await Promise.all([
        workspaceApi.byMember(user.userId),
        workspaceApi.pendingInvitations()
      ]);
      setWorkspaces(wsList);
      setPendingInvites(invites);
      const boardEntries = await Promise.all(
        wsList.map(async (ws) => [ws.workspaceId, await boardApi.byWorkspace(ws.workspaceId).catch(() => [])])
      );
      setBoardsByWorkspace(Object.fromEntries(boardEntries));
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [user?.userId]);

  const handleAccept = async (wsId) => {
    try {
      await workspaceApi.acceptInvitation(wsId);
      refresh();
    } catch (err) {
      console.error("Failed to accept invitation:", err);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!wsDraft.name.trim()) return;
    setSubmitting(true);
    try {
      await workspaceApi.create(wsDraft);
      setWsDraft({ name: "", description: "", visibility: "PRIVATE" });
      setShowWsForm(false);
      refresh();
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Action Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Your Workspaces</h2>
          <p className="text-sm text-muted-foreground mt-1">Collaborate with your team across different sectors.</p>
        </div>
        <Button onClick={() => setShowWsForm(true)} className="gap-2">
          <Plus size={16} />
          New Workspace
        </Button>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvites.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Mail size={18} />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Pending Invitations</h3>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{pendingInvites.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingInvites.map((invite) => (
              <Card key={invite.memberId} className="border-amber-500/30 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Workspace Invitation</CardTitle>
                  <CardDescription>You've been invited to join as a <span className="font-bold text-foreground">{invite.role}</span></CardDescription>
                </CardHeader>
                <CardFooter className="gap-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => workspaceApi.leaveWorkspace(invite.workspaceId).then(refresh)}>Decline</Button>
                  <Button size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white border-none" onClick={() => handleAccept(invite.workspaceId)}>Accept & Join</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((ws) => (
          <motion.div
            key={ws.workspaceId}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="flex flex-col h-full hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Layers size={20} />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreVertical size={16} />
                  </Button>
                </div>
                <CardTitle className="text-xl mt-4 group-hover:text-primary transition-colors">{ws.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {ws.description || 'Manage projects, track progress, and collaborate in real-time.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 pb-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Boards</span>
                    <span>{boardsByWorkspace[ws.workspaceId]?.length || 0} active</span>
                  </div>
                  
                  <div className="space-y-2">
                    {boardsByWorkspace[ws.workspaceId]?.slice(0, 2).map(board => (
                      <Link 
                        key={board.boardId} 
                        to={`/boards/${board.boardId}`}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors border border-transparent"
                      >
                        <FolderKanban size={14} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{board.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button asChild variant="outline" className="w-full gap-2 group-hover:border-primary group-hover:text-primary transition-colors">
                  <Link to={`/workspaces/${ws.workspaceId}`}>
                    Open Workspace <ArrowRight size={14} />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
        
        {/* Empty State / Add Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button 
            onClick={() => setShowWsForm(true)}
            className="w-full h-full min-h-[300px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 hover:bg-card hover:border-primary/50 group transition-all"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-all">
              <Plus size={24} />
            </div>
            <div className="text-center mt-4">
              <p className="text-sm font-bold text-foreground">New Workspace</p>
              <p className="text-xs text-muted-foreground mt-1">Start a new project sector</p>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Creation Modal - Shadcn Style */}
      <Dialog open={showWsForm} onOpenChange={setShowWsForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Initialize a new collaborative environment. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWorkspace} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                required
                value={wsDraft.name}
                onChange={e => setWsDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Engineering Team"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea 
                id="description"
                value={wsDraft.description}
                onChange={e => setWsDraft(d => ({ ...d, description: e.target.value }))}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Briefly describe the purpose of this workspace..."
              />
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'PRIVATE', label: 'Private', icon: Lock },
                  { id: 'TEAM', label: 'Team', icon: Users },
                  { id: 'PUBLIC', label: 'Public', icon: Globe }
                ].map(v => (
                  <Button 
                    key={v.id} 
                    type="button" 
                    variant={wsDraft.visibility === v.id ? 'default' : 'outline'}
                    onClick={() => setWsDraft(d => ({ ...d, visibility: v.id }))}
                    className="flex flex-col gap-2 h-auto py-3 px-2"
                  >
                    <v.icon size={16} />
                    <span className="text-xs">{v.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowWsForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Workspace'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
