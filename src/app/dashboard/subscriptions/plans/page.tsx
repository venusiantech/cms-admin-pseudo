'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingAPI, PlanPayload } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Loader2, X, Check, AlertTriangle, CreditCard,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  creditsPerMonth: number;
  maxWebsites: number;
  stripePriceId?: string | null;
  isCustom: boolean;
  isActive: boolean;
  createdAt: string;
}

const EMPTY_FORM: PlanPayload = {
  name: '',
  price: 0,
  creditsPerMonth: 0,
  maxWebsites: 1,
  stripePriceId: '',
};

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanPayload>(EMPTY_FORM);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['admin-billing-plans'],
    queryFn: async () => {
      const res = await billingAPI.getPlans();
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PlanPayload) => billingAPI.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-billing-plans'] });
      toast.success('Plan created!');
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create plan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlanPayload> }) =>
      billingAPI.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-billing-plans'] });
      toast.success('Plan updated!');
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update plan'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => billingAPI.deactivatePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-billing-plans'] });
      toast.success('Plan deactivated.');
      setDeactivateId(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to deactivate plan'),
  });

  function openCreate() {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      creditsPerMonth: plan.creditsPerMonth,
      maxWebsites: plan.maxWebsites,
      stripePriceId: plan.stripePriceId ?? '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPlan(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: PlanPayload = {
      ...form,
      stripePriceId: form.stripePriceId?.trim() || undefined,
    };
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Subscription Plans</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage Free, Starter, Business and other recurring plans</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          New Plan
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={20} />
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <CreditCard size={28} className="opacity-30" />
            <p className="text-sm">No plans yet. Create one.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Price</th>
                <th className="px-5 py-3 text-left">Credits/mo</th>
                <th className="px-5 py-3 text-left">Max Sites</th>
                <th className="px-5 py-3 text-left">Stripe Price ID</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plans.filter((p) => !p.isCustom).map((plan) => (
                <tr key={plan.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {plan.name}
                    {plan.isCustom && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{plan.creditsPerMonth}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{plan.maxWebsites}</td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">
                    {plan.stripePriceId ? (
                      <span className="truncate max-w-[140px] inline-block">{plan.stripePriceId}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                      plan.isActive
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                    }`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(plan)}
                        className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      {plan.isActive && (
                        <button
                          onClick={() => setDeactivateId(plan.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1.5">Plan Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Starter"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Price (USD/mo)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Credits / Month</label>
                  <input
                    type="number"
                    min="0"
                    value={form.creditsPerMonth}
                    onChange={(e) => setForm({ ...form, creditsPerMonth: parseInt(e.target.value) || 0 })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Max Websites</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxWebsites}
                    onChange={(e) => setForm({ ...form, maxWebsites: parseInt(e.target.value) || 1 })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Stripe Price ID</label>
                  <input
                    value={form.stripePriceId ?? ''}
                    onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })}
                    placeholder="price_xxx (optional)"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 font-mono focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isMutating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      {deactivateId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Deactivate Plan?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Existing subscribers keep their plan, but new users cannot select it.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeactivateId(null)}
                className="flex-1 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deactivateMutation.mutate(deactivateId)}
                disabled={deactivateMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deactivateMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
