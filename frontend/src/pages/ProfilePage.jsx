import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff, LoaderCircle, Lock, Save, User, X, Shield, Calendar, Mail, Fingerprint } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { authApi } from "../api/services";
import { fetchProfile, logout } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const [profileDraft, setProfileDraft] = useState({
    fullName: user?.fullName || "",
    userName: user?.userName || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [passwordDraft, setPasswordDraft] = useState({ newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(user.userId, profileDraft);
      await dispatch(fetchProfile()).unwrap();
      showToast("success", "Profile updated successfully!");
    } catch (err) {
      showToast("error", err?.response?.data?.message || err?.message || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordDraft.newPassword.length < 6) { showToast("error", "Password must be at least 6 characters."); return; }
    if (passwordDraft.newPassword !== passwordDraft.confirm) { showToast("error", "Passwords do not match."); return; }
    setSaving(true);
    try {
      await authApi.changePassword(user.userId, passwordDraft.newPassword);
      setPasswordDraft({ newPassword: "", confirm: "" });
      showToast("success", "Password changed. Please log in again.");
      setTimeout(() => { dispatch(logout()); navigate("/login"); }, 2000);
    } catch (err) {
      showToast("error", err?.response?.data?.message || err?.message || "Failed to change password.");
    } finally { setSaving(false); }
  };

  const initials = user
    ? (user.fullName || user.email || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <AppShell>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-10 z-[100] animate-in fade-in slide-in-from-right-4 duration-300">
          <Badge variant={toast.type === "error" ? "destructive" : "default"} className="px-4 py-2 text-sm shadow-lg gap-2">
            {toast.type === "success" ? <Shield size={14} /> : <X size={14} />}
            {toast.msg}
          </Badge>
        </div>
      )}

      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your account identity, security preferences, and personal information.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          {/* Sidebar Info */}
          <aside className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-24 bg-primary/10" />
              <CardContent className="pt-0 -mt-12 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                  <AvatarImage src={profileDraft.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} />
                  <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="mt-4 space-y-1">
                  <h3 className="text-xl font-bold">{user?.fullName || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Badge variant="secondary" className="mt-4 uppercase font-bold tracking-widest text-[10px] px-3">
                  {user?.role?.replace("_", " ")}
                </Badge>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t border-border/50 py-4 grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Fingerprint size={14} className="text-primary" />
                  <span>ID: #{user?.userId}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Calendar size={14} className="text-primary" />
                  <span>Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "–"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Shield size={14} className="text-primary" />
                  <span className="flex items-center gap-1">Status: <Badge variant="outline" className="h-4 px-1 text-[8px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5">Active</Badge></span>
                </div>
              </CardFooter>
            </Card>

            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Shield size={16} />
                  </div>
                  <h4 className="text-sm font-bold">Security Notice</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your account is currently protected by standard authentication. Consider enabling two-factor authentication for enhanced security in the future.
                </p>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Tabs */}
          <main>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full justify-start h-12 bg-muted/50 p-1 mb-6">
                <TabsTrigger value="general" className="px-6 h-10 gap-2"><User size={14} /> General</TabsTrigger>
                <TabsTrigger value="security" className="px-6 h-10 gap-2"><Lock size={14} /> Security</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your public profile and handle.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={saveProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="full-name">Full Name</Label>
                          <Input 
                            id="full-name" 
                            placeholder="John Doe" 
                            value={profileDraft.fullName} 
                            onChange={(e) => setProfileDraft(d => ({ ...d, fullName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                            <Input 
                              id="username" 
                              className="pl-8" 
                              placeholder="johndoe" 
                              value={profileDraft.userName} 
                              onChange={(e) => setProfileDraft(d => ({ ...d, userName: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="avatar-url">Avatar URL</Label>
                        <Input 
                          id="avatar-url" 
                          type="url" 
                          placeholder="https://images.unsplash.com/..." 
                          value={profileDraft.avatarUrl} 
                          onChange={(e) => setProfileDraft(d => ({ ...d, avatarUrl: e.target.value }))}
                        />
                        <p className="text-[10px] text-muted-foreground italic">Link to an image file or leave empty to use your default generated avatar.</p>
                      </div>

                      <div className="p-4 rounded-xl border bg-muted/20 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <Mail size={18} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold">Email Address</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                        <Badge variant="outline" className="ml-auto text-[10px] font-bold">PRIMARY</Badge>
                      </div>

                      <Button type="submit" className="w-full md:w-auto px-8 gap-2" disabled={saving}>
                        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save size={16} />}
                        Save Changes
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
                <Card>
                  <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>Secure your account with a strong password.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={changePassword} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <div className="relative">
                            <Input 
                              id="new-password" 
                              type={showPw ? "text" : "password"} 
                              className="pr-10"
                              placeholder="••••••••"
                              value={passwordDraft.newPassword}
                              onChange={(e) => setPasswordDraft(d => ({ ...d, newPassword: e.target.value }))}
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPw(!showPw)} 
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <Input 
                            id="confirm-password" 
                            type={showPw ? "text" : "password"} 
                            placeholder="••••••••"
                            value={passwordDraft.confirm}
                            onChange={(e) => setPasswordDraft(d => ({ ...d, confirm: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                          <X size={18} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-amber-600 dark:text-amber-500">Security Warning</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Changing your password will invalidate your current session. You will be logged out and required to sign in again with your new credentials.
                          </p>
                        </div>
                      </div>

                      <Button type="submit" variant="outline" className="w-full md:w-auto px-8 gap-2 border-primary/20 text-primary hover:bg-primary/5" disabled={saving}>
                        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock size={16} />}
                        Update Password
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </AppShell>
  );
}
