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
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <Card className="w-full max-w-[420px] bg-stone-900/50 border-stone-800 backdrop-blur-sm animate-in fade-in duration-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            {mode === "login" ? "Sign In" : "Sign Up"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      placeholder="Email Address" 
                      className="h-12"
                      value={loginForm.email}
                      onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPw ? "text" : "password"} 
                        required 
                        placeholder="Password" 
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
                    <Input 
                      id="reg-name" 
                      required 
                      placeholder="Full Name" 
                      className="h-11"
                      value={registerForm.fullName}
                      onChange={e => setRegisterForm(f => ({ ...f, fullName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input 
                      id="reg-email" 
                      type="email" 
                      required 
                      placeholder="Email Address" 
                      className="h-11"
                      value={registerForm.email}
                      onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Input 
                        id="reg-pw" 
                        type="password" 
                        required 
                        placeholder="Password"
                        className="h-11"
                        value={registerForm.password}
                        onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input 
                        id="reg-conf" 
                        type="password" 
                        required 
                        placeholder="Confirm Password"
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

        </CardContent>
        <CardFooter className="justify-center border-t border-stone-800 pt-4">
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
        </CardFooter>
      </Card>
    </div>
  );
}
