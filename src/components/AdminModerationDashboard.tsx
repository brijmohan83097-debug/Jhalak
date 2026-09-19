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
import { Post, Reel, User } from '../types';
import { moderationService, ReportedItemAggregate } from '../services/moderationService';
import { ADMIN_EMAIL, isSuperAdmin } from '../constants/admin';
import { IndianRupee, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface AdminModerationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
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
  currentUser,
  posts,
  reels,
  onKeepPost,
  onDeletePostPermanently,
  onBanUserAccount,
  onUnbanUser,
}) => {
  // STRICT SECURITY CHECK: Strictly restricted to Brijmohan83097@gmail.com
  if (!isOpen || !isSuperAdmin(currentUser)) return null;

  const [aggregates, setAggregates] = useState<ReportedItemAggregate[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'banned' | 'payouts'>('queue');
  const [filterMode, setFilterMode] = useState<'all' | 'auto_hidden'>('all');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'keep' | 'delete' | 'ban';
    id: string;
    username: string;
  } | null>(null);

  // Admin Payouts State
  const [payoutRequests, setPayoutRequests] = useState<Array<{
    id: string;
    username: string;
    name: string;
    amount: number;
    upiId: string;
    date: string;
    status: 'pending' | 'approved' | 'settled' | 'rejected';
    followers: number;
    watchHours: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('jhalak_admin_payout_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'payout-req-101',
        username: 'bhojpuri_star',
        name: 'Bhojpuri Music Creator',
        amount: 2500,
        upiId: 'bhojpuristar@upi',
        date: new Date().toLocaleDateString('en-IN'),
        status: 'settled',
        followers: 12450,
        watchHours: 21300,
      },
      {
        id: 'payout-req-102',
        username: 'patna_vines',
        name: 'Patna Vines Official',
        amount: 1200,
        upiId: 'patnavines@okhdfcbank',
        date: new Date().toLocaleDateString('en-IN'),
        status: 'pending',
        followers: 10800,
        watchHours: 20450,
      },
    ];
  });

  const [bonusCreatorUsername, setBonusCreatorUsername] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [payoutActionFeedback, setPayoutActionFeedback] = useState<string | null>(null);

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
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-neutral-900 dark:text-white">
                  Super Admin Dashboard
                </h2>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-black shadow-xs">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Verified: <span className="font-mono text-[10px]">{ADMIN_EMAIL}</span>
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
        <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 text-xs">
          <div className="p-2 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-col">
            <span className="text-neutral-500 text-[10px]">Reported Posts</span>
            <span className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
              {aggregates.length}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-col">
            <span className="text-rose-500 text-[10px] flex items-center gap-0.5 truncate">
              <EyeOff className="w-3 h-3 flex-shrink-0" /> Auto-Hidden
            </span>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {autoHiddenCount}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-col">
            <span className="text-amber-500 text-[10px] flex items-center gap-0.5 truncate">
              <Ban className="w-3 h-3 flex-shrink-0" /> Banned Users
            </span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {blockedUsers.length}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-col">
            <span className="text-emerald-500 text-[10px] flex items-center gap-0.5 truncate">
              <IndianRupee className="w-3 h-3 flex-shrink-0" /> Payout Requests
            </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {payoutRequests.filter((r) => r.status === 'pending').length} pending
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
            <button
              id="tab-admin-payouts"
              onClick={() => setActiveTab('payouts')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'payouts'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Payout Controls ({payoutRequests.length})
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

          {/* TAB 3: Payout Controls & Monetization Approvals */}
          {activeTab === 'payouts' && (
            <div className="space-y-4">
              {/* Policy Banner */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-neutral-900 dark:text-neutral-100">
                <div className="flex items-start gap-2.5">
                  <IndianRupee className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-amber-700 dark:text-amber-300 block">
                      Creator Monetization & UPI Payout Policy
                    </span>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                      Creators can apply for instant UPI payouts only upon reaching <strong>10,000 followers</strong> and <strong>20,000 watch hours</strong>. As Super Admin (<span className="font-mono text-[11px] font-bold">{ADMIN_EMAIL}</span>), you can review, approve, or disburse payouts directly to creator UPI IDs.
                    </p>
                  </div>
                </div>
              </div>

              {payoutActionFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                  <span>{payoutActionFeedback}</span>
                  <button onClick={() => setPayoutActionFeedback(null)} className="text-xs hover:opacity-75">✕</button>
                </div>
              )}

              {/* Payout Applications Queue */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Pending & Recent Payout Applications ({payoutRequests.length})
                  </h4>
                </div>

                {payoutRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white">
                          {req.name}
                        </span>
                        <span className="text-[11px] text-neutral-500">@{req.username}</span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            req.status === 'settled'
                              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                              : req.status === 'approved'
                              ? 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
                              : req.status === 'rejected'
                              ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                          <IndianRupee className="w-3 h-3 inline" /> {req.amount.toLocaleString()}
                        </span>
                        <span>UPI: <strong className="font-mono">{req.upiId}</strong></span>
                        <span>Followers: <strong>{req.followers.toLocaleString()}</strong></span>
                        <span>Watch Hours: <strong>{req.watchHours.toLocaleString()}h</strong></span>
                        <span className="text-neutral-400">{req.date}</span>
                      </div>
                    </div>

                    {/* Admin Action buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              const updated = payoutRequests.map((r) =>
                                r.id === req.id ? { ...r, status: 'settled' as const } : r
                              );
                              setPayoutRequests(updated);
                              try {
                                localStorage.setItem('jhalak_admin_payout_requests', JSON.stringify(updated));
                              } catch {}
                              setPayoutActionFeedback(`Approved & marked ₹${req.amount} settled to ${req.upiId}`);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95 shadow-xs cursor-pointer"
                          >
                            Approve & Settle UPI
                          </button>
                          <button
                            onClick={() => {
                              const updated = payoutRequests.map((r) =>
                                r.id === req.id ? { ...r, status: 'rejected' as const } : r
                              );
                              setPayoutRequests(updated);
                              try {
                                localStorage.setItem('jhalak_admin_payout_requests', JSON.stringify(updated));
                              } catch {}
                              setPayoutActionFeedback(`Payout request for @${req.username} rejected.`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-600 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {req.status === 'settled' && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Disbursed via UPI
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct Bonus UPI Disbursement */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-amber-500" />
                  Admin Direct Bonus / UPI Credit
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Creator username (e.g. bhojpuri_star)"
                    value={bonusCreatorUsername}
                    onChange={(e) => setBonusCreatorUsername(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Amount in ₹ (e.g. 500)"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!bonusCreatorUsername.trim() || !bonusAmount || Number(bonusAmount) <= 0) return;
                      const cleanUser = bonusCreatorUsername.replace(/^@/, '').trim();
                      const amt = Number(bonusAmount);
                      const newReq = {
                        id: `payout-bonus-${Date.now()}`,
                        username: cleanUser,
                        name: cleanUser,
                        amount: amt,
                        upiId: `${cleanUser}@upi`,
                        date: new Date().toLocaleDateString('en-IN'),
                        status: 'settled' as const,
                        followers: 10000,
                        watchHours: 20000,
                      };
                      const updated = [newReq, ...payoutRequests];
                      setPayoutRequests(updated);
                      try {
                        localStorage.setItem('jhalak_admin_payout_requests', JSON.stringify(updated));
                      } catch {}
                      setPayoutActionFeedback(`₹${amt} Super Admin UPI Bonus successfully credited to @${cleanUser}!`);
                      setBonusCreatorUsername('');
                      setBonusAmount('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    Credit ₹ Bonus
                  </button>
                </div>
              </div>
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
