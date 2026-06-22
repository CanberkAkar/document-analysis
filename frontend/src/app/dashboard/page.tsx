'use client';

import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Link from 'next/link';
import { ragService } from '@/services/ragService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const quickActions = [
  {
    title: 'Soru Sor',
    description: 'Yüklenmiş dokümanlarınız üzerinden AI destekli soru-cevap',
    href: '/dashboard/ask',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    color: 'from-indigo-500 to-purple-500',
  },
  {
    title: 'Doküman Analizi',
    description: 'Dokümanlarınızı yapay zeka ile analiz edin ve özetleyin',
    href: '/dashboard/summarize',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'from-pink-500 to-rose-500',
  },
  {
    title: 'Belge Oluşturucu',
    description: 'Resmi formatta dilekçe, ihtarname ve sözleşme taslakları üretin',
    href: '/dashboard/generate',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Doküman Yükle',
    description: 'PDF dokümanlarınızı sisteme yükleyin ve indeksleyin',
    href: '/dashboard/upload',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Geçmiş',
    description: 'Önceki sorgularınızı ve cevapları inceleyin',
    href: '/dashboard/history',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
  },
];

export default function DashboardPage() {
  const [docCount, setDocCount] = useState<number | string>('—');
  const [qCount, setQCount] = useState<number | string>('—');
  const [aCount, setACount] = useState<number | string>('—');
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const docs = await ragService.getDocuments();
        setDocCount(docs.length);
      } catch (err) {
        console.error('Failed to load documents count', err);
        setDocCount(0);
      }

      if (typeof window !== 'undefined') {
        const localQ = localStorage.getItem('hukuk_ai_q_count') || '0';
        const localA = localStorage.getItem('hukuk_ai_a_count') || '0';
        setQCount(parseInt(localQ, 10));
        setACount(parseInt(localA, 10));
      }
      setIsStatsLoading(false);
    }
    loadStats();
  }, []);

  const stats = [
    { label: 'Yüklenen Doküman', value: docCount, icon: '📄' },
    { label: 'Sorulan Soru', value: qCount, icon: '💬' },
    { label: 'Üretilen Cevap', value: aCount, icon: '✅' },
    { label: 'Sistem Durumu', value: 'Aktif', icon: '🟢' },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Masaüstü</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">AI Hukuk Asistanı kontrol merkezi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="!p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                <div className="min-h-[28px] flex items-center">
                  {isStatsLoading && stat.label !== 'Sistem Durumu' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{stat.value}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Hızlı Eylemler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card hover glow className="h-full cursor-pointer">
                <CardHeader>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg`}>
                    {action.icon}
                  </div>
                </CardHeader>
                <CardTitle>{action.title}</CardTitle>
                <CardDescription className="mt-1">{action.description}</CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
