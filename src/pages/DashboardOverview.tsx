import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen } from '@/types/app';
import {
  GraduationCap, Users, DoorOpen, BookOpen, ClipboardList,
  TrendingUp, CheckCircle, Clock, XCircle, Euro
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { format, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';
import { de } from 'date-fns/locale';

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  colorClass: string;
  iconColorClass: string;
}

function KpiCard({ title, value, sub, icon, colorClass, iconColorClass }: KpiCardProps) {
  return (
    <div className={`rounded-2xl border p-5 shadow-card transition-smooth hover:shadow-elegant cursor-default ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="text-4xl font-700 mt-2 tracking-tight" style={{ fontWeight: 700 }}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-background/60 ${iconColorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    geplant: { label: 'Geplant', cls: 'badge-geplant' },
    aktiv: { label: 'Aktiv', cls: 'badge-aktiv' },
    abgeschlossen: { label: 'Abgeschlossen', cls: 'badge-abgeschlossen' },
    abgesagt: { label: 'Abgesagt', cls: 'badge-abgesagt' },
  };
  const s = map[status] ?? { label: status, cls: 'badge-geplant' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

const CHART_COLORS = [
  'oklch(0.48 0.195 264)',
  'oklch(0.62 0.18 264)',
  'oklch(0.55 0.14 200)',
  'oklch(0.5 0.18 310)',
];

export default function DashboardOverview() {
  const [dozentenCount, setDozentenCount] = useState(0);
  const [teilnehmerCount, setTeilnehmerCount] = useState(0);
  const [raeumeCount, setRaeumeCount] = useState(0);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [doz, teil, raeum, kurs, anm] = await Promise.all([
          LivingAppsService.getDozenten(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getRaeume(),
          LivingAppsService.getKurse(),
          LivingAppsService.getAnmeldungen(),
        ]);
        setDozentenCount(doz.length);
        setTeilnehmerCount(teil.length);
        setRaeumeCount(raeum.length);
        setKurse(kurs);
        setAnmeldungen(anm);
      } catch (e) {
        console.error('Failed to load stats:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const today = startOfToday();
  const aktiveKurse = kurse.filter(k => k.fields.status === 'aktiv').length;
  const geplanteKurse = kurse.filter(k => k.fields.status === 'geplant').length;
  const bezahltCount = anmeldungen.filter(a => a.fields.bezahlt === true).length;
  const offenCount = anmeldungen.filter(a => !a.fields.bezahlt).length;

  // Status distribution chart
  const statusData = [
    { name: 'Geplant', value: geplanteKurse },
    { name: 'Aktiv', value: aktiveKurse },
    { name: 'Abgeschlossen', value: kurse.filter(k => k.fields.status === 'abgeschlossen').length },
    { name: 'Abgesagt', value: kurse.filter(k => k.fields.status === 'abgesagt').length },
  ].filter(d => d.value > 0);

  // Upcoming courses (next 30 days)
  const upcomingKurse = kurse
    .filter(k => {
      if (!k.fields.startdatum) return false;
      const start = parseISO(k.fields.startdatum);
      return isAfter(start, today) || k.fields.status === 'geplant';
    })
    .sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? ''))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="gradient-hero rounded-2xl p-8 shadow-elegant text-sidebar-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, oklch(0.7 0.2 264), transparent 60%)' }} />
        <div className="relative">
          <p className="text-sidebar-foreground/60 text-sm font-medium uppercase tracking-widest mb-2">Kursverwaltung</p>
          <h1 className="text-4xl font-bold tracking-tight text-sidebar-foreground">Guten Tag!</h1>
          <p className="mt-2 text-sidebar-foreground/70 text-base max-w-lg">
            Verwalten Sie Kurse, Dozenten, Teilnehmer, Räume und Anmeldungen an einem Ort.
          </p>
          <div className="flex gap-6 mt-6">
            <div>
              <p className="text-3xl font-bold text-sidebar-foreground">{loading ? '—' : kurse.length}</p>
              <p className="text-xs text-sidebar-foreground/60 mt-0.5">Kurse gesamt</p>
            </div>
            <div className="w-px bg-sidebar-border" />
            <div>
              <p className="text-3xl font-bold text-sidebar-foreground">{loading ? '—' : anmeldungen.length}</p>
              <p className="text-xs text-sidebar-foreground/60 mt-0.5">Anmeldungen</p>
            </div>
            <div className="w-px bg-sidebar-border" />
            <div>
              <p className="text-3xl font-bold" style={{ color: 'oklch(0.62 0.16 160)' }}>{loading ? '—' : bezahltCount}</p>
              <p className="text-xs text-sidebar-foreground/60 mt-0.5">Bezahlt</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Dozenten"
          value={loading ? '—' : dozentenCount}
          sub="Lehrpersonal"
          icon={<GraduationCap size={20} />}
          colorClass="stat-card-indigo"
          iconColorClass="icon-indigo"
        />
        <KpiCard
          title="Teilnehmer"
          value={loading ? '—' : teilnehmerCount}
          sub="Registriert"
          icon={<Users size={20} />}
          colorClass="stat-card-teal"
          iconColorClass="icon-teal"
        />
        <KpiCard
          title="Räume"
          value={loading ? '—' : raeumeCount}
          sub="Verfügbar"
          icon={<DoorOpen size={20} />}
          colorClass="stat-card-violet"
          iconColorClass="icon-violet"
        />
        <KpiCard
          title="Aktive Kurse"
          value={loading ? '—' : aktiveKurse}
          sub={`${geplanteKurse} geplant`}
          icon={<BookOpen size={20} />}
          colorClass="stat-card-amber"
          iconColorClass="icon-amber"
        />
        <KpiCard
          title="Bezahlt"
          value={loading ? '—' : `${bezahltCount}/${anmeldungen.length}`}
          sub={`${offenCount} ausstehend`}
          icon={<Euro size={20} />}
          colorClass="stat-card-emerald"
          iconColorClass="icon-emerald"
        />
      </div>

      {/* Charts + Upcoming row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Chart */}
        <div className="lg:col-span-1 rounded-2xl border bg-card shadow-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">Kurs-Status</h2>
          <p className="text-2xl font-bold tracking-tight mb-4">{kurse.length} Kurse</p>
          {kurse.length === 0 && !loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              Noch keine Kurse angelegt
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={statusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.908 0.012 264)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 264)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 264)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '0.75rem', border: '1px solid oklch(0.908 0.012 264)', fontSize: 12, fontFamily: 'Space Grotesk' }}
                  cursor={{ fill: 'oklch(0.95 0.005 264)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Upcoming Courses */}
        <div className="lg:col-span-2 rounded-2xl border bg-card shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">Kommende Kurse</h2>
              <p className="text-2xl font-bold tracking-tight">Bald startend</p>
            </div>
            <Clock size={18} className="icon-indigo" />
          </div>
          {upcomingKurse.length === 0 && !loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Keine kommenden Kurse
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingKurse.map(k => (
                <div key={k.record_id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{k.fields.titel ?? '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {k.fields.startdatum
                        ? format(parseISO(k.fields.startdatum), 'dd. MMMM yyyy', { locale: de })
                        : '—'}
                      {k.fields.preis != null && ` · ${k.fields.preis.toFixed(2)} €`}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0">
                    {k.fields.status && <StatusBadge status={k.fields.status} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      {anmeldungen.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border bg-card shadow-card p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl stat-card-emerald icon-emerald">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{bezahltCount}</p>
              <p className="text-xs text-muted-foreground">Bezahlte Anmeldungen</p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card shadow-card p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl stat-card-amber icon-amber">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{offenCount}</p>
              <p className="text-xs text-muted-foreground">Zahlung ausstehend</p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card shadow-card p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl stat-card-indigo icon-indigo">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {anmeldungen.length > 0
                  ? `${Math.round((bezahltCount / anmeldungen.length) * 100)}%`
                  : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Zahlungsquote</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
