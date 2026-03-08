import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { User as UserIcon, Tag, Zap, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSpecialUser = ["aarydeshmane9066", "admin"].includes(formData.username.toLowerCase().trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await login(formData);
    } catch (err: any) {
      setError(err.message || "Failed to setup profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl rounded-[2.5rem] p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <span className="text-3xl font-black text-cyan-400">T</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Setup Your Profile</h1>
          <p className="text-zinc-500">Welcome to Technet AI. Choose your username.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                required
                type="text"
                placeholder="technet_creator"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          </div>

          <AnimatePresence>
            {isSpecialUser && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Password Required</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-red-500 text-xs font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 text-lg group mt-4"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                Start Creating
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="pt-6 border-t border-zinc-800/50 mt-6">
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch("/api/auth/force-admin");
                  window.location.href = "/?admin=true";
                } catch (err) {
                  window.location.href = "/?admin=true";
                }
              }}
              className="w-full py-3 bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
            >
              Developer Bypass
            </button>
          </div>
        </form>

        <div className="mt-10 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
            <Zap size={14} className="text-cyan-400" />
            50 Free Credits
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={14} className="text-indigo-400" />
            AI Studio Access
          </div>
        </div>
      </motion.div>
    </div>
  );
};
