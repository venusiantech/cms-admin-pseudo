'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { Bot, Type, FileText, ImageIcon, Check, Loader2, Cpu } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

type AiProvider = 'aaddyy' | 'gemini' | 'pexels';
type AiProviderTask = 'title' | 'blog' | 'image';
type Providers = Record<AiProviderTask, AiProvider>;

interface GeminiModelOption {
  id: string;
  label: string;
  bestFor: string;
  quota: string;
}

interface GeminiModelData {
  current: string;
  models: GeminiModelOption[];
}

interface ProviderMeta {
  label: string;
  tagline: string;
  logo: string;
  accentClass: string;
  ringClass: string;
  glowClass: string;
}

interface TaskConfig {
  task: AiProviderTask;
  label: string;
  description: string;
  icon: React.ReactNode;
  availableProviders: AiProvider[];
}

const PROVIDER_META: Record<AiProvider, ProviderMeta> = {
  aaddyy: {
    label: 'Aaddyy',
    tagline: 'Title · Blog · Image generation',
    logo: '/img/Aaddyy.jpg',
    accentClass: 'text-sky-400',
    ringClass: 'ring-sky-500/50',
    glowClass: 'shadow-sky-500/20',
  },
  gemini: {
    label: 'Google Gemini',
    tagline: 'Gemini 2.5 · Blog writing',
    logo: '/img/gemini_ai.png',
    accentClass: 'text-violet-400',
    ringClass: 'ring-violet-500/50',
    glowClass: 'shadow-violet-500/20',
  },
  pexels: {
    label: 'Pexels',
    tagline: 'Real photos · Free stock imagery',
    logo: '/img/pexels.png',
    accentClass: 'text-green-400',
    ringClass: 'ring-green-500/50',
    glowClass: 'shadow-green-500/20',
  },
};

const TASK_CONFIGS: TaskConfig[] = [
  {
    task: 'title',
    label: 'Title Generation',
    description: 'Generates article titles from a domain or topic.',
    icon: <Type size={14} />,
    availableProviders: ['aaddyy'],
  },
  {
    task: 'blog',
    label: 'Blog Generation',
    description: 'Writes full markdown blog posts.',
    icon: <FileText size={14} />,
    availableProviders: ['aaddyy', 'gemini'],
  },
  {
    task: 'image',
    label: 'Image Generation',
    description: 'Creates featured images for blog posts.',
    icon: <ImageIcon size={14} />,
    availableProviders: ['aaddyy', 'pexels'],
  },
];

// ─── Provider Row ─────────────────────────────────────────────────────────────

function ProviderRow({
  provider, isActive, isSaving, isSelectable, onSelect,
}: {
  provider: AiProvider; isActive: boolean; isSaving: boolean;
  isSelectable: boolean; onSelect: () => void;
}) {
  const m = PROVIDER_META[provider];
  return (
    <button
      type="button"
      disabled={!isSelectable || isSaving}
      onClick={onSelect}
      className={`
        group w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-150
        ${isActive ? `bg-white/5 border-white/20 shadow-lg ${m.glowClass}` : 'bg-transparent border-white/8 hover:bg-white/5 hover:border-white/15'}
        ${!isSelectable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
      `}
    >
      <div className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 transition-all bg-white ${isActive ? `${m.ringClass} shadow-md ${m.glowClass}` : 'ring-white/10'}`}>
        <Image src={m.logo} alt={m.label} fill className="object-fill" sizes="64px" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-sm font-semibold leading-tight ${isActive ? m.accentClass : 'text-foreground'}`}>{m.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.tagline}</p>
      </div>
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-primary' : 'border-2 border-white/20'}`}>
        {isSaving
          ? <Loader2 size={12} className="animate-spin text-white" />
          : isActive ? <Check size={11} strokeWidth={3} className="text-primary-foreground" /> : null
        }
      </div>
    </button>
  );
}

// ─── Gemini Model Selector ────────────────────────────────────────────────────

