import React from "react";
import { MessageSquare, Image as ImageIcon, Video, Edit3, LayoutDashboard, Zap, Library, CreditCard, LogOut, User as UserIcon, PanelLeft, ShieldCheck } from "lucide-react";
import { cn } from "../utils";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  credits: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, credits, isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  
  const menuItems = [
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "media", label: "Media Studio", icon: Video },
    { id: "editor", label: "Image Editor", icon: Edit3 },
    { id: "creations", label: "My Creations", icon: Library },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pricing", label: "Get Credits", icon: CreditCard },
  ];

  const normalizedUsername = user?.username?.toLowerCase().trim();
  const params = new URLSearchParams(window.location.search);
  const isQueryAdmin = params.get("admin") === "true";
  const isAdmin = normalizedUsername?.includes("aarydeshmane9066") || normalizedUsername === "admin" || normalizedUsername === "aarydeshmane" || normalizedUsername?.includes("aarydeshmane9066@gmail.com") || isQueryAdmin;
  
  if (isAdmin) {
    menuItems.push({ id: "admin", label: "Admin Monitor", icon: ShieldCheck });
  }

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col h-full transition-transform duration-500 ease-[0.23, 1, 0.32, 1] lg:relative lg:translate-x-0",
      !isOpen && "-translate-x-full lg:-ml-72"
    )}>
      <div className="p-8 flex items-center justify-between">
        <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20">
            <span className="text-xl font-black">T</span>
          </div>
          TECHNET AI
        </h1>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-2 text-zinc-600 hover:text-white transition-colors lg:hidden"
        >
          <LogOut className="rotate-180" size={20} />
        </button>
        <button 
          onClick={() => setIsOpen(false)}
          className="hidden lg:flex p-2 text-zinc-600 hover:text-white hover:bg-zinc-900 rounded-xl transition-all active:scale-95"
          title="Close Sidebar"
        >
          <PanelLeft size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        <p className="px-4 mb-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Main Menu</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (window.innerWidth < 1024) setIsOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
              activeTab === item.id
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.05)]"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
            )}
          >
            <item.icon size={20} className={cn("transition-transform duration-300", activeTab === item.id ? "scale-110" : "group-hover:scale-110")} />
            <span className="font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 space-y-4">
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={40} className="text-cyan-400" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Credits</span>
            <Zap size={12} className="text-cyan-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white tracking-tight">{credits}</span>
            <span className="text-zinc-600 text-xs font-bold">/ 500</span>
          </div>
          <div className="mt-4 h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min((credits / 500) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-zinc-900/20 border border-zinc-800/30 rounded-2xl">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-800 shrink-0">
            {user?.picture ? (
              <img src={user.picture} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                <UserIcon size={20} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white truncate tracking-tight">@{user?.username || "technet_user"}</p>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => window.location.href = "/?admin=true"}
                className="text-[10px] text-zinc-600 hover:text-cyan-400 transition-colors uppercase font-black tracking-widest text-left"
              >
                Force Admin
              </button>
              <button 
                onClick={() => window.location.href = "/?admin=true&super=true"}
                className="text-[10px] text-zinc-600 hover:text-indigo-400 transition-colors uppercase font-black tracking-widest text-left"
              >
                Super Admin
              </button>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
