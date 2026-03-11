'use client';

import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { Users, Globe, Inbox, Layout, TrendingUp, Clock, HardDrive } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await adminAPI.getStats();
      return res.data;
    },
  });

  const statCards = [
    { label: 'Total Users',    value: stats?.totalUsers    ?? '—', icon: Users,   color: 'text-blue-400   bg-blue-500/10   ring-blue-500/20',   link: '/dashboard/users'    },
    { label: 'Total Domains',  value: stats?.totalDomains  ?? '—', icon: Globe,   color: 'text-purple-400 bg-purple-500/10 ring-purple-500/20', link: '/dashboard/domains'  },
    { label: 'Total Websites', value: stats?.totalWebsites ?? '—', icon: Layout,  color: 'text-primary    bg-primary/10    ring-primary/20',    link: '/dashboard/websites' },
    { label: 'Total Leads',    value: stats?.totalLeads    ?? '—', icon: Inbox,   color: 'text-amber-400  bg-amber-500/10  ring-amber-500/20',  link: '/dashboard/leads'    },
    { label: 'Storage',        value: '—',                         icon: HardDrive, color: 'text-pink-400 bg-pink-500/10   ring-pink-500/20',   link: '/dashboard/storage'  },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.link}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg ring-1 flex items-center justify-center mb-3 ${card.color}`}>
                <Icon size={17} />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <span className="text-muted-foreground animate-pulse">···</span> : card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <div className="bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock size={15} className="text-muted-foreground" /> Recent Users
            </h3>
            <Link href="/dashboard/users" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="px-5 py-2">
            {isLoading ? (
              <div className="space-y-3 py-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-7 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {stats?.recentUsers?.map((u: any) => (
                  <li key={u.id} className="py-2.5 flex items-center justify-between">
                    <span className="text-sm text-foreground truncate max-w-[200px]">{u.email}</span>
                    <span className={`badge text-[11px] ${u.role === 'SUPER_ADMIN' ? 'badge-purple' : 'badge-blue'}`}>
                      {u.role === 'SUPER_ADMIN' ? 'Admin' : 'User'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Domains */}
        <div className="bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp size={15} className="text-muted-foreground" /> Recent Domains
            </h3>
            <Link href="/dashboard/domains" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="px-5 py-2">
            {isLoading ? (
              <div className="space-y-3 py-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-7 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {stats?.recentDomains?.map((d: any) => (
                  <li key={d.id} className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-sm font-mono text-foreground truncate">{d.domainName}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">{d.user?.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
