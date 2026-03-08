import React, { useState } from "react";
import { useUser } from "../hooks/useUser";
import { Download, Trash2, ExternalLink, Filter, Search, Grid, List as ListIcon, Image as ImageIcon, Video } from "lucide-react";
import { cn } from "../utils";
import { motion, AnimatePresence } from "motion/react";

export const Creations: React.FC = () => {
  const { media, loading, refresh } = useUser();
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredMedia = media.filter((item) => {
    const matchesFilter = filter === "all" || item.type === filter;
    const matchesSearch = item.prompt.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this creation?")) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (res.ok) refresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-zinc-950">
      <div className="animate-pulse text-cyan-400 font-bold tracking-widest">SYNCING GALLERY...</div>
    </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tight">My Creations</h2>
          <p className="text-zinc-500">Your personal gallery of AI-generated masterpieces</p>
        </header>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Search prompts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-cyan-500/50 w-64"
              />
            </div>
            <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
              <button 
                onClick={() => setFilter("all")}
                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === "all" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}
              >
                All
              </button>
              <button 
                onClick={() => setFilter("image")}
                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === "image" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}
              >
                Images
              </button>
              <button 
                onClick={() => setFilter("video")}
                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === "video" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}
              >
                Videos
              </button>
            </div>
            <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500")}
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-500")}
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {filteredMedia.length > 0 ? (
          <div className={cn(
            "grid gap-6",
            viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          )}>
            <AnimatePresence>
              {filteredMedia.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "group bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden hover:border-cyan-500/30 transition-all",
                    viewMode === "list" && "flex items-center gap-6 p-4"
                  )}
                >
                  <div className={cn(
                    "relative overflow-hidden",
                    viewMode === "grid" ? "aspect-square" : "w-32 h-32 rounded-2xl shrink-0"
                  )}>
                    {item.type === "image" ? (
                      <img src={item.url} alt={item.prompt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <Video className="text-zinc-600" size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all">
                        <ExternalLink size={20} />
                      </a>
                      <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md rounded-full text-red-400 transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className={cn("p-5 flex flex-col justify-between flex-1", viewMode === "list" && "p-0")}>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn(
                          "text-[10px] uppercase font-black px-2 py-0.5 rounded-md tracking-widest",
                          item.type === "image" ? "bg-cyan-500/10 text-cyan-400" : "bg-purple-500/10 text-purple-400"
                        )}>
                          {item.type}
                        </span>
                        <span className="text-zinc-600 text-[10px] font-bold">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-3 font-medium leading-relaxed italic">
                        "{item.prompt}"
                      </p>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between">
                      <a 
                        href={item.url} 
                        download={`sigma-${item.id}`}
                        className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[3rem] p-32 text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-700">
              <ImageIcon size={40} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-400 mb-2">No creations found</h3>
            <p className="text-zinc-600 max-w-sm mx-auto">
              Your gallery is empty. Head over to the Media Studio to start generating.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
