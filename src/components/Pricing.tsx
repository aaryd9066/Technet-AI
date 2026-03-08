import React, { useState } from "react";
import { Zap, CreditCard, Smartphone, Check, ShieldCheck, Loader2, Lock } from "lucide-react";
import { useUser } from "../hooks/useUser";
import { cn } from "../utils";
import confetti from "canvas-confetti";
import { motion } from "motion/react";

export const Pricing: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | null>(null);
  const [vpa, setVpa] = useState("");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isVpaVerified, setIsVpaVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const { refresh } = useUser();

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const settings = await res.json();
        setIsLocked(settings.payments_locked === "true");
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const packages = [
    { id: 1, credits: 50, price: 25, label: "Starter" },
    { id: 2, credits: 150, price: 75, label: "Pro", popular: true },
    { id: 3, credits: 500, price: 250, label: "Elite" },
  ];

  const handlePurchase = async () => {
    if (selectedPackage === null || !paymentMethod) return;
    
    setIsProcessing(true);
    const pkg = packages.find(p => p.id === selectedPackage)!;

    // Mock payment delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const res = await fetch("/api/user/add-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: pkg.credits,
          method: paymentMethod === "upi" ? `UPI (${selectedApp || vpa})` : "Card"
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#22d3ee", "#818cf8", "#ffffff"]
        });
        alert(`Successfully added ${pkg.credits} credits to your account!`);
        refresh();
        setSelectedPackage(null);
        setPaymentMethod(null);
      } else {
        const data = await res.json();
        alert(data.error || "Purchase failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h2 className="text-5xl font-black text-white tracking-tight">Refuel Your <span className="text-cyan-400">Technet</span></h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded border border-indigo-500/20">UPI Enabled</span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded border border-emerald-500/20">Instant Credits</span>
          </div>
          {isLocked && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl max-w-md mx-auto mt-6">
              <p className="text-red-500 text-sm font-bold flex items-center justify-center gap-2">
                <Lock size={16} />
                Payments are currently locked for maintenance.
              </p>
            </div>
          )}
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
            Get more credits to continue generating high-quality images and videos. 
            Each credit is priced at just <span className="text-white font-bold">$0.5</span>.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={cn(
                "relative p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 flex flex-col",
                selectedPackage === pkg.id 
                  ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.1)]" 
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
              )}
            >
              {pkg.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-black text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">{pkg.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{pkg.credits}</span>
                  <span className="text-zinc-500 font-bold">Credits</span>
                </div>
              </div>

              <div className="text-3xl font-bold text-white mb-8">
                ${pkg.price}
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm text-zinc-400">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Check size={12} />
                  </div>
                  Instant Delivery
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-400">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Check size={12} />
                  </div>
                  No Expiry Date
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-400">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Check size={12} />
                  </div>
                  Priority Support
                </li>
              </ul>

              <div className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                selectedPackage === pkg.id ? "bg-cyan-500 text-black" : "bg-zinc-800 text-zinc-400"
              )}>
                {selectedPackage === pkg.id ? "Selected" : "Select Plan"}
              </div>
            </div>
          ))}
        </div>

        {selectedPackage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-10 space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Secure Checkout</h3>
                <p className="text-zinc-500">Choose your preferred payment method to complete the purchase.</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setPaymentMethod("upi")}
                  className={cn(
                    "flex-1 md:flex-none flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all",
                    paymentMethod === "upi" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  <Smartphone size={20} />
                  <span className="font-bold">UPI</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod("card")}
                  className={cn(
                    "flex-1 md:flex-none flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all",
                    paymentMethod === "card" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  <CreditCard size={20} />
                  <span className="font-bold">Card</span>
                </button>
              </div>
            </div>

            {paymentMethod === "upi" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-6 overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["GPay", "PhonePe", "Paytm", "Amazon Pay"].map((app) => (
                    <button
                      key={app}
                      onClick={() => {
                        setSelectedApp(app);
                        setIsVpaVerified(true); // Auto-verify for app selection
                      }}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                        selectedApp === app ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center font-black text-xs">
                        {app[0]}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{app}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px bg-zinc-800 flex-1" />
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">OR USE VPA</span>
                  <div className="h-px bg-zinc-800 flex-1" />
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start bg-zinc-950/50 p-6 rounded-3xl border border-zinc-800/50">
                  <div className="space-y-4 flex-1 w-full">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Enter UPI ID (VPA)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={vpa}
                        onChange={(e) => {
                          setVpa(e.target.value);
                          setIsVpaVerified(false);
                        }}
                        placeholder="username@upi"
                        className={cn(
                          "w-full bg-zinc-900 border text-white px-6 py-4 rounded-2xl focus:outline-none transition-all pr-24",
                          isVpaVerified ? "border-emerald-500/50" : "border-zinc-800 focus:border-cyan-500/50"
                        )}
                      />
                      <button
                        onClick={async () => {
                          if (!vpa.includes("@")) return;
                          setIsVerifying(true);
                          await new Promise(r => setTimeout(r, 1000));
                          setIsVpaVerified(true);
                          setIsVerifying(false);
                        }}
                        disabled={!vpa.includes("@") || isVerifying || isVpaVerified}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-zinc-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-all disabled:opacity-50"
                      >
                        {isVerifying ? "..." : isVpaVerified ? "Verified" : "Verify"}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      Verified Merchant: Technet AI
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <button 
                      onClick={() => setShowQR(!showQR)}
                      className="text-xs font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-2"
                    >
                      {showQR ? "Hide QR Code" : "Show QR Code"}
                    </button>
                    {showQR && (
                      <div className="p-4 bg-white rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=technet@upi&pn=Technet%20AI&am=${packages.find(p => p.id === selectedPackage)?.price}&cu=USD`}
                          alt="UPI QR Code"
                          className="w-32 h-32"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="h-px bg-zinc-800" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold uppercase tracking-widest">
                <ShieldCheck size={18} className="text-emerald-500" />
                SSL Encrypted Payment
              </div>
              <button
                onClick={handlePurchase}
                disabled={isLocked || !paymentMethod || (paymentMethod === "upi" && !isVpaVerified && !selectedApp) || isProcessing}
                className="w-full md:w-auto px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ${packages.find(p => p.id === selectedPackage)?.price}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
