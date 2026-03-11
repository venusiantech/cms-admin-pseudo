'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Trash2, CheckCircle2, Clock, Search, AlertCircle, X, Loader2, Globe } from 'lucide-react';

export default function DomainsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['admin-domains'],
    queryFn: async () => {
      const res = await adminAPI.getAllDomains();
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminAPI.deleteDomain(id),
    onSuccess: () => {
      toast.success('Domain deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-domains'] });
      setDeletingId(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete'),
  });

  const filtered = domains.filter((d: any) =>
    d.domainName?.toLowerCase().includes(search.toLowerCase()) ||
    d.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Domains</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{domains.length} total domains</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search domain or user..."
            className="input-field pl-8 w-60 py-2"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Domain', 'Owner', 'Status', 'DNS', 'Nameservers', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((domain: any) => (
                <tr key={domain.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-foreground text-xs">{domain.domainName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{domain.user?.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${domain.status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'}`}>
                      {domain.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {domain.nameServersStatus === 'active' ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : domain.nameServersStatus ? (
                      <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                        <Clock size={12} /> Pending
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground/50">
                        <AlertCircle size={12} /> Not set
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {domain.nameServers?.length > 0 ? (
                      <div className="text-xs text-muted-foreground font-mono space-y-0.5">
                        {domain.nameServers.slice(0, 2).map((ns: string, i: number) => (
                          <div key={i}>{ns}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeletingId(domain.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">
                    <Globe size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                    No domains found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-foreground mb-1.5">Delete Domain?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This will permanently delete the domain and all associated content. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingId(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1 justify-center"
              >
                {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
