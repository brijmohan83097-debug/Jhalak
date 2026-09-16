import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Film, Image as ImageIcon, Sparkles, Plus, Loader2 } from 'lucide-react';
import { SupportedLanguage, translations } from '../translations';
import { User } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlide?: (mediaUrl: string, mediaType: 'image' | 'video', caption: string) => void;
  onAddStory?: (mediaUrl: string, mediaType: 'image' | 'video', caption: string) => void;
  currentUser?: User;
  currentLanguage?: SupportedLanguage;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onAddSlide,
  onAddStory,
  currentUser,
  currentLanguage = 'en',
}) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[currentLanguage];

  if (!isOpen) return null;

  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    setMediaType(isVideo ? 'video' : 'image');

    if (isVideo) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setIsCompressing(true);
      try {
        // Automatically compress/resize image to max 800px width/height and JPEG 0.7 quality
        const compressed = await compressImage(file, 800, 800, 0.7);
        setMediaUrl(compressed);
      } catch (err) {
        console.warn('Story image compression fallback:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setMediaUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    const isVideo = urlInput.endsWith('.mp4') || urlInput.endsWith('.webm');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaUrl(urlInput.trim());
    setUrlInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) return;

    const addFn = onAddStory || onAddSlide;
    if (addFn) {
      addFn(mediaUrl, mediaType, caption.trim());
    }
    setMediaUrl('');
    setCaption('');
    onClose();
  };

  return (
    <div
      id="create-story-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 flex items-center justify-center p-[2px]">
              <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 text-rose-500" />
              </div>
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Add to Your Story
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close story creation"
            className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Media Preview or Upload Area */}
          {!mediaUrl ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-8 text-center bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/80 transition">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="story-file-input"
              />
              <div className="w-14 h-14 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                Upload Photo or Video
              </h4>
              <p className="text-xs text-neutral-500 mb-4 max-w-xs">
                Select media directly from your phone gallery or camera
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Choose Media</span>
              </button>

              <div className="w-full flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
                <span className="text-[10px] uppercase font-semibold text-neutral-400">or enter URL</span>
                <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
              </div>

              <div className="w-full flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!urlInput.trim()}
                  className="px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold disabled:opacity-40"
                >
                  Load
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative aspect-[9/16] max-h-[360px] w-full rounded-2xl overflow-hidden bg-black mx-auto flex items-center justify-center">
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition"
                  title="Remove and choose different media"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Caption Input */}
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Story Caption (Optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add text or thought to your story..."
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                  maxLength={120}
                />
              </div>
            </div>
          )}

          {/* Footer Submit */}
          {mediaUrl && (
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white font-semibold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Share to Your Story</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
