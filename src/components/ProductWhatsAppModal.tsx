import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  IndianRupee,
  Share2,
} from 'lucide-react';
import { ProductTag } from '../types';
import { safeEncodeURIComponent } from '../utils/safeEncoding';

interface ProductWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductTag;
  creator: {
    username: string;
    name?: string;
    avatar?: string;
    isVerified?: boolean;
  };
}

export const ProductWhatsAppModal: React.FC<ProductWhatsAppModalProps> = ({
  isOpen,
  onClose,
  product,
  creator,
}) => {
  const [copied, setCopied] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

  if (!isOpen) return null;

  // Clean WhatsApp number (default to a valid format if not provided)
  const rawNumber = product.whatsappNumber || '919876543210';
  const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
  const formattedPrice = `₹${product.price.toLocaleString('en-IN')}`;

  const defaultEnquiry = `Namaste @${creator.username}! 👋
I found your product "${product.title}" (${formattedPrice}) on Jhalak.
Is it currently available for order? Please share payment & delivery details. Dhanyawad! ✨`;

  const waUrl = `https://wa.me/${cleanNumber}?text=${safeEncodeURIComponent(defaultEnquiry)}`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(defaultEnquiry);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSentNotice(true);
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // If popup is blocked by iframe sandbox, user can use copied message
    }
  };

  return (
    <div
      id="product-whatsapp-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                Product Details & WhatsApp Order
              </h3>
              <p className="text-[11px] text-neutral-500">
                Direct seller contact • Small Business & Creator Store
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close product modal"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Creator & Business Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={creator.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120'}
                alt={creator.username}
                className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                    {creator.name || creator.username}
                  </span>
                  {creator.isVerified && (
                    <span className="text-sky-500 text-xs">✓</span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">@{creator.username}</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Seller
            </span>
          </div>

          {/* Product Showcase Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/5 via-emerald-500/5 to-transparent border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                  {product.category || 'Handcrafted & D2C'}
                </span>
                <h4 className="font-bold text-base text-neutral-900 dark:text-white mt-1.5 leading-snug">
                  {product.title}
                </h4>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formattedPrice}
                </span>
                <span className="block text-[10px] text-neutral-400 font-medium">
                  Inclusive of all taxes
                </span>
              </div>
            </div>

            {product.description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2.5 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                🇮🇳 Pan-India Shipping Available
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                ⚡ Instant UPI Support
              </span>
            </div>
          </div>

          {/* WhatsApp Enquiry Preview Card */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                Pre-filled WhatsApp Message:
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline text-[11px] font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy Text
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 select-all whitespace-pre-line leading-relaxed">
              {defaultEnquiry}
            </p>
          </div>

          {/* WhatsApp CTA Primary Button */}
          <div className="space-y-2 pt-1">
            <a
              id="chat-on-whatsapp-cta-btn"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-bold text-sm shadow-md transition shadow-emerald-500/20"
            >
              {/* WhatsApp SVG Icon */}
              <svg
                className="w-5 h-5 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.175.201-.351.226-.652.075-.3-.15-1.267-.467-2.413-1.488-.892-.796-1.493-1.78-1.669-2.08-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.3.301-.5.1-.201.05-.376-.025-.526-.075-.15-.678-1.633-.929-2.238-.244-.59-.493-.51-.678-.52l-.578-.01c-.2 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.126 3.246 5.15 4.553.72.31 1.282.496 1.72.636.723.23 1.381.197 1.901.12.579-.088 1.78-.728 2.03-1.431.25-.704.25-1.306.175-1.432-.075-.125-.276-.201-.577-.351z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.17L2 22l4.982-1.406A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.25a8.21 8.21 0 01-4.288-1.198l-.307-.184-2.964.837.842-2.89-.2-.319A8.212 8.212 0 013.75 12c0-4.549 3.701-8.25 8.25-8.25s8.25 3.701 8.25 8.25-3.701 8.25-8.25 8.25z" />
              </svg>
              <span>Chat on WhatsApp / व्हाट्सएप पर चैट करें</span>
              <ExternalLink className="w-4 h-4 ml-0.5 opacity-80" />
            </a>

            {sentNotice && (
              <p className="text-[11px] text-center text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                ✓ Opening WhatsApp with enquiry for @{creator.username}...
              </p>
            )}

            <p className="text-[11px] text-center text-neutral-400">
              WhatsApp number: <span className="font-mono text-neutral-600 dark:text-neutral-300">+{cleanNumber}</span> • Instant response from creator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
