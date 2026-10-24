import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Clock,
  SearchCheck,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Tags,
  ScrollText,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { adminComplaintService } from '../../services/adminComplaint.service';
import type { AdminDashboardMetrics, AuditLogEntry } from '../../types';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
} from '../../components/ui';

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const computedMetrics = await adminComplaintService.getMetrics();
      const logs = adminComplaintService.getAuditLogs();
      setMetrics(computedMetrics);
      setRecentLogs(logs.slice(0, 5));
    } catch (err) {
      console.error('Failed to load administrative metrics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E0D5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4] mb-1 select-none">
            <ShieldAlert className="w-3 h-3 text-[#B8755D]" />
            <span>Administrative Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F2B] tracking-tight">
            Grievance Oversight & Metrics Console
          </h1>
          <p className="text-xs text-[#68716A] mt-1 max-w-2xl leading-relaxed">
            Real-time institutional metrics, case distribution across departments, SLA compliance tracking, and administrative audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={loadData}
            disabled={loading}
            startIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            title="Refresh Real Metrics"
          >
            Refresh Data
          </Button>

          <Link to="/admin/complaints">
            <Button variant="primary" size="md" startIcon={<FolderKanban className="w-4 h-4" />}>
              Open Complaints Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. SUMMARY METRICS CARDS (Derived from actual database records) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#68716A]">
          <span className="font-semibold uppercase tracking-wider text-[#8C948E] text-[10px]">
            Institutional Grievance Metrics
          </span>
          <span className="text-[11px] font-medium text-[#365442]">Database Verified Live Counts</span>
        </div>

        {loading || !metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* 1. Total Complaints */}
            <Card className="hover:border-[#A7B8A5] transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#68716A]">
                    Total Cases
                  </span>
                  <Layers className="w-4 h-4 text-[#365442]" />
                </div>
                <div className="my-2">
                  <span className="text-2xl font-extrabold text-[#292F2B] tracking-tight block">
                    {metrics.total}
                  </span>
                  <span className="text-[10px] text-[#8C948E] block">All-time university cases</span>
                </div>
              </CardContent>
            </Card>

            {/* 2. Newly Submitted (Action Needed) */}
            <Card className="hover:border-[#A7B8A5] transition-colors border-l-4 border-l-[#8C6D46]">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D46]">
                    New / Triage
                  </span>
                  <Clock className="w-4 h-4 text-[#8C6D46]" />
                </div>
                <div className="my-2">
                  <span className="text-2xl font-extrabold text-[#292F2B] tracking-tight block">
                    {metrics.newSubmitted}
                  </span>
                  <span className="text-[10px] text-[#8C6D46] block">Awaiting officer assignment</span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Awaiting Review / Info */}
            <Card className="hover:border-[#A7B8A5] transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#68716A]">
                    Under Review
                  </span>
                  <SearchCheck className="w-4 h-4 text-[#365442]" />
                </div>
                <div className="my-2">
                  <span className="text-2xl font-extrabold text-[#292F2B] tracking-tight block">
                    {metrics.awaitingReview}
                  </span>
                  <span className="text-[10px] text-[#365442] block">Inquiry / student clarification</span>
                </div>
              </CardContent>
            </Card>

            {/* 4. In Progress */}
            <Card className="hover:border-[#A7B8A5] transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#68716A]">
                    In Progress
                  </span>
                  <TrendingUp className="w-4 h-4 text-[#2A4234]" />
                </div>
                <div className="my-2">
                  <span className="text-2xl font-extrabold text-[#292F2B] tracking-tight block">
                    {metrics.inProgress}
                  </span>
                  <span className="text-[10px] text-[#2A4234] block">Active departmental works</span>
                </div>
              </CardContent>
            </Card>

            {/* 5. Resolved */}
            <Card className="hover:border-[#A7B8A5] transition-colors border-l-4 border-l-[#2A4234]">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A4234]">
                    Resolved
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#2A4234]" />
                </div>
                <div className="my-2">
                  <span className="text-2xl font-extrabold text-[#292F2B] tracking-tight block">
                    {metrics.resolved}
                  </span>
                  <span className="text-[10px] text-[#2A4234] block">Verified & remediated</span>
                </div>
              </CardContent>
            </Card>

            {/* 6. Overdue (SLA > 48h) */}
            <Card className="hover:border-[#ECCEC4] transition-colors bg-[#FAF2EE]/50 border-l-4 border-l-[#B8755D]">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8755D]">
                    Overdue Cases
                  </span>
                  <AlertTriangle className="w-4 h-4 text-[#B8755D]" />
                </div>
                <div className="my-2">
                  <span className="text-2xl font-extrabold text-[#B8755D] tracking-tight block">
                    {metrics.overdue}
                  </span>
                  <span className="text-[10px] text-[#B8755D] block">Exceeded 48h target SLA</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* 3. Mid-Level Panels: Category Distribution & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader className="bg-[#FAF8F3]/50 pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Category Volume Breakdown</span>
              <Tags className="w-4 h-4 text-[#365442]" />
            </CardTitle>
            <CardDescription className="text-xs">
              Live case distribution across university departments
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {loading || !metrics ? (
              <Skeleton className="h-32 w-full" />
            ) : Object.keys(metrics.categoryDistribution).length === 0 ? (
              <p className="text-xs text-[#68716A] py-6 text-center">No complaints recorded yet.</p>
            ) : (
              Object.entries(metrics.categoryDistribution).map(([cat, count]) => {
                const percentage = Math.round((count / (metrics.total || 1)) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#292F2B] capitalize">
                        {cat.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-[#68716A]">
                        {count} case(s) ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E5E0D5]/70 overflow-hidden">
                      <div
                        className="h-full bg-[#496B58] rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Priority & SLA Health */}
        <Card>
          <CardHeader className="bg-[#FAF8F3]/50 pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Priority & Institutional SLA Standing</span>
              <Flame className="w-4 h-4 text-[#B8755D]" />
            </CardTitle>
            <CardDescription className="text-xs">
              Urgency stratification and SLA compliance indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {loading || !metrics ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-[#FAF2EE] border border-[#ECCEC4]">
                    <span className="text-[10px] uppercase font-bold text-[#B8755D] block">Urgent</span>
                    <span className="text-xl font-extrabold text-[#B8755D]">
                      {metrics.priorityDistribution.urgent || 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#DEAF9F]">
                    <span className="text-[10px] uppercase font-bold text-[#9C5A28] block">High</span>
                    <span className="text-xl font-extrabold text-[#9C5A28]">
                      {metrics.priorityDistribution.high || 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#E6EDE5] border border-[#A7B8A5]">
                    <span className="text-[10px] uppercase font-bold text-[#365442] block">Medium</span>
                    <span className="text-xl font-extrabold text-[#365442]">
                      {metrics.priorityDistribution.medium || 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5]">
                    <span className="text-[10px] uppercase font-bold text-[#68716A] block">Low</span>
                    <span className="text-xl font-extrabold text-[#292F2B]">
                      {metrics.priorityDistribution.low || 0}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-[#292F2B]">
                    <span>Standard SLA Target: 48 Working Hours</span>
                    <span className={metrics.overdue === 0 ? 'text-[#365442]' : 'text-[#B8755D]'}>
                      {metrics.overdue === 0 ? '100% In SLA' : `${metrics.overdue} SLA Breach(es)`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#68716A] leading-relaxed">
                    Institutional policy mandates initial triage within 24 hours and remediation plan within 48 hours. Urgent cases flag immediate ombudsperson escalation.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Recent Administrative Activity & Audit Trail Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
          <div>
            <h3 className="text-base font-bold text-[#292F2B] flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-[#365442]" />
              <span>Recent Administrative Audit Events</span>
            </h3>
            <p className="text-xs text-[#68716A]">
              Append-only audit ledger recording assignment changes, status transitions, and resolution records
            </p>
          </div>
          <Link to="/admin/audit-logs">
            <Button variant="ghost" size="sm" endIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Full Audit Ledger
            </Button>
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentLogs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-xs text-[#68716A]">
                No administrative actions logged in current cycle.
              </CardContent>
            </Card>
          ) : (
            recentLogs.map((log) => (
              <Card key={log.id} className="hover:border-[#A7B8A5] transition-colors">
                <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#365442] mt-1.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#292F2B]">{log.action.replace('_', ' ')}</span>
                        {log.complaintId && (
                          <span className="font-mono text-[10px] font-semibold bg-[#E6EDE5] text-[#365442] px-1.5 py-0.2 rounded border border-[#A7B8A5]">
                            {log.complaintId}
                          </span>
                        )}
                        <span className="text-[10px] text-[#8C948E]">by {log.actorEmail}</span>
                      </div>
                      <p className="text-xs text-[#68716A] mt-0.5">{log.details}</p>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#8C948E] shrink-0 whitespace-nowrap self-end sm:self-center">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
