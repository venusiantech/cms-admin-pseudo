'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { HardDrive, Cloud, Loader2, Check } from 'lucide-react';

type Provider = 'railway' | 'cloudinary';

export default function StorageProviderPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-storage-provider'],
    queryFn: async () => {
      const res = await adminAPI.getStorageProvider();
      return res.data;
    },
  });

  const setProviderMutation = useMutation({
    mutationFn: (provider: Provider) => adminAPI.setStorageProvider(provider),
    onSuccess: (_, provider) => {
      toast.success(`Storage provider set to ${provider}`);
      queryClient.invalidateQueries({ queryKey: ['admin-storage-provider'] });
    },
    onError: () => toast.error('Failed to update storage provider'),
  });

  const current = data?.provider ?? 'railway';

  const options: { value: Provider; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'railway', label: 'Railway (S3)', icon: <HardDrive size={20} className="text-primary" />, desc: 'S3-compatible storage on Railway' },
    { value: 'cloudinary', label: 'Cloudinary', icon: <Cloud size={20} className="text-sky-400" />, desc: 'Cloudinary image storage & delivery' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Storage Provider</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose where new uploads (images, logos) are stored. Change takes effect immediately.
        </p>
      </div>

      <div className="grid gap-3 max-w-xl">
        {options.map((opt) => {
          const isActive = current === opt.value;
          const isPending = setProviderMutation.isPending && setProviderMutation.variables === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setProviderMutation.mutate(opt.value)}
              disabled={isActive || setProviderMutation.isPending}
              className={`
                flex items-center gap-4 w-full p-4 rounded-xl border text-left transition-colors
                ${isActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-accent/30 hover:border-accent'
                }
                disabled:opacity-70 disabled:cursor-not-allowed
              `}
            >
              <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                {opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </div>
              {isActive && (
                <span className="flex items-center gap-1 text-sm text-primary font-medium">
                  <Check size={16} /> Active
                </span>
              )}
              {isPending && <Loader2 className="animate-spin text-primary" size={18} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
