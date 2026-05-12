import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layout, Eye, EyeOff, LoaderCircle, LogIn, UserPlus, Shield, ChevronRight, ArrowRight } from "lucide-react";
import { login, fetchProfile } from "../store/slices/authSlice";
import { authApi } from "../api/services";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const [mode, setMode] = useState("login");
  const [showPw, setShowPw] = useState(false);
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");
    try {
      await dispatch(login({ email: loginForm.email, password: loginForm.password })).unwrap();
      await dispatch(fetchProfile()).unwrap();
      navigate("/");
    } catch (err) {
      setLocalError(err?.message || err || "Invalid credentials. Please try again.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError("");
    if (registerForm.password !== registerForm.confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.register({ ...registerForm, role: "MEMBER", userName: registerForm.email.split('@')[0], isActive: true });
      await dispatch(login({ email: registerForm.email, password: registerForm.password })).unwrap();
      await dispatch(fetchProfile()).unwrap();
      navigate("/");
    } catch (err) {
      setLocalError(err?.message || "Registration failed. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side: Branding/Intro */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Layout className="text-primary-foreground" size={20} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase">FlowBoard</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <Badge variant="outline" className="mb-6 text-[10px] uppercase font-black tracking-widest text-primary border-primary/30">
            Platform v2.0
          </Badge>
          <h2 className="text-6xl font-black tracking-tight text-white mb-6 leading-[0.9]">
            Manage projects with <span className="text-primary">velocity.</span>
          </h2>
          <p className="text-stone-400 text-lg font-medium leading-relaxed">
            The next generation of project management. Built for speed, collaboration, and absolute clarity.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 border-t border-white/10 pt-8">
           <div className="flex flex-col">
             <span className="text-white text-2xl font-bold tracking-tighter">10k+</span>
             <span className="text-stone-500 text-[10px] font-black uppercase tracking-widest">Active Users</span>
           </div>
           <div className="flex flex-col">
             <span className="text-white text-2xl font-bold tracking-tighter">99.9%</span>
             <span className="text-stone-500 text-[10px] font-black uppercase tracking-widest">Uptime</span>
           </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {mode === "login" ? "Enter your credentials to access your workspace." : "Join thousands of teams managing work on FlowBoard."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      placeholder="name@company.com" 
                      className="h-12"
                      value={loginForm.email}
                      onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPw ? "text" : "password"} 
                        required 
                        placeholder="••••••••" 
                        className="h-12 pr-10"
                        value={loginForm.password}
                        onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {localError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
                      <Shield size={14} /> {localError}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-12 text-sm font-bold gap-2" disabled={status === "loading"}>
                    {status === "loading" ? <LoaderCircle className="animate-spin" /> : <><LogIn size={18} /> Sign In</>}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input 
                      id="reg-name" 
                      required 
                      placeholder="John Doe" 
                      className="h-11"
                      value={registerForm.fullName}
                      onChange={e => setRegisterForm(f => ({ ...f, fullName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email Address</Label>
                    <Input 
                      id="reg-email" 
                      type="email" 
                      required 
                      placeholder="name@company.com" 
                      className="h-11"
                      value={registerForm.email}
                      onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-pw">Password</Label>
                      <Input 
                        id="reg-pw" 
                        type="password" 
                        required 
                        className="h-11"
                        value={registerForm.password}
                        onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-conf">Confirm</Label>
                      <Input 
                        id="reg-conf" 
                        type="password" 
                        required 
                        className="h-11"
                        value={registerForm.confirmPassword}
                        onChange={e => setRegisterForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>

                  {localError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
                      {localError}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11 text-sm font-bold gap-2 mt-2" disabled={submitting}>
                    {submitting ? <LoaderCircle className="animate-spin" /> : <><UserPlus size={18} /> Create Account</>}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center pt-4">
            <button 
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setLocalError(""); }}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
            >
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              <span className="text-primary font-bold inline-flex items-center">
                {mode === "login" ? "Register" : "Sign In"}
                <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
