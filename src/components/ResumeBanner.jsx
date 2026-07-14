import { useEffect, useState } from "react";
import { getSavedConfigMeta, markConfigLoaded, clearSavedConfig } from "../usePersistedConfig";
import { Clock, X, ArrowRight } from "lucide-react";

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "câteva secunde";
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHrs < 24) return `${diffHrs} ore`;
  if (diffDays === 1) return "ieri";
  if (diffDays < 7) return `${diffDays} zile`;
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long" });
}

/**
 * Banner care apare când utilizatorul revine și are o configurație salvată anterior.
 *
 * @param {string} storageKey - cheia localStorage (ex: "balustrade")
 * @param {function} onResume - callback când userul alege să continue
 * @param {function} onDismiss - callback când userul închide bannerul
 */
export default function ResumeBanner({ storageKey, onResume, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [savedMeta, setSavedMeta] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const meta = getSavedConfigMeta(storageKey);
    if (meta && meta.hasSaved) {
      setSavedMeta(meta);
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible || !savedMeta) return null;

  const timeAgo = formatDate(savedMeta.savedAt);
  const product = savedMeta.productName || "configurația";

  const handleResume = () => {
    markConfigLoaded(storageKey);
    setVisible(false);
    onResume?.();
  };

  const handleDismiss = () => {
    clearSavedConfig(storageKey);
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl animate-slide-down">
      <div className="bg-amber-950/95 border border-amber-500/40 rounded-xl px-5 py-4 shadow-2xl backdrop-blur-md flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-amber-400" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-amber-100 text-sm font-medium">
            Ai o {product} salvată
          </p>
          <p className="text-amber-400/70 text-xs mt-0.5">
            {timeAgo ? `acum ${timeAgo}` : "anterior"}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleResume}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-lg text-sm font-semibold transition-colors duration-200"
          >
            <span>Continuă</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-amber-500/60 hover:text-amber-400 transition-colors duration-200 rounded-lg hover:bg-amber-500/10"
            title="Închide și șterge"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
