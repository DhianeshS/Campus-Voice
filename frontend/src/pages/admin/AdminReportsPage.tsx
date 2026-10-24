import { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Building2,
  Info,
  Sparkles,
} from 'lucide-react';
import { adminComplaintService } from '../../services/adminComplaint.service';
import type { ComplaintReportData } from '../../types';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Select,
  useToast,
} from '../../components/ui';

export function AdminReportsPage() {
  const { addToast } = useToast();
  const [reportData, setReportData] = useState<ComplaintReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadReports();
  }, [categoryFilter, departmentFilter, dateFrom, dateTo]);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await adminComplaintService.getReports({
        category: categoryFilter,
        department: departmentFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setReportData(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const csv = await adminComplaintService.exportComplaintsCsv({
        category: categoryFilter,
        department: departmentFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      // Trigger browser download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `campusvoice-grievances-report-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        title: 'Export Generated',
        message: 'Safe CSV report downloaded with confidential student identity protections applied.',
        variant: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Export Failed',
        message: err.message || 'Unable to generate CSV export.',
        variant: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E0D5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4] mb-1 select-none">
            <BarChart3 className="w-3 h-3 text-[#B8755D]" />
            <span>Executive Reporting & Institutional Metrics</span>
          </div>
          <h1 className="text-2xl font-bold text-[#292F2B] tracking-tight">
            Grievance Analytics & Redressal Reports
          </h1>
          <p className="text-xs text-[#68716A] mt-0.5">
            Transparent metrics computed from live database records. No fabricated data or synthetic figures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReports}
            disabled={loading}
            startIcon={<Sparkles className="w-3.5 h-3.5 text-[#365442]" />}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting}
            startIcon={<Download className="w-3.5 h-3.5" />}
          >
            {exporting ? 'Generating...' : 'Export Safe CSV'}
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-[#E5E0D5]">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-semibold text-[#292F2B] mr-2">
              <Filter className="w-3.5 h-3.5 text-[#365442]" />
              <span>Report Scope:</span>
            </div>

            {/* Category Filter */}
            <div className="w-48">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'academics', label: 'Academics & Curriculum' },
                  { value: 'faculty', label: 'Faculty Concerns' },
                  { value: 'infrastructure', label: 'Infrastructure & AV' },
                  { value: 'hostel', label: 'Hostel Facilities' },
                  { value: 'cleanliness', label: 'Campus Cleanliness' },
                  { value: 'transportation', label: 'Campus Transit' },
                  { value: 'it_services', label: 'IT & Wi-Fi' },
                  { value: 'library', label: 'Library Services' },
                ]}
              />
            </div>

            {/* Department Filter */}
            <div className="w-56">
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Departments' },
                  { value: 'Campus Facilities & Civil Works', label: 'Facilities & Civil Works' },
                  { value: 'Hostel Administration & Chief Warden', label: 'Hostel Administration' },
                  { value: 'Academic Affairs Division', label: 'Academic Affairs' },
                  { value: 'University Central Library', label: 'Central Library' },
                  { value: 'Transport Management Division', label: 'Transport Division' },
                ]}
              />
            </div>

            {/* Date Range Pickers */}
            <div className="flex items-center gap-1.5 text-xs text-[#68716A]">
              <Calendar className="w-3.5 h-3.5" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-[#E5E0D5] bg-[#FFFDF8]"
                title="Date From"
              />
              <span>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-[#E5E0D5] bg-[#FFFDF8]"
                title="Date To"
              />
            </div>

            {(categoryFilter !== 'all' || departmentFilter !== 'all' || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setDepartmentFilter('all');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-xs text-[#B8755D]"
              >
                Reset Scope
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Scorecards */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[#E5E0D5] bg-[#FFFDF8]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#68716A] uppercase tracking-wider block">
                Total Case Volume
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#292F2B]">
                  {reportData.summary.totalComplaints}
                </span>
                <span className="text-xs text-[#68716A]">grievances</span>
              </div>
              <p className="text-[11px] text-[#365442] pt-1">
                {reportData.summary.resolvedComplaints} resolved ({reportData.summary.totalComplaints > 0 ? Math.round((reportData.summary.resolvedComplaints / reportData.summary.totalComplaints) * 100) : 0}%)
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E0D5] bg-[#FFFDF8]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#68716A] uppercase tracking-wider block">
                Active / In-Progress Cases
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#B8755D]">
                  {reportData.summary.openComplaints}
                </span>
                <span className="text-xs text-[#68716A]">pending</span>
              </div>
              <p className="text-[11px] text-[#68716A] pt-1">
                Under active review or triage
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E0D5] bg-[#FFFDF8]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#68716A] uppercase tracking-wider block">
                Avg. Resolution Turnaround
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#365442]">
                  {reportData.summary.avgResolutionHours}
                </span>
                <span className="text-xs text-[#68716A]">hours</span>
              </div>
              <p className="text-[11px] text-[#68716A] pt-1">
                Median: {reportData.summary.medianResolutionHours}h
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E0D5] bg-[#FFFDF8]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#68716A] uppercase tracking-wider block">
                Institutional SLA Compliance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700">
                  {reportData.summary.slaComplianceRate}%
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 pt-1 font-medium">
                Resolved within 72-hour benchmark
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Visualizations Grid */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Status Breakdown */}
          <Card className="border-[#E5E0D5]">
            <CardHeader className="pb-3 border-b border-[#E5E0D5]/60 bg-[#FAF8F3]/50">
              <CardTitle className="text-sm font-bold text-[#292F2B]">
                Grievance Volume by Current Status
              </CardTitle>
              <CardDescription className="text-xs">
                Distribution across the formal redressal lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {reportData.statusDistribution.map((s) => (
                <div key={s.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#292F2B] capitalize">
                      {s.status.replace('_', ' ')}
                    </span>
                    <span className="text-[#68716A]">
                      {s.count} cases ({s.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#FAF8F3] border border-[#E5E0D5] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        s.status === 'resolved'
                          ? 'bg-emerald-600'
                          : s.status === 'in_progress'
                          ? 'bg-[#365442]'
                          : s.status === 'under_review'
                          ? 'bg-[#496B58]'
                          : s.status === 'submitted'
                          ? 'bg-[#A7B8A5]'
                          : 'bg-[#B8755D]'
                      }`}
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 2. Category Distribution */}
          <Card className="border-[#E5E0D5]">
            <CardHeader className="pb-3 border-b border-[#E5E0D5]/60 bg-[#FAF8F3]/50">
              <CardTitle className="text-sm font-bold text-[#292F2B]">
                Grievances by Category Taxonomy
              </CardTitle>
              <CardDescription className="text-xs">
                Operational volume distribution across campus wings
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {reportData.categoryDistribution.map((c) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#292F2B] capitalize">
                      {c.category.replace('_', ' ')}
                    </span>
                    <span className="text-[#68716A]">
                      {c.count} cases ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#FAF8F3] border border-[#E5E0D5] overflow-hidden">
                    <div
                      className="h-full bg-[#365442] transition-all duration-300"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 3. Real Resolution Turnaround Distribution */}
          <Card className="border-[#E5E0D5]">
            <CardHeader className="pb-3 border-b border-[#E5E0D5]/60 bg-[#FAF8F3]/50">
              <CardTitle className="text-sm font-bold text-[#292F2B]">
                Resolution Turnaround Time Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Measured from initial submission timestamp to formal closure
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xl font-extrabold text-emerald-800">
                    {reportData.resolutionTimeDistribution.under24Hours}
                  </span>
                  <span className="block text-[10px] font-semibold text-emerald-700 mt-0.5">
                    &lt; 24 Hours
                  </span>
                  <span className="block text-[9px] text-emerald-600">Rapid Fix</span>
                </div>

                <div className="p-3 rounded-xl bg-[#E6EDE5] border border-[#A7B8A5]">
                  <span className="text-xl font-extrabold text-[#365442]">
                    {reportData.resolutionTimeDistribution.oneToThreeDays}
                  </span>
                  <span className="block text-[10px] font-semibold text-[#365442] mt-0.5">
                    1 – 3 Days
                  </span>
                  <span className="block text-[9px] text-[#496B58]">Standard SLA</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-xl font-extrabold text-amber-800">
                    {reportData.resolutionTimeDistribution.threeToSevenDays}
                  </span>
                  <span className="block text-[10px] font-semibold text-amber-700 mt-0.5">
                    3 – 7 Days
                  </span>
                  <span className="block text-[9px] text-amber-600">Extended Review</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-xl font-extrabold text-rose-800">
                    {reportData.resolutionTimeDistribution.overSevenDays}
                  </span>
                  <span className="block text-[10px] font-semibold text-rose-700 mt-0.5">
                    &gt; 7 Days
                  </span>
                  <span className="block text-[9px] text-rose-600">Complex Civil/Policy</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Submissions Over Time Trend */}
          <Card className="border-[#E5E0D5]">
            <CardHeader className="pb-3 border-b border-[#E5E0D5]/60 bg-[#FAF8F3]/50">
              <CardTitle className="text-sm font-bold text-[#292F2B]">
                Submission Volume Over Time
              </CardTitle>
              <CardDescription className="text-xs">
                Daily grievance intake cadence
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {reportData.submissionsOverTime.length === 0 ? (
                <p className="text-xs text-[#68716A] py-8 text-center">
                  No submissions recorded within current date scope.
                </p>
              ) : (
                <div className="space-y-2">
                  {reportData.submissionsOverTime.map((d) => (
                    <div key={d.date} className="flex items-center gap-3 text-xs">
                      <span className="w-24 font-mono text-[11px] text-[#68716A]">{d.date}</span>
                      <div className="flex-1 h-3 rounded bg-[#FAF8F3] border border-[#E5E0D5] overflow-hidden">
                        <div
                          className="h-full bg-[#496B58]"
                          style={{
                            width: `${Math.min(100, (d.count / Math.max(...reportData.submissionsOverTime.map((x) => x.count))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right font-bold text-[#292F2B]">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. Department-Level Summaries Table */}
      {reportData && (
        <Card className="border-[#E5E0D5]">
          <CardHeader className="pb-3 border-b border-[#E5E0D5]/60 bg-[#FAF8F3]/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#365442]" />
              <CardTitle className="text-sm font-bold text-[#292F2B]">
                Department-Level Performance & Redressal Ledger
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Resolution velocity and student satisfaction scores by institutional division
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E0D5] bg-[#FAF8F3] text-[#68716A]">
                    <th className="py-3 px-4 font-semibold">Department Division</th>
                    <th className="py-3 px-4 font-semibold text-center">Total Cases</th>
                    <th className="py-3 px-4 font-semibold text-center">Resolved</th>
                    <th className="py-3 px-4 font-semibold text-center">In Progress</th>
                    <th className="py-3 px-4 font-semibold text-center">Avg. Turnaround</th>
                    <th className="py-3 px-4 font-semibold text-right">Student Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5]/60">
                  {reportData.departmentSummaries.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F3]/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#292F2B]">
                        {dept.department}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#292F2B]">
                        {dept.total}
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-700 font-semibold">
                        {dept.resolved}
                      </td>
                      <td className="py-3 px-4 text-center text-[#B8755D] font-semibold">
                        {dept.inProgress}
                      </td>
                      <td className="py-3 px-4 text-center text-[#68716A]">
                        {dept.avgResolutionHours > 0 ? `${dept.avgResolutionHours} hrs` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {dept.avgSatisfactionRating ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <span>★</span>
                            <span>{dept.avgSatisfactionRating}</span>
                          </span>
                        ) : (
                          <span className="text-[#8C948E]">Unrated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Methodology & Governance Note */}
      <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] text-xs text-[#68716A] space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-[#292F2B]">
          <Info className="w-4 h-4 text-[#365442]" />
          <span>Metric Governance & Transparent Definitions</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          <strong>Resolution Time:</strong> Exact elapsed duration calculated between initial submission timestamp (<code>created_at</code>) and final resolution milestone (<code>resolved_at</code>).
          <br />
          <strong>SLA Target:</strong> University standard benchmark is 72 hours for standard tickets and 24 hours for urgent tickets.
          <br />
          <strong>Confidentiality Safeguard:</strong> Exports sanitize student identities on sensitive or confidential grievances to prevent unauthorized disclosure.
        </p>
      </div>
    </div>
  );
}
