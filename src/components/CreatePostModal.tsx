import React, { useState, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Sparkles,
  MapPin,
  Hash,
  ArrowLeft,
  Check,
  UploadCloud,
  Clapperboard,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Film,
} from 'lucide-react';
import { Post, User, Reel } from '../types';
import { samplePresetPhotos, samplePresetVideos } from '../data/mockData';

interface CreatePostModalProps {
  currentUser: User;
  onClose: () => void;
  onPostCreated: (newPost: Post, newReel?: Reel) => void;
}

const filterOptions = [
  { name: 'Normal', class: '' },
  { name: 'Clarendon', class: 'contrast-125 saturate-125' },
  { name: 'Vintage', class: 'sepia-[0.35] contrast-110 brightness-95' },
  { name: 'Vivid', class: 'saturate-150 contrast-115' },
  { name: 'Noir', class: 'grayscale contrast-125' },
  { name: 'Warm', class: 'sepia-[0.2] hue-rotate-[-10deg] brightness-105' },
];

const trendingAudioOptions = [
  'Original Audio • Original Track',
  'Kesariya • Acoustic Soul (Brahmāstra)',
  'Chaleya • Jawan Beats',
  'Brown Munde • AP Dhillon & Gurinder Gill',
  'Pasoori • Coke Studio Beats',
  'Dil Nu • Punjabi Wave',
  'Apna Bana Le • Soulful Melodies',
  'Raanjhanaa • Flute & Classical Tabla',
  'Baarishein • Anuv Jain Indie Acoustic',
  'Taal Se Taal • Flute & Tabla Fusion',
  'Maan Meri Jaan • King Pop',
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  currentUser,
  onClose,
  onPostCreated,
}) => {
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [step, setStep] = useState<'upload' | 'edit' | 'caption'>('upload');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedAudio, setSelectedAudio] = useState('Original Audio');
  const [customAudio, setCustomAudio] = useState('');
  const [isCustomAudioActive, setIsCustomAudioActive] = useState(false);
  const [shareAsReel, setShareAsReel] = useState(true);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [previewPlaying, setPreviewPlaying] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const objectUrl = URL.createObjectURL(file);
      setMediaType(isVideo ? 'video' : 'image');
      setSelectedMediaUrl(objectUrl);
      setStep('edit');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (isVideo || isImage) {
        const objectUrl = URL.createObjectURL(file);
        setMediaType(isVideo ? 'video' : 'image');
        setSelectedMediaUrl(objectUrl);
        setStep('edit');
      }
    }
  };

  const handlePickPresetPhoto = (preset: (typeof samplePresetPhotos)[0]) => {
    setMediaType('image');
    setSelectedMediaUrl(preset.url);
    setCaption(preset.caption);
    setTagsInput(preset.tags.join(', '));
    setStep('edit');
  };

  const handlePickPresetVideo = (preset: (typeof samplePresetVideos)[0]) => {
    setMediaType('video');
    setSelectedMediaUrl(preset.url);
    setCaption(preset.caption);
    setSelectedAudio(preset.audioTitle);
    setTagsInput(preset.tags.join(', '));
    setStep('edit');
  };

  const togglePreviewPlay = () => {
    if (!previewVideoRef.current) return;
    if (previewVideoRef.current.paused) {
      previewVideoRef.current.play();
      setPreviewPlaying(true);
    } else {
      previewVideoRef.current.pause();
      setPreviewPlaying(false);
    }
  };

  const finalAudioTitle = isCustomAudioActive && customAudio.trim()
    ? customAudio.trim()
    : selectedAudio;

  const handleShare = () => {
    if (!selectedMediaUrl) return;

    const parsedTags = tagsInput
      .split(/[, #]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const postId = `post-${Date.now()}`;
    const newPost: Post = {
      id: postId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      isVerified: currentUser.isVerified,
      location: location.trim() || undefined,
      mediaUrl: selectedMediaUrl,
      mediaType,
      caption: caption.trim() || (mediaType === 'video' ? 'New Reel' : 'No caption'),
      tags: parsedTags,
      likesCount: 0,
      isLiked: false,
      isSaved: false,
      comments: [],
      timestamp: 'Just now',
      filter: mediaType === 'image' ? selectedFilter : undefined,
      audioTitle: mediaType === 'video' ? finalAudioTitle : undefined,
      viewsCount: mediaType === 'video' ? 1 : undefined,
    };

    let newReel: Reel | undefined;
    if (mediaType === 'video' && shareAsReel) {
      newReel = {
        id: `reel-${Date.now()}`,
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
        videoUrl: selectedMediaUrl,
        caption: caption.trim() || 'New Reel',
        audioTitle: finalAudioTitle,
        audioArtist: currentUser.username,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: false,
        isSaved: false,
        comments: [],
        tags: parsedTags,
        timestamp: 'Just now',
      };
    }

    onPostCreated(newPost, newReel);
    onClose();
  };

  return (
    <div
      id="create-post-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-12">
            {step !== 'upload' ? (
              <button
                id="create-post-back-btn"
                onClick={() => setStep(step === 'caption' ? 'edit' : 'upload')}
                className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}
          </div>

          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {step === 'upload' && 'Create new post'}
            {step === 'edit' && (mediaType === 'video' ? 'Reel & Audio settings' : 'Select filter')}
            {step === 'caption' && 'New post details'}
          </h2>

          <div className="w-16 flex justify-end">
            {step === 'upload' && (
              <button
                id="create-post-close-btn"
                onClick={onClose}
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {step === 'edit' && (
              <button
                id="create-post-next-btn"
                onClick={() => setStep('caption')}
                className="text-sm font-semibold text-sky-500 hover:text-sky-600"
              >
                Next
              </button>
            )}
            {step === 'caption' && (
              <button
                id="create-post-share-btn"
                onClick={handleShare}
                className="text-sm font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Share
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center min-h-[380px]">
              {/* Media Type Switcher (Photo vs Video/Reel) */}
              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-4">
                <button
                  id="tab-select-photo"
                  onClick={() => setMediaType('image')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    mediaType === 'image'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo Post</span>
                </button>
                <button
                  id="tab-select-video"
                  onClick={() => setMediaType('video')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    mediaType === 'video'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Clapperboard className="w-4 h-4 text-amber-500" />
                  <span>Video / Reel</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition text-center ${
                  isDragging
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20'
                    : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3 text-neutral-600 dark:text-neutral-400">
                  {mediaType === 'video' ? (
                    <Film className="w-7 h-7 text-rose-500" />
                  ) : (
                    <UploadCloud className="w-7 h-7 text-sky-500" />
                  )}
                </div>
                <h3 className="text-base font-medium text-neutral-900 dark:text-white mb-1">
                  Drag {mediaType === 'video' ? 'videos (MP4, WEBM)' : 'photos (JPG, PNG, WEBP)'} here
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  {mediaType === 'video'
                    ? 'High definition vertical Reels or horizontal clips'
                    : 'Supports high-res photography'}
                </p>
                <button
                  id="select-computer-btn"
                  type="button"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition"
                >
                  Select from computer
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Curated Presets: Photos or Videos depending on active mediaType */}
              <div className="w-full max-w-lg mt-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {mediaType === 'video' ? 'Or pick a sample video clip' : 'Or pick a sample photo'}
                  </span>
                </div>

                {mediaType === 'video' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {samplePresetVideos.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handlePickPresetVideo(preset)}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-sky-500 transition text-left bg-neutral-950 p-2 flex flex-col justify-end"
                      >
                        <video
                          src={preset.url}
                          muted
                          preload="metadata"
                          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-white truncate">
                            <Clapperboard className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span>{preset.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-300 truncate block">
                            {preset.audioTitle}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {samplePresetPhotos.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handlePickPresetPhoto(preset)}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:scale-105 transition"
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-medium text-center p-1 transition">
                          {preset.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'edit' && selectedMediaUrl && (
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Media Preview */}
              <div className="relative w-full md:w-3/5 aspect-square bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center group">
                {mediaType === 'video' ? (
                  <>
                    <video
                      ref={previewVideoRef}
                      src={selectedMediaUrl}
                      autoPlay
                      loop
                      playsInline
                      muted={previewMuted}
                      className="w-full h-full object-cover"
                    />
                    {/* Floating Controls */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                      <button
                        type="button"
                        onClick={togglePreviewPlay}
                        className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition"
                        aria-label={previewPlaying ? 'Pause video' : 'Play video'}
                      >
                        {previewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMuted((prev) => !prev)}
                        className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition"
                        aria-label={previewMuted ? 'Unmute video' : 'Mute video'}
                      >
                        {previewMuted ? (
                          <VolumeX className="w-4 h-4 text-white/90" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <img
                    src={selectedMediaUrl}
                    alt="Edit preview"
                    className={`w-full h-full object-cover ${selectedFilter}`}
                  />
                )}
              </div>

              {/* Settings Column: Filters for image, or Audio & Reel toggles for video */}
              <div className="w-full md:w-2/5 flex flex-col gap-4">
                {mediaType === 'image' ? (
                  <>
                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Choose a Filter
                    </h4>
                    <div className="grid grid-cols-3 gap-2.5">
                      {filterOptions.map((f) => (
                        <button
                          key={f.name}
                          onClick={() => setSelectedFilter(f.class)}
                          className={`flex flex-col items-center p-1.5 rounded-lg border transition ${
                            selectedFilter === f.class
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                          }`}
                        >
                          <div className="w-14 h-14 rounded overflow-hidden mb-1">
                            <img
                              src={selectedMediaUrl}
                              alt={f.name}
                              className={`w-full h-full object-cover ${f.class}`}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                            {f.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Audio Track Picker */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Music className="w-4 h-4 text-rose-500" />
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                          Select Audio Track
                        </h4>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {trendingAudioOptions.map((track) => (
                          <button
                            key={track}
                            type="button"
                            onClick={() => {
                              setSelectedAudio(track);
                              setIsCustomAudioActive(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between border transition ${
                              !isCustomAudioActive && selectedAudio === track
                                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                            }`}
                          >
                            <span className="truncate">{track}</span>
                            {!isCustomAudioActive && selectedAudio === track && (
                              <Check className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Custom Audio input */}
                      <div className="mt-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Or type custom track name..."
                            value={customAudio}
                            onFocus={() => setIsCustomAudioActive(true)}
                            onChange={(e) => {
                              setCustomAudio(e.target.value);
                              setIsCustomAudioActive(true);
                            }}
                            className="flex-1 bg-neutral-50 dark:bg-neutral-800 text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reels sharing toggle */}
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Clapperboard className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                            Share to Reels Tab
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Also display in full-screen Reels feed
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={shareAsReel}
                        onChange={(e) => setShareAsReel(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 accent-rose-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'caption' && selectedMediaUrl && (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Media Thumbnail */}
              <div className="relative w-full md:w-1/2 aspect-square rounded-xl overflow-hidden bg-neutral-900">
                {mediaType === 'video' ? (
                  <>
                    <video
                      src={selectedMediaUrl}
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1">
                      <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reel</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] truncate flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{finalAudioTitle}</span>
                    </div>
                  </>
                ) : (
                  <img
                    src={selectedMediaUrl}
                    alt="Post preview"
                    className={`w-full h-full object-cover ${selectedFilter}`}
                  />
                )}
              </div>

              {/* Post Details Form */}
              <div className="w-full md:w-1/2 flex flex-col gap-3.5">
                {/* User author info */}
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                    {currentUser.username}
                  </span>
                </div>

                {/* Caption input */}
                <div>
                  <textarea
                    id="post-caption-textarea"
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={
                      mediaType === 'video'
                        ? 'Write a catchy reel caption...'
                        : 'Write a caption...'
                    }
                    className="w-full bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 resize-none"
                  />
                  <span className="text-[11px] text-neutral-400 text-right block mt-0.5">
                    {caption.length}/2,200
                  </span>
                </div>

                {/* Location input */}
                <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  <input
                    id="post-location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location (e.g. Marine Drive, Mumbai)"
                    className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                {/* Tags input */}
                <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2">
                  <Hash className="w-4 h-4 text-neutral-400" />
                  <input
                    id="post-tags-input"
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Tags separated by commas (e.g. reels, mumbai, goa, jhalak)"
                    className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
