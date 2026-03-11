'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, billingAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search, Loader2, ChevronRight, CreditCard, User, Check, DollarSign,
  Sparkles, Clock, CheckCircle, XCircle, ChevronDown, Zap, Globe,
} from 'lucide-react';

interface UserRecord {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  creditsPerMonth: number;
  maxWebsites: number;
  isCustom: boolean;
  isActive: boolean;
}

interface UserSubscription {
  status: string;
  creditsRemaining: number;
  currentPeriodEnd?: string;
  plan?: { name: string; price: number };
}

interface CustomPlanRequest {
  id: string;
  message: string;
  status: 'PENDING' | 'REVIEWED' | 'CLOSED';
  adminNote: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
}

export default function AssignPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  // ── Custom plan inline form ──────────────────────────────────────────────
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customCredits, setCustomCredits] = useState('');
  const [customSites, setCustomSites] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  // ── Data ────────────────────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading } = useQuery<UserRecord[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await adminAPI.getAllUsers();
      return res.data;
    },
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['admin-billing-plans'],
    queryFn: async () => {
      const res = await billingAPI.getPlans();
      return res.data;
    },
  });

  const { data: userSub, isLoading: subLoading } = useQuery<UserSubscription | null>({
    queryKey: ['admin-user-subscription', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return null;
      const res = await billingAPI.getUserSubscription(selectedUser.id);
      return res.data;
    },
    enabled: !!selectedUser,
  });

  // ── Filtered users ───────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users.slice(0, 20);
    const q = search.toLowerCase();
    return users.filter((u) => u.email.toLowerCase().includes(q)).slice(0, 20);
  }, [users, search]);

  // ── Custom plan requests ─────────────────────────────────────────────────
  const { data: customRequests = [], isLoading: requestsLoading } = useQuery<CustomPlanRequest[]>({
    queryKey: ['admin-custom-plan-requests'],
    queryFn: async () => {
      const res = await billingAPI.getCustomPlanRequests();
      return res.data;
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; adminNote?: string } }) =>
      billingAPI.updateCustomPlanRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-custom-plan-requests'] });
      toast.success('Request updated');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  // ── Assign standard plan mutation ────────────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser || !selectedPlanId) throw new Error('Select user and plan');
      return billingAPI.assignSubscription(selectedUser.id, selectedPlanId);
    },
    onSuccess: () => {
      toast.success('Plan assigned. Email sent to user.');
      setSelectedPlanId('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to assign plan'),
  });

  // ── Assign custom plan mutation ──────────────────────────────────────────
  const customAssignMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) throw new Error('Select a user first');
      return billingAPI.assignAdHocCustomPlan(selectedUser.id, {
        amountUsd: parseFloat(customAmount),
        creditsPerMonth: parseInt(customCredits, 10),
        maxWebsites: parseInt(customSites, 10),
        label: customLabel || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Custom plan payment link sent to user.');
      setShowCustomForm(false);
      setCustomAmount(''); setCustomCredits(''); setCustomSites(''); setCustomLabel('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to send custom plan'),
  });

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  // Only show non-custom plans in the radio list
  const activePlans = plans.filter((p) => p.isActive && !p.isCustom);

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Assign Subscription</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Search a user, pick a plan, and assign it. An email notification will be sent automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ── Step 1: User search ──────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
            <p className="text-sm font-semibold text-foreground">Select User</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email…"
                className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {usersLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUser(u); setSelectedPlanId(''); setShowCustomForm(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      selectedUser?.id === u.id
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted/40 border border-transparent'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User size={12} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{u.email}</p>
                      <p className="text-[10px] text-muted-foreground">{u.role}</p>
                    </div>
                    {selectedUser?.id === u.id && (
                      <Check size={13} className="text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No users found.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Step 2: Plan selection ────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
            <p className="text-sm font-semibold text-foreground">Select Plan</p>
          </div>
          <div className="p-4 space-y-3">
            {/* Current subscription summary */}
            {selectedUser && (
              <div className="rounded-lg bg-muted/30 border border-border px-4 py-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Current subscription</p>
                {subLoading ? (
                  <Loader2 size={13} className="animate-spin text-muted-foreground" />
                ) : userSub && userSub.plan ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{userSub.plan.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                      userSub.status === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {userSub.status}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No active plan</p>
                )}
                {userSub && (
                  <p className="text-[10px] text-muted-foreground">{userSub.creditsRemaining ?? 0} credits remaining</p>
                )}
              </div>
            )}

            {plansLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {activePlans.map((plan) => (
                  <button
                    key={plan.id}
                    disabled={!selectedUser}
                    onClick={() => { setSelectedPlanId(plan.id); setShowCustomForm(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      selectedPlanId === plan.id
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted/40 border border-transparent'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={12} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{plan.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {plan.price === 0 ? 'Free' : `$${plan.price}/mo`} · {plan.creditsPerMonth} credits · {plan.maxWebsites} sites
                      </p>
                    </div>
                    {selectedPlanId === plan.id && <Check size={13} className="text-primary flex-shrink-0" />}
                  </button>
                ))}

                {/* Custom Plan option */}
                <button
                  disabled={!selectedUser}
                  onClick={() => { setShowCustomForm(true); setSelectedPlanId(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    showCustomForm
                      ? 'bg-purple-500/10 border border-purple-500/30'
                      : 'hover:bg-muted/40 border border-transparent'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={12} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">Custom Plan</p>
                    <p className="text-[10px] text-muted-foreground">Set your own amount, credits & sites</p>
                  </div>
                  {showCustomForm && <Check size={13} className="text-purple-400 flex-shrink-0" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Standard plan: Assign button ─────────────────────────────────────── */}
      {!showCustomForm && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedUser || !selectedPlanId || assignMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {assignMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ChevronRight size={14} />
            )}
            Assign Plan
            {selectedUser && selectedPlan && (
              <span className="opacity-70 text-xs font-normal ml-1">
                → {selectedUser.email.split('@')[0]} · {selectedPlan.name}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Custom plan inline form ───────────────────────────────────────────── */}
      {showCustomForm && (
        <div className="bg-card border border-purple-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-purple-500/20 bg-purple-500/5">
            <Sparkles size={13} className="text-purple-400" />
            <p className="text-sm font-semibold text-foreground">Custom Plan Details</p>
            {selectedUser && (
              <span className="ml-auto text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                for {selectedUser.email}
              </span>
            )}
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Label <span className="text-muted-foreground/40">(optional)</span>
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Enterprise Plan"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-purple-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Amount (USD / month) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  min="0.5"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="49.99"
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-purple-500/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Credits / month <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Zap size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  min="1"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  placeholder="100"
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-purple-500/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Max Websites <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  min="1"
                  value={customSites}
                  onChange={(e) => setCustomSites(e.target.value)}
                  placeholder="50"
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-purple-500/60 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-5 pb-5">
            <button
              onClick={() => { setShowCustomForm(false); setCustomAmount(''); setCustomCredits(''); setCustomSites(''); setCustomLabel(''); }}
              className="px-4 py-2 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => customAssignMutation.mutate()}
              disabled={
                !selectedUser ||
                !customAmount || !customCredits || !customSites ||
                customAssignMutation.isPending
              }
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {customAssignMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              Send Payment Link
            </button>
          </div>
        </div>
      )}

      {/* ── Custom Plan Requests ─────────────────────────────────────────────── */}
      <div className="border-t border-border pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-foreground">Custom Plan Requests</h2>
          {customRequests.filter((r) => r.status === 'PENDING').length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
              {customRequests.filter((r) => r.status === 'PENDING').length} new
            </span>
          )}
        </div>

        {requestsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : customRequests.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            No custom plan requests yet.
          </div>
        ) : (
          <div className="space-y-2">
            {customRequests.map((req) => {
              const isExpanded = expandedRequestId === req.id;
              const statusIcon = req.status === 'PENDING'
                ? <Clock size={11} className="text-amber-400" />
                : req.status === 'REVIEWED'
                ? <CheckCircle size={11} className="text-green-400" />
                : <XCircle size={11} className="text-neutral-400" />;
              const statusColor = req.status === 'PENDING'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : req.status === 'REVIEWED'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';

              return (
                <div key={req.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={12} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{req.user.email}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
                      {statusIcon}
                      {req.status}
                    </span>
                    <ChevronDown size={13} className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 space-y-3 border-t border-border bg-muted/10">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Message</p>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{req.message}</p>
                      </div>

                      <div>
                        <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Admin Note</label>
                        <textarea
                          rows={2}
                          value={noteInputs[req.id] ?? req.adminNote ?? ''}
                          onChange={(e) => setNoteInputs((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          placeholder="Add internal note…"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary transition-colors resize-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => updateRequestMutation.mutate({
                            id: req.id,
                            data: { status: 'REVIEWED', adminNote: noteInputs[req.id] ?? req.adminNote ?? undefined },
                          })}
                          disabled={updateRequestMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={11} /> Mark Reviewed
                        </button>
                        <button
                          onClick={() => updateRequestMutation.mutate({
                            id: req.id,
                            data: { status: 'CLOSED', adminNote: noteInputs[req.id] ?? req.adminNote ?? undefined },
                          })}
                          disabled={updateRequestMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 rounded-lg hover:bg-neutral-500/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={11} /> Close
                        </button>
                        {noteInputs[req.id] !== undefined && noteInputs[req.id] !== (req.adminNote ?? '') && (
                          <button
                            onClick={() => updateRequestMutation.mutate({
                              id: req.id,
                              data: { adminNote: noteInputs[req.id] },
                            })}
                            disabled={updateRequestMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                          >
                            {updateRequestMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : null}
                            Save Note
                          </button>
                        )}
                        {/* Quick-assign: pre-select this user */}
                        <button
                          onClick={() => {
                            setSelectedUser({ id: req.user.id, email: req.user.email, role: 'USER', createdAt: '' });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors ml-auto"
                        >
                          <CreditCard size={11} /> Assign Plan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
