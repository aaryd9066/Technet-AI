import React, { useState } from "react";
import { Image as ImageIcon, Video, Sparkles, Loader2, Download, ExternalLink } from "lucide-react";
import { generateImage, startVideoGeneration, pollVideoOperation } from "../services/gemini";
import { useUser } from "../hooks/useUser";
import { cn } from "../utils";

export const MediaStudio: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ type: "image" | "video"; url: string } | null>(null);
  const [status, setStatus] = useState("");
  const { stats, deductCredits, saveMedia } = useUser();

  const handleGenerateImage = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (stats && stats.credits < 5) {
      alert("Insufficient credits. Image generation costs 5 credits.");
      return;
    }

    setIsGenerating(true);
    setStatus("Generating high-quality image...");
    try {
      const success = await deductCredits(5);
      if (!success) throw new Error("Credit deduction failed");

      const imageUrl = await generateImage(prompt);
      const id = Date.now().toString();
      setResult({ type: "image", url: imageUrl });
      saveMedia({ id, type: "image", url: imageUrl, prompt });
    } catch (err) {
      console.error(err);
      setStatus("Error generating image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (stats && stats.credits < 15) {
      alert("Insufficient credits. Video generation costs 15 credits.");
      return;
    }

    // Check for API key selection
    const aistudio = (window as any).aistudio;
    if (typeof window !== "undefined" && aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        alert("Video generation requires a paid API key. Please select one.");
        await aistudio.openSelectKey();
        return;
      }
    }

    setIsGenerating(true);
    setStatus("Initiating video generation (this may take a few minutes)...");
    try {
      const success = await deductCredits(15);
      if (!success) throw new Error("Credit deduction failed");

      const operation = await startVideoGeneration(prompt);
      setStatus("Video is being rendered. Please wait...");
      const videoUrl = await pollVideoOperation(operation);
      
      if (videoUrl) {
        const id = Date.now().toString();
        setResult({ type: "video", url: videoUrl });
        saveMedia({ id, type: "video", url: videoUrl, prompt });
      }
    } catch (err) {
      console.error(err);
      setStatus("Error generating video.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Media Studio</h2>
          <p className="text-zinc-500">Create stunning visuals with Nano Banana 2 and Veo 3.1</p>
        </header>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Your Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create... (e.g., 'A futuristic cyberpunk city with neon lights and flying cars')"
              className="w-full bg-zinc-950 border border-zinc-800 text-white p-6 rounded-2xl focus:outline-none focus:border-cyan-500/50 min-h-[120px] resize-none text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating || !prompt.trim()}
              className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-cyan-500/50 transition-all hover:bg-zinc-900 disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <ImageIcon size={24} />
              </div>
              <div className="text-center">
                <span className="block font-bold text-white">Generate Image</span>
                <span className="text-xs text-zinc-500">5 Credits</span>
              </div>
            </button>

            <button
              onClick={handleGenerateVideo}
              disabled={isGenerating || !prompt.trim()}
              className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 transition-all hover:bg-zinc-900 disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Video size={24} />
              </div>
              <div className="text-center">
                <span className="block font-bold text-white">Generate Video</span>
                <span className="text-xs text-zinc-500">15 Credits</span>
              </div>
            </button>
          </div>
        </div>

        {(isGenerating || result) && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 blur-xl bg-cyan-500/20 animate-pulse rounded-full" />
                  <Loader2 className="animate-spin text-cyan-400 relative" size={48} />
                </div>
                <p className="text-lg font-medium text-white">{status}</p>
                <p className="text-sm text-zinc-500 italic">This usually takes 10-30 seconds for images, longer for videos.</p>
              </div>
            ) : result && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-cyan-400" size={20} />
                    Generation Result
                  </h3>
                  <div className="flex gap-2">
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white transition-colors"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
                
                <div className="aspect-square max-w-lg mx-auto rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                  {result.type === "image" ? (
                    <img src={result.url} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <video src={result.url} controls className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
