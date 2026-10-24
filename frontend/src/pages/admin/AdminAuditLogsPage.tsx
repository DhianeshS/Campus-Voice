import { useState, useEffect, useCallback } from 'react';
import {
  ScrollText,
  Search,
  ShieldCheck,
  RefreshCw,
  Clock,
  UserCheck,
  ArrowRight,
  Lock,
  Download,
} from 'lucide-react';
import { adminComplaintService } from '../../services/adminComplaint.service';
import type { AuditLogEntry } from '../../types';
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
  useToast,
} from '../../components/ui';

export function AdminAuditLogsPage() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(() => {
    setLoading(true);
    try {
      const data = adminComplaintService.getAuditLogs(actionFilter);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit trail', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Client-side search filtering
  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      (log.complaintRef && log.complaintRef.toLowerCase().includes(q)) ||
      log.actorEmail.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'STATUS_CHANGED':
        return 'bg-[#E6EDE5] text-[#365442] border-[#A7B8A5]';
      case 'ASSIGNED':
        return 'bg-[#FAF8F3] text-[#496B58] border-[#A7B8A5]';
      case 'INFO_REQUESTED':
        return 'bg-[#FAF2EE] text-[#8C6D46] border-[#DEAF9F]';
      case 'RESOLVED':
        return 'bg-[#E6EDE5] text-[#2A4234] border-[#365442]';
      case 'CLOSED':
        return 'bg-[#FAF8F3] text-[#68716A] border-[#E5E0D5]';
      case 'REOPENED':
        return 'bg-[#FAF2EE] text-[#B8755D] border-[#DEAF9F]';
      case 'ROLE_CHANGED':
        return 'bg-[#FAF2EE] text-[#B8755D] border-[#DEAF9F]';
      case 'CATEGORY_UPDATED':
        return 'bg-[#FAF8F3] text-[#365442] border-[#A7B8A5]';
      default:
        return 'bg-[#FAF8F3] text-[#68716A] border-[#E5E0D5]';
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      addToast({
        title: 'No Data to Export',
        message: 'The current audit filter returned zero entries.',
        variant: 'error',
      });
      return;
    }

    const headers = ['Log ID', 'Timestamp', 'Action', 'Reference', 'Actor Email', 'Role', 'Details', 'Old Value', 'New Value'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.action,
      l.complaintRef || 'N/A',
      l.actorEmail,
      l.actorRole,
      `"${l.details.replace(/"/g, '""')}"`,
      l.oldValue || '',
      l.newValue || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campusvoice_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: 'Audit Log Exported',
      message: `${filteredLogs.length} verified immutable audit records downloaded.`,
      variant: 'success',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E0D5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4] mb-1 select-none">
            <Lock className="w-3 h-3 text-[#B8755D]" />
            <span>Immutable Administrative Record</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F2B] tracking-tight">
            Institutional Audit Trail
          </h1>
          <p className="text-xs text-[#68716A] mt-1 max-w-2xl leading-relaxed">
            Append-only verification ledger of all officer assignments, status transitions, resolution statements, role updates, and taxonomy changes. Ordinary users cannot alter or purge these records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={loadLogs}
            startIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Ledger
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleExportCSV}
            startIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* 2. Immutability Callout */}
      <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#365442] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-[#292F2B]">
            Regulatory Integrity: Append-Only Administrative Ledger
          </span>
          <p className="text-[#68716A] leading-relaxed">
            Every consequential action executed across the CampusVoice administration workspace is recorded chronologically with actor identity, timestamp, and previous state. Log entries cannot be deleted, mutated, or forged.
          </p>
        </div>
      </div>

      {/* 3. Search and Action Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C948E]" />
            <Input
              type="text"
              placeholder="Search by case reference (e.g. CV-2026-), actor email, or action description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs w-full"
            />
          </div>

          <div className="w-full sm:w-64">
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              options={[
                { label: 'All Action Categories', value: 'all' },
                { label: 'Status Transitions (STATUS_CHANGED)', value: 'STATUS_CHANGED' },
                { label: 'Officer Assignments (ASSIGNED)', value: 'ASSIGNED' },
                { label: 'Information Requests (INFO_REQUESTED)', value: 'INFO_REQUESTED' },
                { label: 'Resolution Records (RESOLVED)', value: 'RESOLVED' },
                { label: 'Case Closures (CLOSED)', value: 'CLOSED' },
                { label: 'Reopened Cases (REOPENED)', value: 'REOPENED' },
                { label: 'User Role Governance (ROLE_CHANGED)', value: 'ROLE_CHANGED' },
                { label: 'Category Taxonomy (CATEGORY_UPDATED)', value: 'CATEGORY_UPDATED' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Audit Log Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E5E0D5] text-[#68716A] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Reference No.</th>
                <th className="py-3 px-4">Authorized Actor</th>
                <th className="py-3 px-4">Action Summary & Audit Details</th>
                <th className="py-3 px-4">State Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D5]/70 bg-[#FFFDF8]">
              {filteredLogs.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                  {/* Timestamp */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#68716A]">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-[#8C948E]" />
                      <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Action Event Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getActionBadge(
                        entry.action
                      )}`}
                    >
                      {entry.action.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Reference No. */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {entry.complaintRef ? (
                      <span className="font-mono text-[11px] font-semibold text-[#365442] bg-[#E6EDE5]/60 px-1.5 py-0.5 rounded border border-[#A7B8A5]">
                        {entry.complaintRef}
                      </span>
                    ) : (
                      <span className="text-[#8C948E] font-mono text-[11px]">GLOBAL-SYS</span>
                    )}
                  </td>

                  {/* Authorized Actor */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#365442] shrink-0" />
                      <div>
                        <span className="font-semibold text-[#292F2B] block">
                          {entry.actorEmail}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[#8C948E]">
                          {entry.actorRole}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Action Summary & Details */}
                  <td className="py-3.5 px-4 text-[#292F2B]">
                    <p className="line-clamp-2 leading-relaxed">{entry.details}</p>
                  </td>

                  {/* State Transition */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {entry.oldValue && entry.newValue ? (
                      <div className="flex items-center gap-1 text-[11px] font-mono">
                        <span className="text-[#8C948E] line-through">{entry.oldValue}</span>
                        <ArrowRight className="w-3 h-3 text-[#68716A]" />
                        <span className="font-bold text-[#365442]">{entry.newValue}</span>
                      </div>
                    ) : entry.newValue ? (
                      <span className="text-[11px] font-mono text-[#365442] font-semibold">
                        {entry.newValue}
                      </span>
                    ) : (
                      <span className="text-[#8C948E]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredLogs.length === 0 && (
        <Card className="p-8 text-center">
          <ScrollText className="w-8 h-8 text-[#8C948E] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#292F2B]">No audit records found</h3>
          <p className="text-xs text-[#68716A] mt-1">
            No entries match your current search criteria or action filter.
          </p>
        </Card>
      )}
    </div>
  );
}
