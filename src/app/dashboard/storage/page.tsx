'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HardDrive, Image, FileText, Trash2,
  ChevronRight, ChevronDown, X, AlertTriangle,
  Search, Loader2, ArrowLeft,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StorageOverviewItem {
  websiteId: string;
  domainName: string;
  subdomain: string;
  userEmail: string;
  userId: string;
  templateKey: string;
  createdAt: string;
  stats: {
    totalBlogs: number;
    totalImages: number;
    totalTextBlocks: number;
    totalBlocks: number;
    textSizeBytes: number;
    textSizeKb: number;
  };
}

interface BlogDetail {
  sectionId: string;
  orderIndex: number;
  createdAt: string;
  title: string;
  imageUrl: string | null;
  contentSizeBytes: number;
  contentSizeKb: number;
  blockCount: number;
  blocks: { id: string; blockType: string; sizeBytes: number; createdAt: string }[];
}

interface WebsiteStorageDetail {
  websiteId: string;
  domainName: string;
  subdomain: string;
  userEmail: string;
  stats: { totalBlogs: number; totalImages: number; totalTextSizeBytes: number; totalTextSizeKb: number };
  blogs: BlogDetail[];
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-foreground">{message}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className="btn-danger flex-1 justify-center">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Website Detail View ──────────────────────────────────────────────────────

function WebsiteStorageDetail({ websiteId, onBack }: { websiteId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<{ type: 'section' | 'all'; id?: string } | null>(null);
  const [expandedBlog, setExpandedBlog] = useState<string | null>(null);

  const { data, isLoading } = useQuery<WebsiteStorageDetail>({
    queryKey: ['admin-storage-detail', websiteId],
    queryFn: async () => { const res = await adminAPI.getWebsiteStorage(websiteId); return res.data; },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => adminAPI.deleteBlogSection(sectionId),
    onSuccess: () => {
      toast.success('Blog deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-storage-detail', websiteId] });
      queryClient.invalidateQueries({ queryKey: ['admin-storage'] });
      setConfirm(null);
    },
    onError: () => toast.error('Failed to delete blog'),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => adminAPI.deleteAllWebsiteContent(websiteId),
    onSuccess: () => {
      toast.success('All content deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-storage-detail', websiteId] });
      queryClient.invalidateQueries({ queryKey: ['admin-storage'] });
      setConfirm(null);
    },
    onError: () => toast.error('Failed to delete content'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-foreground truncate">{data.domainName}</h1>
          <p className="text-xs text-muted-foreground">{data.userEmail}</p>
        </div>
        <button
          onClick={() => setConfirm({ type: 'all' })}
          disabled={data.blogs.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-red-400 border border-destructive/20 rounded-lg text-xs font-medium hover:bg-destructive/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 size={13} /> Delete All Content
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Blogs',  value: data.stats.totalBlogs,        icon: <FileText size={16} className="text-primary" />,       ring: 'ring-primary/20   bg-primary/10'   },
          { label: 'Images',       value: data.stats.totalImages,        icon: <Image    size={16} className="text-emerald-400" />,    ring: 'ring-emerald-500/20 bg-emerald-500/10' },
          { label: 'Text Size',    value: `${data.stats.totalTextSizeKb} KB`, icon: <HardDrive size={16} className="text-amber-400" />, ring: 'ring-amber-500/20  bg-amber-500/10'  },
          { label: 'Subdomain',    value: data.subdomain,                icon: <HardDrive size={16} className="text-purple-400" />,   ring: 'ring-purple-500/20 bg-purple-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg ring-1 flex items-center justify-center mb-2 ${stat.ring}`}>
              {stat.icon}
            </div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-semibold text-foreground truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Blog list */}
      {data.blogs.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <FileText className="mx-auto text-muted-foreground/30 mb-2" size={36} />
          <p className="text-muted-foreground text-sm">No blogs found for this website</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.blogs.map((blog) => (
            <div key={blog.sectionId} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-11 h-11 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                  {blog.imageUrl
                    ? <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Image size={18} className="text-muted-foreground/40" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{blog.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span>{blog.contentSizeKb} KB</span>
                    <span>{blog.blockCount} blocks</span>
                    <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setExpandedBlog(expandedBlog === blog.sectionId ? null : blog.sectionId)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    {expandedBlog === blog.sectionId ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <button
                    onClick={() => setConfirm({ type: 'section', id: blog.sectionId })}
                    className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expandedBlog === blog.sectionId && (
                <div className="border-t border-border px-4 py-3 bg-muted/40">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Content Blocks</p>
                  <div className="space-y-1.5">
                    {blog.blocks.map((block) => (
                      <div key={block.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${block.blockType === 'image' ? 'badge-green' : 'badge-blue'}`}>
                            {block.blockType}
                          </span>
                          <span className="text-muted-foreground font-mono">{block.id.slice(0, 8)}…</span>
                        </div>
                        <span className="text-muted-foreground">{block.sizeBytes} B</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {confirm?.type === 'section' && confirm.id && (
        <ConfirmDialog
          message="Delete this blog? This will remove the title, content, and image permanently."
          onConfirm={() => deleteSectionMutation.mutate(confirm.id!)}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'all' && (
        <ConfirmDialog
          message={`Delete ALL ${data.blogs.length} blogs for ${data.domainName}? This cannot be undone.`}
          onConfirm={() => deleteAllMutation.mutate()}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── Overview Page ────────────────────────────────────────────────────────────

export default function StoragePage() {
  const [search, setSearch] = useState('');
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);

  const { data: overview = [], isLoading } = useQuery<StorageOverviewItem[]>({
    queryKey: ['admin-storage'],
    queryFn: async () => { const res = await adminAPI.getStorageOverview(); return res.data; },
  });

  const filtered = overview.filter((w) =>
    w.domainName.toLowerCase().includes(search.toLowerCase()) ||
    w.userEmail.toLowerCase().includes(search.toLowerCase())
  );

  const totalBlogs  = overview.reduce((s, w) => s + w.stats.totalBlogs, 0);
  const totalImages = overview.reduce((s, w) => s + w.stats.totalImages, 0);
  const totalSizeKb = overview.reduce((s, w) => s + w.stats.textSizeKb, 0);

  if (selectedWebsiteId) {
    return <WebsiteStorageDetail websiteId={selectedWebsiteId} onBack={() => setSelectedWebsiteId(null)} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Storage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Blog and image content grouped by website</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Websites', value: overview.length, icon: <HardDrive size={18} className="text-primary" />,       ring: 'ring-primary/20   bg-primary/10'    },
          { label: 'Total Blogs',    value: totalBlogs,       icon: <FileText  size={18} className="text-emerald-400" />,   ring: 'ring-emerald-500/20 bg-emerald-500/10' },
          { label: 'Total Images',   value: totalImages,      icon: <Image     size={18} className="text-amber-400" />,     ring: 'ring-amber-500/20  bg-amber-500/10'  },
          { label: 'Text Storage',   value: totalSizeKb >= 1024 ? `${(totalSizeKb / 1024).toFixed(1)} MB` : `${totalSizeKb} KB`,
                                              icon: <HardDrive size={18} className="text-purple-400" />,                     ring: 'ring-purple-500/20 bg-purple-500/10' },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ring-1 flex items-center justify-center mb-3 ${card.ring}`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by domain or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-8"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <HardDrive className="mx-auto text-muted-foreground/30 mb-2" size={36} />
          <p className="text-muted-foreground text-sm">No websites found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Domain', 'User', 'Blogs', 'Images', 'Text Size', 'Template', ''].map((h) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${h === 'Blogs' || h === 'Images' || h === 'Text Size' || h === 'Template' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => (
                <tr key={item.websiteId} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs">{item.domainName}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">{item.subdomain}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{item.userEmail}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="badge badge-blue"><FileText size={10} className="mr-1" />{item.stats.totalBlogs}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="badge badge-green"><Image size={10} className="mr-1" />{item.stats.totalImages}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">{item.stats.textSizeKb} KB</td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">{item.templateKey}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedWebsiteId(item.websiteId)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg text-xs font-medium transition-colors ml-auto"
                    >
                      Manage <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
