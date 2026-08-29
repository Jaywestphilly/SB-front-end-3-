import React, { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { Check, AlertCircle } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export const UsernamePromptModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        // Check if user document exists and has a username
        const docRef = doc(db, "users", user.uid);
        try {
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().username) {
            setIsOpen(false);
          } else {
            // Check if display name is available and usable as default
            const defaultName = user.displayName ? user.displayName.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() : "";
            setUsername(defaultName);
            setIsOpen(true);
          }
        } catch (e) {
          console.error("Error fetching user profile for username check:", e);
        }
      } else {
        setIsOpen(false);
        setUid(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !uid) return;

    // Simple validation
    if (username.length < 3 || username.length > 20) {
      setError("Username must be between 3 and 20 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Only letters, numbers, and underscores allowed.");
      return;
    }

    setLoading(true);
    setError(null);
    triggerHaptic("medium");

    try {
      // Note: In a production environment with strict rules, we would ensure
      // usernames are unique across the app using a separate 'usernames' collection.
      // For this implementation, we will update the user document.
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { username: username.toLowerCase() }, { merge: true });
      
      if (auth.currentUser && !auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: username });
      }

      setIsOpen(false);
      triggerHaptic("success");
    } catch (err: any) {
      console.error("Failed to save username", err);
      setError("Failed to save username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-sm bg-neutral-950 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative text-white space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white">Create Username</h3>
          <p className="text-xs text-neutral-400">
            Choose a unique username to use across paper trades, leaderboards, and the community forum.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-neutral-500 font-bold text-xs">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                placeholder="quant_trader_01"
                className="w-full pl-7 pr-3 py-3 rounded-xl bg-black/60 border border-white/15 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-400"
                autoFocus
              />
            </div>
            {error && <p className="text-[10px] text-rose-400 font-mono">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-lg shadow-cyan-500/20"
          >
            {loading ? "Saving..." : "Set Username"}
            {!loading && <Check className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
