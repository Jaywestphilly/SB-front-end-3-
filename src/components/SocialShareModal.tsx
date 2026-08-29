import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StockTicker, ViewTab } from "../types";
import {
  X,
  Share2,
  Copy,
  Check,
  Twitter,
  MessageSquare,
  MessageCircle,
  Sparkles,
  Image,
  Smartphone,
  ExternalLink,
  Zap,
  Send,
  Link2,
  TrendingUp,
  ShieldCheck,
  Layers,
  Download,
  Bot,
  Radio,
  Cpu,
  Building2,
  Orbit,
  Award
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { computeDeterministicSignal } from "../utils/signalCalculator";
import { getShareMetadataForRoute, TAB_TO_ROUTE, TAB_TITLES } from "../app/router";
import { useModalStore, ShareTarget } from "../stores/modalStore";

interface SocialShareModalProps {
  stock?: StockTicker | null;
  target?: ShareTarget | null;
  isOpen: boolean;
  onClose: () => void;
}

type ShareViewTab = "sms" | "card" | "links";
type SmsPreset = "thumbnail" | "dossier" | "alert";
type CardFormat = "landscape" | "vertical" | "square";

const POPULAR_SHARE_TARGETS: Array<{ id: ViewTab; label: string; icon: any; category: string }> = [
  { id: "agent_join", label: "Register Autonomous AI Agent", icon: Sparkles, category: "Agent Economy" },
  { id: "agent_feed", label: "Machine Intelligence Agent Feed", icon: Radio, category: "Agent Economy" },
  { id: "agents", label: "Quant Agent Arena & Directory", icon: Bot, category: "Agent Economy" },
  { id: "agent_exchange", label: "Agent Bounties & Intelligence Exchange", icon: Cpu, category: "Agent Economy" },
  { id: "developer_docs", label: "Developer API & SDK Documentation", icon: Layers, category: "Developer" },
  { id: "credit", label: "Credit 800+ Bureau Dispute Hub", icon: ShieldCheck, category: "Wealth Mastery" },
  { id: "real_estate", label: "Real Estate Deal & Power Arbitrage", icon: Building2, category: "Wealth Mastery" },
  { id: "hedge_funds", label: "13F Hedge Fund Intelligence", icon: TrendingUp, category: "Markets" },
  { id: "dyson_swarm", label: "Dyson Swarm Orbital Solar Hub", icon: Orbit, category: "Deep Tech" },
  { id: "ai_revolution", label: "AI Enterprise & Supply Chain Hub", icon: Zap, category: "Deep Tech" },
];

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  stock: propStock,
  target: propTarget,
  isOpen,
  onClose,
}) => {
  const { shareStock, shareTarget } = useModalStore();
  const activeStock = propStock !== undefined ? propStock : shareStock;
  const activeTarget = propTarget !== undefined ? propTarget : shareTarget;

  const [activeTab, setActiveTab] = useState<ShareViewTab>("sms");
  const [smsPreset, setSmsPreset] = useState<SmsPreset>("thumbnail");
  const [customNote, setCustomNote] = useState("");
  const [cardFormat, setCardFormat] = useState<CardFormat>("landscape");
  const [selectedFeatureTab, setSelectedFeatureTab] = useState<ViewTab | "stock">("stock");

  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOgUrl, setCopiedOgUrl] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState(false);

  // Initialize selected feature tab when modal opens
  useEffect(() => {
    if (activeStock) {
      setSelectedFeatureTab("stock");
    } else if (activeTarget?.tab) {
      setSelectedFeatureTab(activeTarget.tab);
    } else if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("agent-join") || path.includes("register")) setSelectedFeatureTab("agent_join");
      else if (path.includes("feed")) setSelectedFeatureTab("agent_feed");
      else if (path.includes("agents") || path.includes("arena")) setSelectedFeatureTab("agents");
      else if (path.includes("exchange") || path.includes("bounties")) setSelectedFeatureTab("agent_exchange");
      else if (path.includes("credit")) setSelectedFeatureTab("credit");
      else if (path.includes("real-estate")) setSelectedFeatureTab("real_estate");
      else if (path.includes("dyson")) setSelectedFeatureTab("dyson_swarm");
      else if (path.includes("13f") || path.includes("hedge")) setSelectedFeatureTab("hedge_funds");
      else setSelectedFeatureTab("agent_join");
    }
  }, [isOpen, activeStock, activeTarget]);

  // Compute active metadata
  const metadata = useMemo(() => {
    if (selectedFeatureTab === "stock" && activeStock) {
      return getShareMetadataForRoute("watchlist", undefined, activeStock);
    }

    const targetTab = selectedFeatureTab === "stock" ? "watchlist" : selectedFeatureTab;
    const subTab = activeTarget?.subTab;
    return getShareMetadataForRoute(targetTab, subTab, null);
  }, [selectedFeatureTab, activeStock, activeTarget]);

  // Full SMS text body with custom note and explicit thumbnail link
  const smsBody = useMemo(() => {
    const notePrefix = customNote.trim() ? `💬 "${customNote.trim()}"\n\n` : "";
    const presetText = metadata.smsPresets[smsPreset] || metadata.smsPresets.thumbnail;
    return `${notePrefix}${presetText}`;
  }, [customNote, metadata, smsPreset]);

  // Handle trigger native SMS application
  const handleSendSms = () => {
    triggerHaptic("success");
    const isIOS =
      typeof navigator !== "undefined" &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const separator = isIOS ? "&" : "?";
    const smsHref = `sms:${separator}body=${encodeURIComponent(smsBody)}`;
    window.location.href = smsHref;
  };

  // Handle native Web Share API
  const handleNativeShare = async () => {
    triggerHaptic("selection");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: metadata.title,
          text: smsBody,
          url: metadata.url,
        });
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          navigator.clipboard.writeText(smsBody);
          setCopiedMessage(true);
          setTimeout(() => setCopiedMessage(false), 2500);
        }
      }
    } else {
      navigator.clipboard.writeText(smsBody);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  const handleCopyMessage = () => {
    triggerHaptic("success");
    navigator.clipboard.writeText(smsBody);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleCopyLink = () => {
    triggerHaptic("success");
    navigator.clipboard.writeText(metadata.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyOgUrl = () => {
    triggerHaptic("success");
    navigator.clipboard.writeText(metadata.ogImageUrl);
    setCopiedOgUrl(true);
    setTimeout(() => setCopiedOgUrl(false), 2500);
  };

  const handleWhatsAppShare = () => {
    triggerHaptic("selection");
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(smsBody)}`, "_blank");
  };

  const handleTwitterShare = () => {
    triggerHaptic("selection");
    const tweetText = `⚡ ${metadata.title}\n\n${metadata.url}\n\n#StockBloc #AI #Quant #FinTech`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank");
  };

  const handleTelegramShare = () => {
    triggerHaptic("selection");
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(metadata.url)}&text=${encodeURIComponent(metadata.title)}`,
      "_blank"
    );
  };

  const handleDownloadSvgCard = () => {
    triggerHaptic("success");
    setDownloadMsg(true);
    window.open(metadata.ogImageUrl, "_blank");
    setTimeout(() => setDownloadMsg(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-neutral-950 border border-cyan-500/40 alien-block-cut shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-900/40 bg-neutral-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-950/80 border border-cyan-400/40 rounded-lg text-cyan-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-alien-hud text-base text-white tracking-wider flex items-center gap-2">
                  <span>DISPATCH & SHARE HUB</span>
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 rounded font-mono">
                    LIVE INDEXED
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Deep-linked URLs & separate high-res visual thumbnails in text
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Hub / Feature Target Selector */}
          <div className="px-5 py-2.5 bg-neutral-900/40 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 shrink-0">
              TARGET:
            </span>
            {activeStock && (
              <button
                onClick={() => setSelectedFeatureTab("stock")}
                className={`px-2.5 py-1 rounded text-xs font-mono shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedFeatureTab === "stock"
                    ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30"
                    : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>${activeStock.symbol} Stock Card</span>
              </button>
            )}
            {POPULAR_SHARE_TARGETS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedFeatureTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedFeatureTab(item.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30"
                      : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-neutral-800 px-5 pt-3 bg-neutral-950 gap-2">
            <button
              onClick={() => setActiveTab("sms")}
              className={`pb-2.5 px-3 text-xs font-alien-hud tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "sms"
                  ? "border-cyan-400 text-cyan-300 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>TEXT MESSAGE & THUMBNAILS</span>
            </button>
            <button
              onClick={() => setActiveTab("card")}
              className={`pb-2.5 px-3 text-xs font-alien-hud tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "card"
                  ? "border-cyan-400 text-cyan-300 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Image className="w-4 h-4" />
              <span>VISUAL HUD CARD</span>
            </button>
            <button
              onClick={() => setActiveTab("links")}
              className={`pb-2.5 px-3 text-xs font-alien-hud tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "links"
                  ? "border-cyan-400 text-cyan-300 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>DEEP LINKS & EMBEDS</span>
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {activeTab === "sms" && (
              <div className="space-y-4">
                {/* Preset Selector */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono text-neutral-400">SELECT MESSAGE FORMAT:</span>
                  <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                    <button
                      onClick={() => setSmsPreset("thumbnail")}
                      className={`px-2.5 py-1 text-xs rounded transition-all cursor-pointer ${
                        smsPreset === "thumbnail"
                          ? "bg-cyan-500 text-black font-bold"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      🖼️ Link + Thumbnail
                    </button>
                    <button
                      onClick={() => setSmsPreset("dossier")}
                      className={`px-2.5 py-1 text-xs rounded transition-all cursor-pointer ${
                        smsPreset === "dossier"
                          ? "bg-cyan-500 text-black font-bold"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      📊 Full Dossier
                    </button>
                    <button
                      onClick={() => setSmsPreset("alert")}
                      className={`px-2.5 py-1 text-xs rounded transition-all cursor-pointer ${
                        smsPreset === "alert"
                          ? "bg-cyan-500 text-black font-bold"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      ⚡ Quick Alert
                    </button>
                  </div>
                </div>

                {/* Optional Custom Note */}
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">
                    ADD PERSONAL NOTE (OPTIONAL):
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. Check out this autonomous agent register form on Stock Bloc..."
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {/* Live Message Preview Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      TEXT MESSAGE PREVIEW (INCLUDES LIVE THUMBNAIL):
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400">
                      {smsBody.length} characters
                    </span>
                  </div>

                  <div className="p-3.5 bg-neutral-900/80 border border-cyan-900/40 rounded-lg font-mono text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed relative group">
                    {smsBody}
                  </div>
                </div>

                {/* Direct Thumbnail Attachment Card Preview */}
                <div className="p-3 bg-neutral-900/40 border border-neutral-800 rounded-lg flex items-center gap-3">
                  <div className="w-24 h-14 rounded border border-cyan-500/30 overflow-hidden bg-neutral-950 shrink-0 relative">
                    <img
                      src={metadata.ogImageUrl}
                      alt={metadata.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{metadata.title}</div>
                    <div className="text-[11px] text-neutral-400 truncate">{metadata.description}</div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5 truncate">{metadata.ogImageUrl}</div>
                  </div>
                  <button
                    onClick={handleCopyOgUrl}
                    className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded font-mono shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {copiedOgUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOgUrl ? "COPIED" : "COPY IMAGE"}</span>
                  </button>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleSendSms}
                    className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-alien-hud text-xs rounded-lg transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>SEND VIA TEXT / iMESSAGE</span>
                  </button>

                  <button
                    onClick={handleNativeShare}
                    className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold font-alien-hud text-xs rounded-lg border border-neutral-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>NATIVE MOBILE SHARE SHEET</span>
                  </button>
                </div>

                {/* Secondary Quick Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyMessage}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded-lg border border-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer font-mono"
                    >
                      {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMessage ? "MESSAGE COPIED" : "COPY MESSAGE"}</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded-lg border border-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer font-mono"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? "LINK COPIED" : "COPY LINK"}</span>
                    </button>
                  </div>

                  {/* Social Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleTwitterShare}
                      title="Share to 𝕏"
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleWhatsAppShare}
                      title="Share to WhatsApp"
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleTelegramShare}
                      title="Share to Telegram"
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-cyan-400 rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "card" && (
              <div className="space-y-4">
                {/* Visual HUD Card Preview */}
                <div className="relative rounded-xl border border-cyan-500/40 overflow-hidden bg-black shadow-2xl">
                  <img
                    src={metadata.ogImageUrl}
                    alt={metadata.title}
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                  <div className="text-xs font-mono text-neutral-400">
                    DYNAMIC VECTOR HUD CARD (1200x630 PX SVG)
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyOgUrl}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs rounded-lg border border-neutral-700 transition-colors cursor-pointer font-mono flex items-center gap-1.5"
                    >
                      {copiedOgUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedOgUrl ? "URL COPIED" : "COPY IMAGE URL"}</span>
                    </button>

                    <button
                      onClick={handleDownloadSvgCard}
                      className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-all cursor-pointer font-mono flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOWNLOAD HIGH-RES SVG</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "links" && (
              <div className="space-y-4">
                {/* Deep Link URL Box */}
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">
                    CANONICAL DEEP LINK URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={metadata.url}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-lg font-mono shrink-0 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? "COPIED" : "COPY"}</span>
                    </button>
                  </div>
                </div>

                {/* Open Graph Image URL Box */}
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">
                    DIRECT SOCIAL THUMBNAIL / OG IMAGE URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={metadata.ogImageUrl}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyOgUrl}
                      className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-lg font-mono shrink-0 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedOgUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedOgUrl ? "COPIED" : "COPY"}</span>
                    </button>
                  </div>
                </div>

                {/* HTML & Markdown Embed Snippets */}
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">
                    MARKDOWN SHARE SNIPPET:
                  </label>
                  <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-300 select-all">
                    {`[![${metadata.title}](${metadata.ogImageUrl})](${metadata.url})`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3 border-t border-neutral-800/80 bg-neutral-950 flex items-center justify-between text-xs text-neutral-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% ROUTE INDEXED & READY TO SHARE</span>
            </span>
            <span className="text-cyan-400/80">{metadata.badge}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SocialShareModal;
