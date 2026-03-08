import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Chat } from "./components/Chat";
import { MediaStudio } from "./components/MediaStudio";
import { ImageEditor } from "./components/ImageEditor";
import { Dashboard } from "./components/Dashboard";
import { Creations } from "./components/Creations";
import { Pricing } from "./components/Pricing";
import { AdminPanel } from "./components/AdminPanel";
import { Login } from "./components/Login";
import { useUser } from "./hooks/useUser";
import { useAuth } from "./contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { PanelLeft as SidebarIcon } from "lucide-react";
import { cn } from "./utils";

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "true" ? "admin" : "chat";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useUser();

  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return <Chat />;
      case "media":
        return <MediaStudio />;
      case "editor":
        return <ImageEditor />;
      case "creations":
        return <Creations />;
      case "dashboard":
        return <Dashboard />;
      case "pricing":
        return <Pricing />;
      case "admin":
        return <AdminPanel />;
      default:
        return <Chat />;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      return (
        <div className="flex h-screen bg-black text-zinc-200 font-sans overflow-hidden">
          <main className="flex-1 relative overflow-hidden flex flex-col">
            <AdminPanel />
          </main>
        </div>
      );
    }
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-black text-zinc-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        credits={stats?.credits ?? 0} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <main className="flex-1 relative overflow-hidden flex flex-col transition-all duration-500 ease-[0.23, 1, 0.32, 1]">
        {/* Mobile/Closed Sidebar Toggle */}
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 p-2.5 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl group"
            title="Open Sidebar"
          >
            <SidebarIcon size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
