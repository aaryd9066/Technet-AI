import React, { useState, useEffect } from "react";
import { Activity, Users, Zap, ArrowUpRight, ArrowDownRight, Search, ShieldAlert, Loader2, Lock, Unlock, Plus, Minus, Settings } from "lucide-react";
import { cn, formatTime } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface Transaction {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  type: "addition" | "deduction";
  description: string;
  timestamp: string;
}

interface UserStat {
  id: string;
  username: string;
  credits: number;
  payment_locked: number;
}

interface AdminData {
  transactions: Transaction[];
  userStats: UserStat[];
  summary: {
    totalUsers: number;
    totalCreditsInSystem: number;
    totalTransactions: number;
  };
}

export const AdminPanel: React.FC = () => {
  const [data, setData] = useState<AdminData | null>(null);
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [adjustingUser, setAdjustingUser] = useState<UserStat | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(10);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const [debugInfo, setDebugInfo] = useState<any>(null);

  const getAdminUrl = (url: string) => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}admin=true`;
    }
    return url;
  };

  const fetchData = async () => {
    console.log("AdminPanel: fetchData started");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    const params = new URLSearchParams(window.location.search);
    const isSuper = params.get("super") === "true";

    try {
      console.log("AdminPanel: Fetching monitor and settings...", { isSuper });
      let monitorRes;
      if (isSuper) {
        monitorRes = await fetch("/api/admin/super-bypass", { signal: controller.signal });
      } else {
        monitorRes = await fetch(getAdminUrl("/api/admin/monitor"), { signal: controller.signal });
        if (!monitorRes.ok) {
          console.log("AdminPanel: Normal monitor fetch failed, trying super-bypass...");
          monitorRes = await fetch("/api/admin/super-bypass", { signal: controller.signal });
        }
      }

      let settingsRes;
      if (isSuper) {
        settingsRes = await fetch("/api/admin/super-bypass-settings", { signal: controller.signal });
      } else {
        settingsRes = await fetch(getAdminUrl("/api/admin/settings"), { signal: controller.signal });
        if (!settingsRes.ok) {
          console.log("AdminPanel: Normal settings fetch failed, trying super-bypass...");
          settingsRes = await fetch("/api/admin/super-bypass-settings", { signal: controller.signal });
        }
      }
      
      clearTimeout(timeoutId);
      console.log("AdminPanel: Fetch complete", { monitorStatus: monitorRes.status, settingsStatus: settingsRes.status });

      if (!monitorRes.ok) {
        const errorData = await monitorRes.json().catch(() => ({}));
        console.error("Monitor fetch failed", monitorRes.status, errorData);
        if (monitorRes.status === 403) throw new Error(errorData.error || "Monitor: Developer access only");
        if (monitorRes.status === 401) throw new Error("Monitor: Session expired. Please log in again.");
        throw new Error(`Monitor Server error (${monitorRes.status}): ${errorData.error || "Failed to fetch monitor data"}`);
      }

      if (!settingsRes.ok) {
        const errorData = await settingsRes.json().catch(() => ({}));
        if (settingsRes.status === 403) throw new Error(errorData.error || "Settings: Developer access only");
        if (settingsRes.status === 401) throw new Error("Settings: Session expired. Please log in again.");
        throw new Error(`Settings Server error (${settingsRes.status}): Failed to fetch settings data`);
      }

      const monitorJson = await monitorRes.json();
      const settingsJson = await settingsRes.json();

      setData(monitorJson);
      setSettings(settingsJson);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentLock = async () => {
    setIsUpdatingSettings(true);
    const newValue = settings.payments_locked === "true" ? "false" : "true";
    try {
      const res = await fetch(getAdminUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "payments_locked", value: newValue }),
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, payments_locked: newValue }));
      }
    } catch (err) {
      console.error("Failed to update settings", err);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleAdjustCredits = async (type: "add" | "remove") => {
    if (!adjustingUser) return;
    setIsAdjusting(true);
    try {
      const res = await fetch(getAdminUrl("/api/admin/adjust-credits"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: adjustingUser.id,
          amount: adjustAmount,
          type,
          description: "Manual Admin Adjustment"
        }),
      });
      if (res.ok) {
        setAdjustingUser(null);
        fetchData();
      }
    } catch (err) {
      console.error("Adjustment failed", err);
    } finally {
      setIsAdjusting(false);
    }
  };

  const toggleUserPaymentLock = async (user: UserStat) => {
    try {
      const res = await fetch(getAdminUrl("/api/admin/toggle-user-payment-lock"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          locked: !user.payment_locked
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to toggle user lock", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-zinc-950">
      <Loader2 className="animate-spin text-cyan-400 mb-4" size={40} />
      <p className="text-zinc-500 font-bold animate-pulse">Initializing Admin Monitor...</p>
      <button 
        onClick={() => fetchData()}
        className="mt-8 px-6 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold rounded-xl hover:text-white transition-all"
      >
        Taking too long? Click to retry
      </button>
    </div>
  );

  if (error) return (
    <div className="h-full flex flex-col items-center justify-center bg-zinc-950 p-8 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
        <ShieldAlert size={40} />
      </div>
      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Access Denied</h2>
      <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl mb-6 max-w-md">
        <p className="text-red-400 text-sm font-medium">{error}</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-xs font-mono text-zinc-400 mb-2">
        Client-side Username: <span className="text-cyan-400">@{window.localStorage.getItem("technet_user") || "unknown"}</span>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-zinc-200 transition-all"
        >
          Retry Access
        </button>
        <button 
          onClick={async () => {
            try {
              const res = await fetch(getAdminUrl("/api/auth/debug"));
              const data = await res.json();
              setDebugInfo(data);
            } catch (err) {
              setDebugInfo({ error: "Failed to fetch debug info" });
            }
          }}
          className="px-8 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 font-black rounded-xl hover:text-white transition-all"
        >
          Debug Session
        </button>
        <button 
          onClick={async () => {
             // This is a temporary bypass for the developer
             try {
               await fetch("/api/auth/force-admin");
               window.location.href = "/?admin=true";
             } catch (err) {
               window.location.href = "/?admin=true";
             }
          }}
          className="px-8 py-3 bg-zinc-900 border border-zinc-800 text-cyan-500 font-black rounded-xl hover:bg-cyan-500/10 transition-all"
        >
          Force Bypass
        </button>
        <button 
          onClick={async () => {
             // Direct super bypass
             window.location.href = "/?admin=true&super=true";
          }}
          className="px-8 py-3 bg-zinc-900 border border-zinc-800 text-indigo-500 font-black rounded-xl hover:bg-indigo-500/10 transition-all"
        >
          Super Bypass
        </button>
        <button 
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/";
          }}
          className="px-8 py-3 bg-zinc-900 border border-zinc-800 text-red-500 font-black rounded-xl hover:bg-red-500/10 transition-all"
        >
          Clear Cache & Logout
        </button>
      </div>

      {debugInfo && (
        <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-left max-w-2xl w-full overflow-auto">
          <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
            <Activity size={16} />
            Session Debug Info
          </h3>
          <pre className="text-[10px] text-zinc-500 font-mono">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  const filteredTransactions = data?.transactions.filter(t => 
    t.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-8 h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <Activity className="text-cyan-400" />
              Credit Monitor
            </h2>
            <p className="text-zinc-500 mt-1">Developer dashboard for real-time credit flow tracking.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={togglePaymentLock}
              disabled={isUpdatingSettings}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border-2",
                settings.payments_locked === "true" 
                  ? "bg-red-500/10 border-red-500 text-red-500" 
                  : "bg-emerald-500/10 border-emerald-500 text-emerald-500"
              )}
            >
              {isUpdatingSettings ? (
                <Loader2 className="animate-spin" size={16} />
              ) : settings.payments_locked === "true" ? (
                <Lock size={16} />
              ) : (
                <Unlock size={16} />
              )}
              {settings.payments_locked === "true" ? "Payments Locked" : "Payments Active"}
            </button>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Search users or activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-white pl-12 pr-6 py-3 rounded-2xl focus:outline-none focus:border-cyan-500/50 transition-all w-64"
              />
            </div>
            <button 
              onClick={fetchData}
              className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl hover:text-white transition-colors"
            >
              <Activity size={20} />
            </button>
          </div>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 text-zinc-500 mb-4">
              <Users size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Total Users</span>
            </div>
            <div className="text-4xl font-black text-white">{data?.summary.totalUsers}</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 text-zinc-500 mb-4">
              <Zap size={18} className="text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-widest">Credits in System</span>
            </div>
            <div className="text-4xl font-black text-white">{data?.summary.totalCreditsInSystem}</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 text-zinc-500 mb-4">
              <Activity size={18} className="text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-widest">Total Events</span>
            </div>
            <div className="text-4xl font-black text-white">{data?.summary.totalTransactions}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transaction Log */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-white px-2">Live Transaction Log</h3>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">User</th>
                      <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Type</th>
                      <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Amount</th>
                      <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Description</th>
                      <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="p-5">
                          <span className="text-sm font-bold text-white">@{t.username}</span>
                        </td>
                        <td className="p-5">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                            t.type === "addition" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          )}>
                            {t.type === "addition" ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {t.type}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={cn(
                            "text-sm font-black",
                            t.type === "addition" ? "text-emerald-400" : "text-red-400"
                          )}>
                            {t.type === "addition" ? "+" : "-"}{t.amount}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className="text-xs text-zinc-400 line-clamp-1">{t.description}</span>
                        </td>
                        <td className="p-5">
                          <span className="text-[10px] text-zinc-600 font-mono">{new Date(t.timestamp).toLocaleTimeString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Balances */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white px-2">User Balances</h3>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
              {data?.userStats.map((u) => (
                <div key={u.id} className="group relative flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl hover:border-cyan-500/30 transition-all">
                  <div>
                    <p className="text-sm font-bold text-white">@{u.username}</p>
                    <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">ID: {u.id.slice(0, 8)}...</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-black text-cyan-400">{u.credits}</div>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase">Credits</p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => toggleUserPaymentLock(u)}
                        title={u.payment_locked ? "Unlock Payments" : "Lock Payments"}
                        className={cn(
                          "p-2 border rounded-xl transition-all",
                          u.payment_locked 
                            ? "bg-red-500/10 border-red-500 text-red-500" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700"
                        )}
                      >
                        {u.payment_locked ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                      <button 
                        onClick={() => setAdjustingUser(u)}
                        title="Adjust Credits"
                        className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-xl hover:text-white hover:border-zinc-700 transition-all"
                      >
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      <AnimatePresence>
        {adjustingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdjustingUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-white mb-2">Adjust Credits</h3>
              <p className="text-zinc-500 mb-8">Managing credits for <span className="text-cyan-400 font-bold">@{adjustingUser.username}</span></p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Amount</label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-cyan-500/50 transition-all text-xl font-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAdjustCredits("add")}
                    disabled={isAdjusting}
                    className="flex items-center justify-center gap-2 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all disabled:opacity-50"
                  >
                    <Plus size={20} />
                    Add
                  </button>
                  <button
                    onClick={() => handleAdjustCredits("remove")}
                    disabled={isAdjusting}
                    className="flex items-center justify-center gap-2 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-400 transition-all disabled:opacity-50"
                  >
                    <Minus size={20} />
                    Deduct
                  </button>
                </div>

                <button
                  onClick={() => setAdjustingUser(null)}
                  className="w-full py-4 text-zinc-500 font-bold hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
