import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Ban,
  RotateCcw,
  CheckCircle,
  ExternalLink,
  Users,
  EyeOff,
  Filter,
} from 'lucide-react';
import { Post, Reel } from '../types';
import { moderationService, ReportedItemAggregate } from '../services/moderationService';

interface AdminModerationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  reels: Reel[];
  onKeepPost: (id: string) => void;
  onDeletePostPermanently: (id: string) => void;
  onBanUserAccount: (username: string) => void;
  onUnbanUser?: (username: string) => void;
}

export const AdminModerationDashboard: React.FC<AdminModerationDashboardProps> = ({
  isOpen,
  onClose,
  posts,
  reels,
  onKeepPost,
  onDeletePostPermanently,
  onBanUserAccount,
  onUnbanUser,
}) => {
  const [aggregates, setAggregates] = useState<ReportedItemAggregate[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'banned'>('queue');
  const [filterMode, setFilterMode] = useState<'all' | 'auto_hidden'>('all');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'keep' | 'delete' | 'ban';
    id: string;
    username: string;
  } | null>(null);

  const reloadData = () => {
    setAggregates(moderationService.getReportedAggregates());
    setBlockedUsers(moderationService.getBlockedUsers());
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
    }
  }, [isOpen]);

  useEffect(() => {
    return moderationService.subscribe(() => {
      reloadData();
    });
  }, []);

  if (!isOpen) return null;

  // Find media preview
  const getMediaForRecord = (id: string) => {
    const p = posts.find((item) => item.id === id);
    if (p) {
      return { url: p.mediaUrl, type: p.mediaType, caption: p.caption, userAvatar: p.userAvatar };
    }
    const r = reels.find((item) => item.id === id);
    if (r) {
      return { url: r.videoUrl, type: 'video' as const, caption: r.caption, userAvatar: r.userAvatar };
    }
    return null;
  };

  const filteredAggregates = aggregates.filter((item) => {
    if (filterMode === 'auto_hidden') {
      return item.isHiddenByModeration || item.reportCount >= 3;
    }
    return true;
  });

  const autoHiddenCount = aggregates.filter((item) => item.isHiddenByModeration || item.reportCount >= 3).length;

  const handleExecuteAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'keep') {
      onKeepPost(confirmAction.id);
    } else if (confirmAction.type === 'delete') {
      onDeletePostPermanently(confirmAction.id);
    } else if (confirmAction.type === 'ban') {
      onBanUserAccount(confirmAction.username);
    }

    setConfirmAction(null);
    reloadData();
  };

  return (
    <div
      id="admin-moderation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-neutral-900 dark:text-white">
                  Moderation Dashboard
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Admin / Mod View
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Automated UGC Safety, Banned Words & Multi-Report Queue
              </p>
            </div>
          </div>
          <button
            id="close-moderation-btn"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-col">
            <span className="text-neutral-500 text-[11px]">Reported Posts</span>
            <span className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
              {aggregates.length}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-col">
            <span className="text-rose-500 text-[11px] flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> Auto-Hidden (≥3)
            </span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {autoHiddenCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-col">
            <span className="text-amber-500 text-[11px] flex items-center gap-1">
              <Ban className="w-3 h-3" /> Banned Users
            </span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {blockedUsers.length}
            </span>
          </div>
        </div>

        {/* Tabs & Filters */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button
              id="tab-mod-queue"
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'queue'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Report Queue ({aggregates.length})
            </button>
            <button
              id="tab-mod-banned"
              onClick={() => setActiveTab('banned')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'banned'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Banned Accounts ({blockedUsers.length})
            </button>
          </div>

          {activeTab === 'queue' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-400 text-[11px]">Filter:</span>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                  filterMode === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('auto_hidden')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                  filterMode === 'auto_hidden'
                    ? 'bg-rose-500 text-white'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Auto-Hidden ({autoHiddenCount})
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3">
          {activeTab === 'queue' && (
            <>
              {filteredAggregates.length === 0 ? (
                <div className="py-14 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Queue All Clear!
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-sm mt-1">
                    No posts currently flagged or awaiting moderation review.
                  </p>
                </div>
              ) : (
                filteredAggregates.map((item) => {
                  const media = getMediaForRecord(item.id);
                  const isAutoHidden = item.isHiddenByModeration || item.reportCount >= 3;

                  return (
                    <div
                      key={item.id}
                      id={`reported-item-${item.id}`}
                      className={`p-4 rounded-xl border transition ${
                        isAutoHidden
                          ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between">
                        {/* Media Preview + Info */}
                        <div className="flex items-start gap-3 w-full sm:w-auto">
                          {media?.url ? (
                            <div className="w-14 h-14 rounded-lg bg-neutral-950 overflow-hidden flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                              {media.type === 'video' ? (
                                <video
                                  src={media.url}
                                  muted
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={media.url}
                                  alt="Reported content"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                              <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                          )}

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-neutral-900 dark:text-white">
                                @{item.username || 'unknown_user'}
                              </span>

                              {/* Report count badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  isAutoHidden
                                    ? 'bg-rose-500 text-white animate-pulse'
                                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                }`}
                              >
                                {isAutoHidden ? (
                                  <>
                                    <EyeOff className="w-2.5 h-2.5" />
                                    <span>{item.reportCount} Reports • Auto-Hidden</span>
                                  </>
                                ) : (
                                  <span>{item.reportCount} {item.reportCount === 1 ? 'Report' : 'Reports'}</span>
                                )}
                              </span>
                            </div>

                            {media?.caption && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 italic">
                                "{media.caption}"
                              </p>
                            )}

                            {/* Reasons badges */}
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {item.reasons.map((r, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Keep Post, Delete Post, Ban User */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                          {/* 1. Keep Post */}
                          <button
                            id={`btn-keep-${item.id}`}
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                type: 'keep',
                                id: item.id,
                                username: item.username,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                            title="Reset report count and keep post in public feed"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Keep</span>
                          </button>

                          {/* 2. Delete Post Permanently */}
                          <button
                            id={`btn-delete-${item.id}`}
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                type: 'delete',
                                id: item.id,
                                username: item.username,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                            title="Delete this post permanently from Jhalak"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>

                          {/* 3. Ban User Account */}
                          <button
                            id={`btn-ban-${item.id}`}
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                type: 'ban',
                                id: item.id,
                                username: item.username,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                            title="Ban creator account and remove all their posts"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Ban User</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'banned' && (
            <div className="space-y-2">
              {blockedUsers.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 text-xs">
                  No accounts are currently banned.
                </div>
              ) : (
                blockedUsers.map((username) => (
                  <div
                    key={username}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs">
                        <Ban className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white block">
                          @{username}
                        </span>
                        <span className="text-[10px] text-rose-500">
                          Banned from posting & commenting
                        </span>
                      </div>
                    </div>

                    {onUnbanUser && (
                      <button
                        onClick={() => {
                          onUnbanUser(username);
                          reloadData();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                      >
                        Unban
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Confirmation Modal Overlay */}
        {confirmAction && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-2xl text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                {confirmAction.type === 'keep' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                ) : confirmAction.type === 'delete' ? (
                  <Trash2 className="w-6 h-6 text-rose-500" />
                ) : (
                  <Ban className="w-6 h-6 text-purple-500" />
                )}
              </div>

              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                {confirmAction.type === 'keep' && 'Keep this post in public feed?'}
                {confirmAction.type === 'delete' && 'Permanently delete this post?'}
                {confirmAction.type === 'ban' && `Ban creator @${confirmAction.username}?`}
              </h4>

              <p className="text-xs text-neutral-500 leading-relaxed">
                {confirmAction.type === 'keep' &&
                  'This will clear all pending reports and restore public visibility.'}
                {confirmAction.type === 'delete' &&
                  'This post will be permanently removed from all feeds, explore, and user profiles.'}
                {confirmAction.type === 'ban' &&
                  'This will permanently ban the account and remove all their posts and reels from Jhalak.'}
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-action-mod"
                  type="button"
                  onClick={handleExecuteAction}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold text-white transition ${
                    confirmAction.type === 'keep'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : confirmAction.type === 'delete'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
