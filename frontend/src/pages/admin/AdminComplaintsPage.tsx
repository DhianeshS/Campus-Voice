import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Building2,
  BookOpen,
  Utensils,
  ShieldCheck,
  Laptop,
  Truck,
  Sparkles,
  Lock,
  User,
  Shield,
  Eye,
  CheckCircle2,
  UserCheck,
  HelpCircle,
  FolderCheck,
  RotateCcw,
  RefreshCw,
  LockKeyhole,
} from 'lucide-react';
import { adminComplaintService } from '../../services/adminComplaint.service';
import { INSTITUTIONAL_CATEGORIES } from '../../services/studentComplaint.service';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  AdminStaffOfficer,
} from '../../types';
import {
  Button,
  Input,
  Select,
  StatusBadge,
  Card,
  CardContent,
  Modal,
  Textarea,
  useToast,
  EmptyState,
} from '../../components/ui';

export function AdminComplaintsPage() {
  const { addToast } = useToast();

  // State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [department, setDepartment] = useState('all');
  const [assignedTo, setAssignedTo] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'updated'>('newest');

  // Officers list for assignment
  const [officers, setOfficers] = useState<AdminStaffOfficer[]>([]);

  // Triage & Action Modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);

  // Action Sub-Forms State
  const [activeTab, setActiveTab] = useState<'details' | 'assign' | 'status' | 'request_info' | 'resolve' | 'timeline'>('details');
  const [assigneeId, setAssigneeId] = useState('');
  const [statusToSet, setStatusToSet] = useState<ComplaintStatus>('in_progress');
  const [publicNote, setPublicNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [infoQuestion, setInfoQuestion] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [closeReason, setCloseReason] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [confirmActionModal, setConfirmActionModal] = useState<{
    type: 'resolve' | 'close' | 'reopen';
    title: string;
    message: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminComplaintService.getComplaints({
        search,
        status,
        category,
        priority,
        department,
        assignedTo,
        dateRange,
        sortBy,
        page,
        limit,
      });
      setComplaints(res.complaints);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load complaints table', err);
      addToast({
        title: 'Error loading complaints',
        message: 'Unable to retrieve administrative complaint records.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [search, status, category, priority, department, assignedTo, dateRange, sortBy, page, limit, addToast]);

  useEffect(() => {
    setOfficers(adminComplaintService.getOfficers());
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Open Triage Console
  const handleOpenTriage = (c: Complaint) => {
    setSelectedComplaint(c);
    setActiveTab('details');
    setAssigneeId(c.assignedTo || '');
    setStatusToSet(c.status);
    setPublicNote('');
    setInternalNote('');
    setInfoQuestion('');
    setResolutionSummary(c.resolutionSummary || '');
    setActionModalOpen(true);
  };

  // Perform Assignment
  const handleAssign = async () => {
    if (!selectedComplaint || !assigneeId) return;
    const officer = officers.find((o) => o.id === assigneeId);
    if (!officer) return;

    setActionLoading(true);
    try {
      const updated = await adminComplaintService.assignComplaint(
        selectedComplaint.id,
        officer.id,
        officer.name
      );
      setSelectedComplaint(updated);
      addToast({
        title: 'Assignment Updated',
        message: `Case ${selectedComplaint.id} assigned to ${officer.name}.`,
        variant: 'success',
      });
      fetchComplaints();
    } catch (err: any) {
      addToast({ title: 'Assignment Failed', message: err.message, variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Status Milestone Update
  const handleStatusUpdate = async () => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      const updated = await adminComplaintService.updateStatus(
        selectedComplaint.id,
        statusToSet,
        publicNote,
        internalNote
      );
      setSelectedComplaint(updated);
      setPublicNote('');
      setInternalNote('');
      addToast({
        title: 'Status Updated',
        message: `Status set to ${statusToSet.replace('_', ' ')}. Audit logged.`,
        variant: 'success',
      });
      fetchComplaints();
    } catch (err: any) {
      addToast({ title: 'Update Failed', message: err.message, variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Request Info
  const handleRequestInfo = async () => {
    if (!selectedComplaint || !infoQuestion.trim()) return;
    setActionLoading(true);
    try {
      const updated = await adminComplaintService.requestInfo(selectedComplaint.id, infoQuestion.trim());
      setSelectedComplaint(updated);
      setInfoQuestion('');
      addToast({
        title: 'Information Requested',
        message: 'Clarification query dispatched to student complainant.',
        variant: 'success',
      });
      fetchComplaints();
    } catch (err: any) {
      addToast({ title: 'Request Failed', message: err.message, variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Consequential Action Execution (Confirmed)
  const executeConfirmedAction = async () => {
    if (!selectedComplaint || !confirmActionModal) return;
    setActionLoading(true);

    try {
      if (confirmActionModal.type === 'resolve') {
        const updated = await adminComplaintService.resolveComplaint(
          selectedComplaint.id,
          resolutionSummary
        );
        setSelectedComplaint(updated);
        addToast({ title: 'Grievance Resolved', message: 'Resolution summary logged.', variant: 'success' });
      } else if (confirmActionModal.type === 'close') {
        const updated = await adminComplaintService.closeComplaint(
          selectedComplaint.id,
          closeReason || 'Administrative closure.'
        );
        setSelectedComplaint(updated);
        addToast({ title: 'Case Closed', message: 'Case formally archived.', variant: 'info' });
      } else if (confirmActionModal.type === 'reopen') {
        const updated = await adminComplaintService.reopenComplaint(
          selectedComplaint.id,
          reopenReason || 'Reopened for investigation.'
        );
        setSelectedComplaint(updated);
        addToast({ title: 'Case Reopened', message: 'Case placed in active queue.', variant: 'success' });
      }
      setConfirmActionModal(null);
      fetchComplaints();
    } catch (err: any) {
      addToast({ title: 'Action Failed', message: err.message, variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryIcon = (cat: ComplaintCategory) => {
    switch (cat) {
      case 'academics':
      case 'academic':
        return <BookOpen className="w-3.5 h-3.5 text-[#496B58]" />;
      case 'faculty':
        return <User className="w-3.5 h-3.5 text-[#365442]" />;
      case 'infrastructure':
        return <Building2 className="w-3.5 h-3.5 text-[#496B58]" />;
      case 'hostel':
        return <Building2 className="w-3.5 h-3.5 text-[#365442]" />;
      case 'library':
        return <BookOpen className="w-3.5 h-3.5 text-[#365442]" />;
      case 'transportation':
        return <Truck className="w-3.5 h-3.5 text-[#496B58]" />;
      case 'cleanliness':
        return <Sparkles className="w-3.5 h-3.5 text-[#365442]" />;
      case 'it_services':
        return <Laptop className="w-3.5 h-3.5 text-[#496B58]" />;
      case 'harassment_misconduct':
        return <Shield className="w-3.5 h-3.5 text-[#B8755D]" />;
      case 'cafeteria':
        return <Utensils className="w-3.5 h-3.5 text-[#365442]" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-[#365442]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E0D5]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F2B] tracking-tight">
            Complaints Management Ledger
          </h1>
          <p className="text-xs text-[#68716A] mt-1">
            Institutional grievance queue: review, assign investigating officers, record resolution milestones, and track SLA compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={fetchComplaints}
            disabled={loading}
            startIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* Multi-Criteria Filters Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="sm:col-span-2">
              <Input
                placeholder="Search reference, title, description, location, or student..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                startIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Status Filter */}
            <Select
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'submitted', label: 'Submitted (New)' },
                { value: 'under_review', label: 'Under Review' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'awaiting_information', label: 'Awaiting Info' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
                { value: 'reopened', label: 'Reopened' },
              ]}
            />

            {/* Category Filter */}
            <Select
              label="Category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All 11 Categories' },
                ...INSTITUTIONAL_CATEGORIES.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-[#E5E0D5]/70">
            {/* Priority Filter */}
            <Select
              label="Priority"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />

            {/* Department Filter */}
            <Select
              label="Department"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Departments' },
                { value: 'Estate & Campus Works', label: 'Estate & Campus Works' },
                { value: 'Academic Affairs', label: 'Academic Affairs' },
                { value: 'Hostel Administration', label: 'Hostel Administration' },
                { value: 'Internal Complaints Committee', label: 'ICC (Sensitive)' },
                { value: 'IT Infrastructure & Networking', label: 'IT & Networking' },
                { value: 'Transport Division', label: 'Transport Division' },
                { value: 'University Library', label: 'University Library' },
              ]}
            />

            {/* Assignment Filter */}
            <Select
              label="Officer Assignment"
              value={assignedTo}
              onChange={(e) => {
                setAssignedTo(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Assignments' },
                { value: 'unassigned', label: 'Unassigned Cases' },
                { value: 'me', label: 'Assigned to Me' },
                ...officers.map((o) => ({ value: o.name, label: o.name })),
              ]}
            />

            {/* Date Range Filter */}
            <Select
              label="Date Window"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today (24h)' },
                { value: '7d', label: 'Past 7 Days' },
                { value: '30d', label: 'Past 30 Days' },
              ]}
            />

            {/* Sorting */}
            <Select
              label="Sort Sequence"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'priority', label: 'Highest Priority' },
                { value: 'updated', label: 'Recently Updated' },
              ]}
            />

            {/* Page Size / Limit */}
            <Select
              label="Items Per Page"
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              options={[
                { value: '10', label: '10 per page' },
                { value: '15', label: '15 per page' },
                { value: '25', label: '25 per page' },
                { value: '50', label: '50 per page' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table / Cards */}
      <div className="space-y-4">
        {/* Count and Reset summary */}
        <div className="flex items-center justify-between text-xs text-[#68716A] px-1">
          <span>
            Total: <strong>{total}</strong> complaints recorded across the university
          </span>
          {(search || status !== 'all' || category !== 'all' || priority !== 'all' || department !== 'all' || assignedTo !== 'all' || dateRange !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatus('all');
                setCategory('all');
                setPriority('all');
                setAssignedTo('all');
                setDateRange('all');
                setSortBy('newest');
                setPage(1);
              }}
              className="text-[11px] font-semibold text-[#496B58] hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-6 bg-[#E5E0D5]/50 rounded animate-pulse w-1/3 mb-2" />
                  <div className="h-4 bg-[#E5E0D5]/30 rounded animate-pulse w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="No Complaints in Current Ledger"
                description="No grievance records match your active query criteria."
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden lg:block overflow-x-auto rounded-xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-subtle">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E0D5] bg-[#FAF8F3] text-[11px] font-semibold text-[#292F2B] uppercase tracking-wider select-none">
                    <th className="px-3.5 py-3 w-32">Reference</th>
                    <th className="px-3.5 py-3">Complaint Title & Location</th>
                    <th className="px-3.5 py-3 w-40">Student Complainant</th>
                    <th className="px-3.5 py-3 w-36">Category</th>
                    <th className="px-3.5 py-3 w-28">Priority</th>
                    <th className="px-3.5 py-3 w-36">Assigned Officer</th>
                    <th className="px-3.5 py-3 w-32">Status</th>
                    <th className="px-3.5 py-3 w-28">Submitted</th>
                    <th className="px-3.5 py-3 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5]/70 text-xs text-[#292F2B]">
                  {complaints.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                      {/* Reference */}
                      <td className="px-3.5 py-3 font-mono font-bold text-[11px] text-[#292F2B]">
                        <span className="bg-[#E6EDE5]/80 px-2 py-0.5 rounded border border-[#A7B8A5]/50 inline-flex items-center gap-1">
                          {item.id}
                          {item.isConfidential && (
                            <span title="Protected Identity">
                              <Lock className="w-3 h-3 text-[#B8755D]" />
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Title & Location */}
                      <td className="px-3.5 py-3">
                        <span className="font-semibold text-xs text-[#292F2B] block line-clamp-1">
                          {item.title}
                        </span>
                        {item.location && (
                          <span className="text-[11px] text-[#68716A] flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-[#496B58]" />
                            {item.location}
                          </span>
                        )}
                      </td>

                      {/* Student Complainant */}
                      <td className="px-3.5 py-3">
                        {item.isConfidential ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B8755D] bg-[#FAF2EE] px-2 py-0.5 rounded border border-[#ECCEC4]">
                            <Lock className="w-3 h-3" />
                            Protected Identity
                          </span>
                        ) : (
                          <div>
                            <span className="font-semibold text-xs block text-[#292F2B] truncate max-w-[140px]">
                              {item.userFullName || 'Student'}
                            </span>
                            <span className="text-[10px] text-[#68716A] block truncate max-w-[140px]">
                              {item.userEmail || ''}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-3.5 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-[#FAF8F3] text-[#292F2B] border border-[#E5E0D5] capitalize">
                          {getCategoryIcon(item.category)}
                          <span className="truncate max-w-[120px]">{item.category.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <StatusBadge priority={item.priority} />
                      </td>

                      {/* Assigned Officer */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {item.assignedToName ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#365442]">
                            <UserCheck className="w-3.5 h-3.5 text-[#496B58]" />
                            <span className="truncate max-w-[120px]">{item.assignedToName}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8C948E] italic bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#E5E0D5]">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* Submission Date */}
                      <td className="px-3.5 py-3 text-[#68716A] whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="px-3.5 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTriage(item)}
                          startIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Triage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS VIEW */}
            <div className="lg:hidden space-y-3">
              {complaints.map((item) => (
                <Card key={item.id} className="shadow-subtle">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs bg-[#E6EDE5]/80 px-2 py-0.5 rounded border border-[#A7B8A5]">
                        {item.id}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#292F2B]">{item.title}</h3>
                      <p className="text-xs text-[#68716A] line-clamp-2 mt-1">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E0D5]">
                      <span className="text-[11px] text-[#68716A]">
                        Officer: <strong>{item.assignedToName || 'Unassigned'}</strong>
                      </span>
                      <StatusBadge priority={item.priority} />
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => handleOpenTriage(item)}
                      startIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Open Administrative Triage
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D5] text-xs">
                <span className="text-[#68716A]">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ADMINISTRATIVE TRIAGE & CONTEXT MODAL */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        size="lg"
        title={selectedComplaint ? `Case File: ${selectedComplaint.id}` : 'Grievance File'}
        description="Administrative action panel: Assign officers, update status, add internal notes, and record verified resolutions."
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-[#68716A]">
              SLA Reference: 48-Hour Remediation Protocol
            </span>
            <Button variant="outline" size="sm" onClick={() => setActionModalOpen(false)}>
              Close Panel
            </Button>
          </div>
        }
      >
        {selectedComplaint && (
          <div className="space-y-5 text-left text-xs">
            {/* Action Sub-Tabs */}
            <div className="flex items-center gap-1 border-b border-[#E5E0D5] pb-2 overflow-x-auto select-none">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'details' ? 'bg-[#365442] text-white' : 'text-[#68716A] hover:bg-[#FAF8F3]'
                }`}
              >
                Case File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('assign')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'assign' ? 'bg-[#365442] text-white' : 'text-[#68716A] hover:bg-[#FAF8F3]'
                }`}
              >
                Assign Officer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('status')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'status' ? 'bg-[#365442] text-white' : 'text-[#68716A] hover:bg-[#FAF8F3]'
                }`}
              >
                Update Status
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('request_info')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'request_info' ? 'bg-[#365442] text-white' : 'text-[#68716A] hover:bg-[#FAF8F3]'
                }`}
              >
                Request Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('resolve')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'resolve' ? 'bg-[#365442] text-white' : 'text-[#68716A] hover:bg-[#FAF8F3]'
                }`}
              >
                Resolution
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'timeline' ? 'bg-[#365442] text-white' : 'text-[#68716A] hover:bg-[#FAF8F3]'
                }`}
              >
                Timeline Audit
              </button>
            </div>

            {/* TAB 1: DETAILS */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#292F2B]">{selectedComplaint.title}</h3>
                    <p className="text-[11px] text-[#68716A] mt-0.5">
                      Submitted on {new Date(selectedComplaint.createdAt).toLocaleString()} by{' '}
                      <strong>{selectedComplaint.userFullName || 'Student'}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge priority={selectedComplaint.priority} />
                    <StatusBadge status={selectedComplaint.status} size="md" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#FFFDF8] border border-[#E5E0D5] whitespace-pre-wrap leading-relaxed">
                  {selectedComplaint.description}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg border border-[#E5E0D5] bg-[#FAF8F3]">
                    <span className="text-[10px] uppercase font-bold text-[#8C948E] block">Category</span>
                    <span className="font-semibold text-[#292F2B] capitalize">
                      {selectedComplaint.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#E5E0D5] bg-[#FAF8F3]">
                    <span className="text-[10px] uppercase font-bold text-[#8C948E] block">Assigned To</span>
                    <span className="font-semibold text-[#365442]">
                      {selectedComplaint.assignedToName || 'Unassigned'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#E5E0D5] bg-[#FAF8F3]">
                    <span className="text-[10px] uppercase font-bold text-[#8C948E] block">Location</span>
                    <span className="font-semibold text-[#292F2B]">
                      {selectedComplaint.location || 'Central Campus'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ASSIGN OFFICER */}
            {activeTab === 'assign' && (
              <div className="space-y-4">
                <p className="text-xs text-[#68716A]">
                  Assign an authorized faculty head, warden, or facility engineer to spearhead investigation.
                </p>

                <Select
                  label="Select Investigating Officer *"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  options={[
                    { value: '', label: '-- Select Departmental Officer --' },
                    ...officers.map((o) => ({
                      value: o.id,
                      label: `${o.name} (${o.department}) — ${o.activeCases} active cases`,
                    })),
                  ]}
                />

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleAssign}
                  isLoading={actionLoading}
                  disabled={!assigneeId || actionLoading}
                  startIcon={<UserCheck className="w-4 h-4" />}
                >
                  Save Officer Assignment
                </Button>
              </div>
            )}

            {/* TAB 3: UPDATE STATUS */}
            {activeTab === 'status' && (
              <div className="space-y-4">
                <Select
                  label="Target Status Milestone *"
                  value={statusToSet}
                  onChange={(e) => setStatusToSet(e.target.value as ComplaintStatus)}
                  options={[
                    { value: 'under_review', label: 'Under Review' },
                    { value: 'assigned', label: 'Assigned to Officer' },
                    { value: 'in_progress', label: 'Investigation In Progress' },
                    { value: 'awaiting_information', label: 'Awaiting Student Info' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'closed', label: 'Closed' },
                    { value: 'reopened', label: 'Reopened' },
                  ]}
                />

                <Textarea
                  label="Student-Visible Update Note"
                  rows={3}
                  value={publicNote}
                  onChange={(e) => setPublicNote(e.target.value)}
                  placeholder="Official public progress update displayed on the student's chronological tracking timeline..."
                  helperText="Visible to student complainant in their portal."
                />

                <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#DEAF9F] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#B8755D] text-xs">
                    <LockKeyhole className="w-3.5 h-3.5" />
                    <span>Confidential Internal Staff Note</span>
                  </div>
                  <Textarea
                    rows={2}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Confidential notes between staff and ombudsperson. Strictly sanitized from student view..."
                  />
                  <span className="text-[10px] text-[#68716A]">
                    * Verified: Internal staff notes are stripped on the server before transmitting to student endpoints.
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStatusUpdate}
                  isLoading={actionLoading}
                  disabled={actionLoading}
                >
                  Publish Status Milestone
                </Button>
              </div>
            )}

            {/* TAB 4: REQUEST INFO */}
            {activeTab === 'request_info' && (
              <div className="space-y-4">
                <p className="text-xs text-[#68716A]">
                  Request specific factual clarifications or proof from the student complainant.
                </p>

                <Textarea
                  label="Clarification Inquiry *"
                  rows={4}
                  value={infoQuestion}
                  onChange={(e) => setInfoQuestion(e.target.value)}
                  placeholder="e.g., Please specify your hostel room number and the exact time water pressure dropped..."
                  helperText="This inquiry switches case status to 'Awaiting Info' and sends an alert."
                />

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRequestInfo}
                  isLoading={actionLoading}
                  disabled={!infoQuestion.trim() || actionLoading}
                  startIcon={<HelpCircle className="w-4 h-4" />}
                >
                  Send Student Inquiry
                </Button>
              </div>
            )}

            {/* TAB 5: RESOLUTION & CLOSURE */}
            {activeTab === 'resolve' && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-[#E6EDE5]/70 border border-[#A7B8A5] space-y-2">
                  <span className="font-bold text-xs text-[#365442] block">
                    Record Remediation & Verified Resolution
                  </span>
                  <Textarea
                    label="Resolution Summary *"
                    rows={3}
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="Detailed explanation of corrective actions taken, date resolved, and verification results..."
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setConfirmActionModal({
                        type: 'resolve',
                        title: 'Confirm Grievance Resolution',
                        message: 'This will formally mark the grievance as Resolved and invite student satisfaction feedback.',
                      })
                    }
                    disabled={!resolutionSummary.trim()}
                    startIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Confirm Resolution
                  </Button>
                </div>

                <div className="pt-3 border-t border-[#E5E0D5] space-y-3">
                  <span className="font-bold text-xs text-[#292F2B] block">Formal Closure or Case Reopening</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Input
                        label="Closure Rationale"
                        placeholder="e.g., Matter resolved satisfactorily..."
                        value={closeReason}
                        onChange={(e) => setCloseReason(e.target.value)}
                        className="text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          setConfirmActionModal({
                            type: 'close',
                            title: 'Confirm Case Closure',
                            message: `This will formally archive the case. Reason: "${closeReason || 'Administrative closure'}".`,
                          })
                        }
                        startIcon={<FolderCheck className="w-3.5 h-3.5 text-[#68716A]" />}
                      >
                        Close Case
                      </Button>
                    </div>

                    <div>
                      <Input
                        label="Reopening Justification"
                        placeholder="e.g., New evidence submitted..."
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        className="text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-[#B8755D] border-[#DEAF9F] hover:bg-[#FAF2EE]"
                        onClick={() =>
                          setConfirmActionModal({
                            type: 'reopen',
                            title: 'Confirm Reopening Case',
                            message: `This will reopen the grievance to active queue. Reason: "${reopenReason || 'Reopened for investigation'}".`,
                          })
                        }
                        startIcon={<RotateCcw className="w-3.5 h-3.5 text-[#B8755D]" />}
                      >
                        Reopen Case
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: TIMELINE AUDIT */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <span className="font-bold text-xs text-[#292F2B] block">
                  Chronological Milestone Ledger
                </span>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E0D5]">
                  {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 ? (
                    selectedComplaint.timeline.map((event, idx) => (
                      <div key={event.id || idx} className="relative">
                        <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#365442] border-2 border-white text-white flex items-center justify-center">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        </span>

                        <div className="p-3 rounded-lg border border-[#E5E0D5] bg-[#FAF8F3] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#292F2B]">{event.title}</span>
                            <span className="text-[10px] text-[#8C948E]">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-[#68716A]">{event.description}</p>
                          {event.internalNote && (
                            <div className="p-2 rounded bg-[#FAF2EE] border border-[#ECCEC4] text-[11px] text-[#B8755D] mt-1">
                              <strong>Confidential Internal Note:</strong> {event.internalNote}
                            </div>
                          )}
                          <span className="text-[10px] text-[#365442] font-semibold block">
                            Logged by: {event.actor} ({event.actorRole})
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#68716A] italic">No timeline milestones logged.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Consequential Action Confirmation Modal */}
      <Modal
        isOpen={confirmActionModal !== null}
        onClose={() => setConfirmActionModal(null)}
        title={confirmActionModal?.title || 'Confirm Action'}
        description={confirmActionModal?.message || 'Are you sure you wish to proceed?'}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={() => setConfirmActionModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={actionLoading}
              onClick={executeConfirmedAction}
            >
              Confirm & Execute Action
            </Button>
          </div>
        }
      >
        <p className="text-xs text-[#292F2B] py-2">
          This is an official administrative action and will be permanently recorded in the institutional audit log.
        </p>
      </Modal>
    </div>
  );
}
