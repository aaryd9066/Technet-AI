import React, { useState, useRef } from "react";
import { Upload, Edit3, Loader2, Download, RefreshCw, Wand2, Sparkles } from "lucide-react";
import { editImage } from "../services/gemini";
import { useUser } from "../hooks/useUser";
import { cn } from "../utils";

export const ImageEditor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { stats, deductCredits, saveMedia } = useUser();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt.trim() || isProcessing) return;
    if (stats && stats.credits < 8) {
      alert("Insufficient credits. Image editing costs 8 credits.");
      return;
    }

    setIsProcessing(true);
    try {
      const success = await deductCredits(8);
      if (!success) throw new Error("Credit deduction failed");

      const editedUrl = await editImage(image, prompt);
      setResult(editedUrl);
      saveMedia({
        id: Date.now().toString(),
        type: "image",
        url: editedUrl,
        prompt: `Edited: ${prompt}`,
      });
    } catch (err) {
      console.error(err);
      alert("Error editing image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">AI Image Editor</h2>
          <p className="text-zinc-500">Transform your photos with natural language instructions</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side: Upload & Input */}
          <div className="space-y-6">
            <div 
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={cn(
                "aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group",
                image ? "border-zinc-800" : "border-zinc-800 hover:border-cyan-500/50 bg-zinc-900/30"
              )}
            >
              {image ? (
                <>
                  <img src={image} className="w-full h-full object-cover" alt="Original" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <RefreshCw className="text-white" size={32} />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-4 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                    <Upload size={32} />
                  </div>
                  <p className="text-zinc-400 font-medium">Click to upload image</p>
                  <p className="text-xs text-zinc-600 mt-2">Supports JPG, PNG</p>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Edit3 size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Instructions</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Change the background to a beach' or 'Make it look like a pencil sketch'"
                className="w-full bg-zinc-950 border border-zinc-800 text-white p-4 rounded-xl focus:outline-none focus:border-cyan-500/50 min-h-[100px] resize-none"
              />
              <button
                onClick={handleEdit}
                disabled={!image || !prompt.trim() || isProcessing}
                className="w-full py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    Apply Changes (8 Credits)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Side: Result */}
          <div className="space-y-6">
            <div className={cn(
              "aspect-square rounded-3xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center overflow-hidden relative",
              !result && "opacity-50"
            )}>
              {result ? (
                <img src={result} className="w-full h-full object-cover" alt="Result" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-600 mx-auto mb-4">
                    <Sparkles size={32} />
                  </div>
                  <p className="text-zinc-500 font-medium">Your edited image will appear here</p>
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="animate-spin text-cyan-400" size={48} />
                  <p className="text-white font-medium">Technet is editing...</p>
                </div>
              )}
            </div>

            {result && (
              <a
                href={result}
                download="edited-image.png"
                className="w-full py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Result
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