function GeminiModelSelector() {
  const queryClient = useQueryClient();
  const [savingModel, setSavingModel] = useState(false);

  const { data } = useQuery<GeminiModelData>({
    queryKey: ['gemini-model'],
    queryFn: () => adminAPI.getGeminiModel().then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (model: string) => adminAPI.setGeminiModel(model),
    onMutate: () => setSavingModel(true),
    onSuccess: (res) => {
      queryClient.setQueryData(['gemini-model'], res.data);
      toast.success('Gemini model updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update model');
    },
    onSettled: () => setSavingModel(false),
  });

  if (!data) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/8">
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <Cpu size={12} className="text-violet-400" />
        <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Model Selection</p>
        {savingModel && <Loader2 size={11} className="animate-spin text-muted-foreground ml-auto" />}
      </div>

      <div className="space-y-1.5">
        {data.models.map((m) => {
          const isActive = data.current === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={savingModel}
              onClick={() => !isActive && mutation.mutate(m.id)}
              className={`
                w-full flex items-center gap-3 px-3.5 py-3 rounded-lg border text-left transition-all
                ${isActive
                  ? 'bg-violet-500/10 border-violet-500/30'
                  : 'bg-transparent border-white/8 hover:bg-white/5 hover:border-white/15 cursor-pointer'
                }
                ${savingModel ? 'cursor-not-allowed opacity-60' : ''}
              `}
            >
              {/* Selection dot */}
              <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${isActive ? 'bg-violet-500 border-violet-500' : 'border-white/25'}`}>
                {isActive && <Check size={9} strokeWidth={3} className="text-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${isActive ? 'text-violet-300' : 'text-foreground'}`}>{m.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{m.bestFor}</p>
              </div>

              <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${isActive ? 'bg-violet-500/20 border-violet-500/30 text-violet-300' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                {m.quota}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task, label, description, icon, availableProviders, current, isSaving, onSelect,
}: {
  task: AiProviderTask; label: string; description: string; icon: React.ReactNode;
  availableProviders: AiProvider[]; current: AiProvider;
  isSaving: boolean; onSelect: (p: AiProvider) => void;
}) {
  const activeMeta = PROVIDER_META[current];

  return (
    <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/8">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted border border-white/10 flex items-center justify-center text-muted-foreground flex-shrink-0">{icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <span className={`ml-auto flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10 ${activeMeta.accentClass}`}>
            {activeMeta.label}
          </span>
        </div>
      </div>

      {/* Provider list */}
      <div className="p-3 space-y-2">
        {availableProviders.map((provider) => (
          <ProviderRow
            key={provider}
            provider={provider}
            isActive={current === provider}
            isSaving={isSaving}
            isSelectable={availableProviders.length > 1}
            onSelect={() => onSelect(provider)}
          />
        ))}

        {/* Coming soon */}
        {availableProviders.length < 2 && (
          <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-dashed border-white/8 opacity-30">
            <div className="w-16 h-16 rounded-xl bg-muted border border-white/10 flex items-center justify-center text-muted-foreground text-xl font-light flex-shrink-0">+</div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">More providers</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Coming soon</p>
            </div>
          </div>
        )}

        {/* Gemini model selector — only in Blog card when Gemini is active */}
        {task === 'blog' && current === 'gemini' && <GeminiModelSelector />}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiProviderPage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<AiProviderTask | null>(null);

  const { data: providers, isLoading } = useQuery<Providers>({
    queryKey: ['ai-providers'],
    queryFn: () => adminAPI.getAiProviders().then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: ({ task, provider }: { task: AiProviderTask; provider: AiProvider }) =>
      adminAPI.setAiProvider(task, provider),
    onMutate: ({ task }) => setSaving(task),
    onSuccess: (res) => {
      queryClient.setQueryData(['ai-providers'], res.data);
      toast.success('Provider updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
    onSettled: () => setSaving(null),
  });

  const handleChange = (task: AiProviderTask, provider: AiProvider) => {
    if (providers?.[task] === provider) return;
    mutation.mutate({ task, provider });
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Bot size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Providers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select which AI service powers each generation task. Changes apply instantly.
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-white/8 bg-muted/20 px-5 py-4 text-xs text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground text-sm">Required environment variables</p>
        <div className="flex flex-wrap gap-x-8 gap-y-1">
          <span><span className="text-sky-400 font-medium">Aaddyy</span> → <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">AADDYY_API_KEY</code></span>
          <span><span className="text-violet-400 font-medium">Google Gemini</span> → <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">GEMINI_API_KEY</code></span>
          <span><span className="text-green-400 font-medium">Pexels</span> → <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">PEXELS_API_KEY</code></span>
        </div>
        <p className="text-muted-foreground/50">All selections are persisted in the database — no server restart required.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 items-start">
          {TASK_CONFIGS.map(({ task, label, description, icon, availableProviders }) => (
            <TaskCard
              key={task}
              task={task}
              label={label}
              description={description}
              icon={icon}
              availableProviders={availableProviders}
              current={providers?.[task] ?? 'aaddyy'}
              isSaving={saving === task}
              onSelect={(provider) => handleChange(task, provider)}
            />
          ))}
        </div>
      )}

      {/* Env note */}
      
    </div>
  );
}
