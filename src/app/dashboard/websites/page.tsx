'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { ExternalLink, CheckCircle2, XCircle, Settings, X, Save, Loader2, Search, Layout } from 'lucide-react';

export default function WebsitesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingWebsite, setEditingWebsite] = useState<any>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const { data: websites = [], isLoading } = useQuery({
    queryKey: ['admin-websites'],
    queryFn: async () => {
      const res = await adminAPI.getAllWebsites();
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminAPI.updateWebsiteSettings(id, data),
    onSuccess: () => {
      toast.success('Website settings updated!');
      queryClient.invalidateQueries({ queryKey: ['admin-websites'] });
      setEditingWebsite(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const adsMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      adminAPI.approveAds(id, approved),
    onSuccess: (_data, vars) => {
      toast.success(vars.approved ? 'Ads approved!' : 'Ads rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-websites'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openEdit = (website: any) => {
    setEditingWebsite(website);
    setEditForm({
      templateKey: website.templateKey,
      contactFormEnabled: website.contactFormEnabled,
      adsEnabled: website.adsEnabled,
      metaTitle: website.metaTitle || '',
      metaDescription: website.metaDescription || '',
      metaKeywords: website.metaKeywords || '',
      metaAuthor: website.metaAuthor || '',
      instagramUrl: website.instagramUrl || '',
      facebookUrl: website.facebookUrl || '',
      twitterUrl: website.twitterUrl || '',
      contactEmail: website.contactEmail || '',
      contactPhone: website.contactPhone || '',
      googleAnalyticsId: website.googleAnalyticsId || '',
      logoDisplayMode: website.logoDisplayMode || 'logo_only',
    });
  };

  const filtered = websites.filter((w: any) =>
    w.domain?.domainName?.toLowerCase().includes(search.toLowerCase()) ||
    w.domain?.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Websites</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{websites.length} total websites</p>
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
                {['Domain', 'Owner', 'Template', 'Ads', 'Contact', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((website: any) => (
                <tr key={website.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-medium text-foreground text-xs">{website.domain?.domainName}</span>
                      <a href={`https://${website.domain?.domainName}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    <span className="text-xs text-muted-foreground/60 font-mono">{website.subdomain}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{website.domain?.user?.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge badge-blue">{website.templateKey}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`badge ${website.adsApproved ? 'badge-green' : 'badge-yellow'}`}>
                        {website.adsApproved ? 'Approved' : 'Pending'}
                      </span>
                      {!website.adsApproved ? (
                        <button onClick={() => adsMutation.mutate({ id: website.id, approved: true })} className="p-1 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors" title="Approve ads">
                          <CheckCircle2 size={13} />
                        </button>
                      ) : (
                        <button onClick={() => adsMutation.mutate({ id: website.id, approved: false })} className="p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Revoke">
                          <XCircle size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${website.contactFormEnabled ? 'badge-green' : 'badge-red'}`}>
                      {website.contactFormEnabled ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(website)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted-foreground bg-accent hover:bg-accent/80 rounded-lg transition-colors"
                    >
                      <Settings size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">
                    <Layout size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                    No websites found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editingWebsite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">Edit Website</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{editingWebsite.domain?.domainName}</p>
              </div>
              <button onClick={() => setEditingWebsite(null)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Toggles */}
              <div className="flex gap-5">
                {[
                  { key: 'adsEnabled', label: 'Ads Enabled' },
                  { key: 'contactFormEnabled', label: 'Contact Form' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editForm[key]}
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.checked })}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>

              {/* Selects */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Template</label>
                  <select
                    value={editForm.templateKey}
                    onChange={(e) => setEditForm({ ...editForm, templateKey: e.target.value })}
                    className="input-field"
                  >
                    <option value="templateA">Template A</option>
                    <option value="modernNews">Modern News</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Logo Display</label>
                  <select
                    value={editForm.logoDisplayMode}
                    onChange={(e) => setEditForm({ ...editForm, logoDisplayMode: e.target.value })}
                    className="input-field"
                  >
                    <option value="logo_only">Logo Only</option>
                    <option value="text_only">Text Only</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              {/* Text fields */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'metaTitle', label: 'Meta Title' },
                  { key: 'metaDescription', label: 'Meta Description' },
                  { key: 'metaKeywords', label: 'Meta Keywords' },
                  { key: 'metaAuthor', label: 'Meta Author' },
                  { key: 'instagramUrl', label: 'Instagram URL' },
                  { key: 'facebookUrl', label: 'Facebook URL' },
                  { key: 'twitterUrl', label: 'Twitter URL' },
                  { key: 'contactEmail', label: 'Contact Email' },
                  { key: 'contactPhone', label: 'Contact Phone' },
                  { key: 'googleAnalyticsId', label: 'Google Analytics ID' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={editForm[key] ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="input-field"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setEditingWebsite(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => updateMutation.mutate({ id: editingWebsite.id, data: editForm })}
                disabled={updateMutation.isPending}
                className="btn-primary"
              >
                {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
