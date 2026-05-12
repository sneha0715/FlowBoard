import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, X, Sparkles, Inbox, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { notificationApi, workspaceApi } from "../../api/services";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsDrawer({ onClose }) {
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState("loading");

  const load = async () => {
    if (!user?.userId) return;
    setStatus("loading");
    try {
      const notifData = await notificationApi.byRecipient(user.userId);
      setNotifications(Array.isArray(notifData) ? notifData : []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => { load(); }, [user?.userId]);

  const markRead = async (notifId) => {
    await notificationApi.markRead(notifId).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === notifId ? { ...n, isRead: true } : n))
    );
  };

  const markAllRead = async () => {
    if (!user?.userId) return;
    await notificationApi.markAllRead(user.userId).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose} 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
      />

      {/* Side Panel */}
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-[420px] bg-card border-l border-border flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{unreadCount} Unread Alerts</p>
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="icon" onClick={markAllRead} className="rounded-xl h-10 w-10" title="Mark all as read">
                <CheckCheck size={18} />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl h-10 w-10">
              <X size={18} />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {status === "loading" && (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 w-full bg-muted/50 rounded-2xl animate-pulse" />)}
              </div>
            )}

            {status === "ready" && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                  <Inbox size={32} className="text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Inbox Clear</p>
                  <p className="text-xs text-muted-foreground italic">You're all caught up for now.</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {notifications.map(n => (
                <motion.div
                  layout
                  key={n.notificationId}
                  onClick={() => !n.isRead && markRead(n.notificationId)}
                  className={`relative group p-6 rounded-[24px] border transition-all cursor-pointer ${n.isRead ? 'bg-muted/10 border-border/30 opacity-70' : 'bg-card border-primary/20 shadow-md ring-1 ring-primary/5 hover:border-primary/40'}`}
                >
                  {!n.isRead && (
                    <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-r-full" />
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter px-2 h-5 border-border/50 ${n.isRead ? 'text-muted-foreground' : 'text-primary bg-primary/5 border-primary/20'}`}>
                      {n.type}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                       <Clock size={10} />
                       {timeAgo(n.createdAt)}
                    </div>
                  </div>
                  
                  <h4 className={`text-sm font-bold mb-1 tracking-tight ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 font-medium">{n.message}</p>
                  
                  {n.type === "ASSIGNMENT" && n.relatedType === "WORKSPACE" && !n.isRead && (
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        className="h-9 px-5 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-xl gap-2 shadow-lg shadow-primary/20"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await workspaceApi.acceptInvitation(n.relatedId);
                            await markRead(n.notificationId);
                            window.location.href = `/workspaces/${n.relatedId}`;
                          } catch (err) {
                            console.error("Failed to accept from notification:", err);
                          }
                        }}
                      >
                        <CheckCircle2 size={14} /> Accept & Join
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl border-border/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(n.notificationId);
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {!n.isRead && n.type !== "ASSIGNMENT" && (
                    <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest">
                        Acknowledge <CheckCircle2 size={12} className="ml-1" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-border/50 bg-muted/5">
           <Button variant="outline" className="w-full rounded-xl text-xs font-black uppercase tracking-widest h-12 border-border/50" onClick={onClose}>
             Close Drawer
           </Button>
        </div>
      </motion.div>
    </div>
  );
}
