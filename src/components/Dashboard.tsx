import React from "react";
import { useUser } from "../hooks/useUser";
import { Image as ImageIcon, Video, Clock, Zap, History } from "lucide-react";
import { formatTime, cn } from "../utils";

export const Dashboard: React.FC = () => {
  const { stats, media, loading } = useUser();

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-zinc-950">
      <div className="animate-pulse text-cyan-400 font-bold tracking-widest">LOADING TECHNET...</div>
    </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="text-center space-y-2">
          <h2 className="text-4xl font-bold text-white tracking-tight">Welcome back, <span className="text-cyan-400">User</span></h2>
          <p className="text-zinc-500">Here's an overview of your AI Studio activity.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={80} className="text-cyan-400" />
            </div>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">Available Credits</p>
            <h3 className="text-5xl font-black text-white">{stats?.credits}</h3>
            <p className="text-xs text-zinc-600 mt-4">Resets every 24 hours</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ImageIcon size={80} className="text-indigo-400" />
            </div>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">Images Created</p>
            <h3 className="text-5xl font-black text-white">{stats?.imagesGenerated}</h3>
            <p className="text-xs text-zinc-600 mt-4">Lifetime generations</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Video size={80} className="text-purple-400" />
            </div>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">Videos Created</p>
            <h3 className="text-5xl font-black text-white">{stats?.videosGenerated}</h3>
            <p className="text-xs text-zinc-600 mt-4">Lifetime generations</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <History className="text-cyan-400" size={24} />
              Recent Generations
            </h3>
          </div>

          {media.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {media.slice(0, 8).map((item) => (
                <div key={item.id} className="group bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all">
                  <div className="aspect-square relative overflow-hidden">
                    {item.type === "image" ? (
                      <img src={item.url} alt={item.prompt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <Video className="text-zinc-600" size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <p className="text-xs text-white line-clamp-2">{item.prompt}</p>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between bg-zinc-900/50">
                    <span className={cn(
                      "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                      item.type === "image" ? "bg-cyan-500/10 text-cyan-400" : "bg-purple-500/10 text-purple-400"
                    )}>
                      {item.type}
                    </span>
                    <div className="flex items-center gap-1 text-zinc-500 text-[10px]">
                      <Clock size={10} />
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl p-20 text-center">
              <p className="text-zinc-500">No generations yet. Start creating in the Media Studio!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
