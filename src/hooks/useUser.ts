import { useState, useEffect } from "react";
import { UserStats, MediaItem } from "../types";
import { useAuth } from "../contexts/AuthContext";

export function useUser() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user) {
      setStats(null);
      setMedia([]);
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch("/api/user/stats");
      if (!res.ok) {
        if (res.status === 401) {
          setStats(null);
          setMedia([]);
          return;
        }
        throw new Error("Failed to fetch stats");
      }
      const data = await res.json();
      if (data.user) {
        setStats({
          credits: data.user.credits,
          imagesGenerated: data.media.filter((m: any) => m.type === "image").length,
          videosGenerated: data.media.filter((m: any) => m.type === "video").length,
        });
        setMedia(data.media || []);
      }
    } catch (err) {
      console.error("fetchStats error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deductCredits = async (amount: number) => {
    try {
      const res = await fetch("/api/user/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const data = await res.json();
        setStats((prev) => prev ? { ...prev, credits: data.remaining } : null);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const saveMedia = async (item: Omit<MediaItem, "timestamp">) => {
    try {
      await fetch("/api/media/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return { stats, media, loading, deductCredits, saveMedia, refresh: fetchStats };
}
