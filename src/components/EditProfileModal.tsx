import React, { useState } from 'react';
import { X, Check, Camera, Sparkles, Upload, RefreshCw, Loader2 } from 'lucide-react';
import { User } from '../types';
import { SupportedLanguage, translations } from '../translations';
import { compressImage } from '../utils/imageCompressor';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  currentLanguage?: SupportedLanguage;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  onClose,
  onSave,
  currentLanguage = 'en',
}) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [website, setWebsite] = useState(user.website);
  const [avatar, setAvatar] = useState(user.avatar);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const t = translations[currentLanguage];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSavedToast(true);
    
    setTimeout(() => {
      onSave({
        ...user,
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        website: website.trim(),
        avatar: avatar.trim() || user.avatar,
      });
      onClose();
    }, 450);
  };

  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressingAvatar(true);
        // Automatically compress/resize image to max 800px width/height and JPEG 0.7 quality
        const compressed = await compressImage(file, 800, 800, 0.7);
        setAvatar(compressed);
      } catch (err) {
        console.warn('Canvas compression error, falling back to FileReader:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setAvatar(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressingAvatar(false);
      }
    }
  };

  return (
    <div
      id="edit-profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        {/* Quick Save Toast indicator */}
        {showSavedToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4" />
            <span>{t.profileUpdatedSuccess}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-bold text-base text-neutral-900 dark:text-white">
            {t.editProfile}
          </h3>
          <button
            id="edit-profile-close-btn"
            onClick={onClose}
            aria-label="Close edit profile"
            className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Avatar Preview and Selector */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={avatar}
                  alt="Current avatar"
                  className="w-18 h-18 rounded-full object-cover border-2 border-sky-500 shadow-sm"
                />
                {isCompressingAvatar && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                <label
                  htmlFor="avatar-file-upload"
                  className="absolute bottom-0 right-0 p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full cursor-pointer shadow-md transition"
                  title="Upload from device"
                >
                  <Camera className="w-3.5 h-3.5" />
                </label>
                <input
                  id="avatar-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-neutral-900 dark:text-white block mb-1">
                  {t.profilePhoto}
                </span>
                <p className="text-[11px] text-neutral-500 mb-2">
                  Upload an image from your device or paste a URL below
                </p>
                <button
                  type="button"
                  onClick={() => document.getElementById('avatar-file-upload')?.click()}
                  className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-xs font-semibold transition"
                >
                  Choose File
                </button>
              </div>
            </div>

            {/* Avatar URL input */}
            <div className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-700/60">
              <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1">
                {t.photoUrl}
              </label>
              <input
                id="edit-avatar-url"
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
              {t.nameLabel}
            </label>
            <input
              id="edit-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          {/* Username input */}
          <div>
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
              {t.usernameLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">@</span>
              <input
                id="edit-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-8 pr-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Website input */}
          <div>
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
              {t.websiteLabel}
            </label>
            <input
              id="edit-website-input"
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://instagram.com/yourhandle"
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Bio textarea */}
          <div>
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
              {t.bioLabel}
            </label>
            <textarea
              id="edit-bio-input"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              placeholder="Write a brief bio about yourself..."
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500 resize-none"
            />
            <span className="text-[10px] text-neutral-400 block text-right mt-0.5 font-mono">
              {bio.length}/150
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
            >
              {t.cancel}
            </button>
            <button
              id="save-profile-btn"
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <Check className="w-4 h-4" /> {t.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
