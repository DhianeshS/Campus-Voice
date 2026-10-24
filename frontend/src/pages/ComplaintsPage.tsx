import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Building2,
  BookOpen,
  Utensils,
  ShieldCheck,
  Laptop,
  Truck,
  Sparkles,
  RefreshCw,
  Eye,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  StatusBadge,
  Card,
  CardContent,
  EmptyState,
  Modal,
  Skeleton,
  useToast,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import {
  studentComplaintService,
  INSTITUTIONAL_CATEGORIES,
} from '../services/studentComplaint.service';
import type { Complaint, ComplaintCategory, TimelineEvent } from '../types';

export function ComplaintsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.id || 'guest_student';

  // State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Details Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentComplaintService.getComplaints(userId);
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints', err);
      addToast({
        title: 'Error loading complaints',
        message: 'Could not fetch your grievances. Please try again.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, addToast]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Filtering Logic
  const filteredComplaints = complaints.filter((item) => {
    // Status Filter
    let matchesStatus = true;
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'submitted') {
        matchesStatus = item.status === 'submitted' || item.status === 'pending';
      } else {
        matchesStatus = item.status === selectedStatus;
      }
    }

    // Category Filter
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'academics') {
        matchesCategory = item.category === 'academics' || item.category === 'academic';
      } else {
        matchesCategory = item.category === selectedCategory;
      }
    }

    // Search Query Filter
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.department && item.department.toLowerCase().includes(q));

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Icon Helper for 11 Categories
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

  const getCategoryLabel = (cat: ComplaintCategory) => {
    const found = INSTITUTIONAL_CATEGORIES.find((c) => c.id === cat);
    return found ? found.name : cat.replace('_', ' ');
  };

  // Open Details Modal with Privacy Guard
  const handleOpenDetails = async (complaint: Complaint) => {
    try {
      // Validate authorization through service
      const secureDetails = await studentComplaintService.getComplaintById(complaint.id, userId);
      setSelectedComplaint(secureDetails);
      setDetailsModalOpen(true);
      setCopiedRef(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to view complaint details.';
      addToast({
        title: 'Access Restricted',
        message: msg,
        variant: 'error',
      });
    }
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    addToast({
      title: 'Reference Copied',
      message: `${ref} copied to clipboard.`,
      variant: 'info',
    });
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E0D5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]/40 mb-1 select-none">
            <Layers className="w-3 h-3 text-[#496B58]" />
            <span>Student Grievance Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F2B] tracking-tight">
            My Lodged Complaints
          </h1>
          <p className="text-xs text-[#68716A] mt-1 max-w-2xl">
            Monitor real-time investigation stages, review authenticated milestone updates, and track resolution timelines for your submitted concerns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={fetchComplaints}
            disabled={loading}
            startIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            title="Refresh Complaints"
          >
            Refresh
          </Button>

          <Link to="/submit">
            <Button variant="primary" size="md" startIcon={<Plus className="w-4 h-4" />}>
              Submit New Complaint
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Search & Multi-Criteria Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Input
                placeholder="Search by title, reference (CMP-...), description, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Category Filter */}
              <div className="w-full sm:w-56">
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  options={[
                    { value: 'all', label: 'All 11 Categories' },
                    ...INSTITUTIONAL_CATEGORIES.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    })),
                  ]}
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-52">
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  options={[
                    { value: 'all', label: 'All 8 Statuses' },
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Records Metrics Count */}
      <div className="flex items-center justify-between text-xs text-[#68716A] px-1">
        <span>
          Showing <strong>{filteredComplaints.length}</strong> of{' '}
          <strong>{complaints.length}</strong> recorded grievances
        </span>
        {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className="text-[11px] font-semibold text-[#496B58] hover:underline"
          >
            Reset Filters
          </button>
        ) : null}
      </div>

      {/* 3. Complaints Records Presentation */}
      <div className="space-y-4">
        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-2">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredComplaints.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title={complaints.length === 0 ? 'No Grievances Submitted Yet' : 'No Matching Grievances Found'}
                description={
                  complaints.length === 0
                    ? 'You have not registered any grievances yet. When you submit an issue, its full tracking timeline and resolution audit will be recorded here.'
                    : 'No complaints match your active filter parameters. Adjust your search or reset the filters above.'
                }
                action={
                  <Link to="/submit">
                    <Button variant="primary" size="md" startIcon={<Plus className="w-4 h-4" />}>
                      Submit a Complaint
                    </Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Populated List */}
        {!loading && filteredComplaints.length > 0 && (
          <>
            {/* DESKTOP VIEW: Responsive Table (Hidden on Mobile) */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-subtle">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E0D5] bg-[#FAF8F3] text-[11px] font-semibold text-[#292F2B] uppercase tracking-wider select-none">
                    <th className="px-4 py-3 w-36">Reference</th>
                    <th className="px-4 py-3">Complaint Particulars</th>
                    <th className="px-4 py-3 w-40">Category</th>
                    <th className="px-4 py-3 w-28">Submitted</th>
                    <th className="px-4 py-3 w-32">Status</th>
                    <th className="px-4 py-3 w-28">Last Update</th>
                    <th className="px-4 py-3 w-28 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5]/70 text-xs text-[#292F2B]">
                  {filteredComplaints.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#FAF8F3]/60 transition-colors duration-100"
                    >
                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono font-semibold text-[11px] text-[#292F2B]">
                        <span className="bg-[#E6EDE5]/70 px-2 py-0.5 rounded border border-[#A7B8A5]/40 inline-flex items-center gap-1">
                          {item.id}
                          {item.isConfidential && (
                            <span title="Confidential Submission">
                              <Lock className="w-3 h-3 text-[#496B58]" />
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Particulars */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-xs text-[#292F2B] block line-clamp-1">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-[#68716A] mt-0.5">
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#496B58]" />
                              {item.location}
                            </span>
                          )}
                          {item.attachments && item.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-[#496B58] font-medium">
                              <FileText className="w-3 h-3" />
                              {item.attachments.length} file(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-[#FAF8F3] text-[#292F2B] border border-[#E5E0D5]">
                          {getCategoryIcon(item.category)}
                          <span className="truncate max-w-[130px]">{getCategoryLabel(item.category)}</span>
                        </span>
                      </td>

                      {/* Submission Date */}
                      <td className="px-4 py-3.5 text-[#68716A] whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3.5 text-[#68716A] whitespace-nowrap">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetails(item)}
                          startIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW: Stacked Touch-Friendly Cards (Hidden on Desktop) */}
            <div className="md:hidden space-y-3">
              {filteredComplaints.map((item) => (
                <Card key={item.id} className="shadow-subtle hover:border-[#A7B8A5] transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-[11px] bg-[#E6EDE5]/70 px-2 py-0.5 rounded border border-[#A7B8A5]/40 text-[#292F2B] flex items-center gap-1">
                        {item.id}
                        {item.isConfidential && <Lock className="w-3 h-3 text-[#496B58]" />}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#292F2B] leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#68716A] line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#68716A] pt-2 border-t border-[#E5E0D5]/70">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(item.category)}
                        <span className="truncate max-w-[140px]">{getCategoryLabel(item.category)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#8C948E]" />
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => handleOpenDetails(item)}
                      startIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View Complaint Details & Timeline
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 4. COMPLAINT DETAILS & TRACKING TIMELINE MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        size="lg"
        title="Grievance Particulars & Milestone Audit"
        description="Chronological record of departmental investigation, updates, and remediation milestones."
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-[#68716A]">
              Last updated: {selectedComplaint ? new Date(selectedComplaint.updatedAt).toLocaleString() : ''}
            </span>
            <Button variant="primary" size="sm" onClick={() => setDetailsModalOpen(false)}>
              Close Particulars
            </Button>
          </div>
        }
      >
        {selectedComplaint && (
          <div className="space-y-6 text-left text-xs">
            {/* Header Badge Strip with Reference Token */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#292F2B] bg-[#E6EDE5] px-2.5 py-0.5 rounded border border-[#A7B8A5]">
                  {selectedComplaint.id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyReference(selectedComplaint.id)}
                  className="p-1 rounded text-[#68716A] hover:text-[#292F2B] transition-colors"
                  title="Copy reference token"
                  aria-label="Copy reference token"
                >
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-[#365442]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {selectedComplaint.isConfidential && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4]">
                    <Lock className="w-3 h-3" />
                    Protected Identity
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge priority={selectedComplaint.priority} />
                <StatusBadge status={selectedComplaint.status} size="md" />
              </div>
            </div>

            {/* Title & Full Description */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#292F2B]">
                {selectedComplaint.title}
              </h3>
              <p className="text-xs text-[#292F2B] leading-relaxed bg-[#FFFDF8] p-3.5 rounded-xl border border-[#E5E0D5] whitespace-pre-wrap">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Department, Location & Filing Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-[#E5E0D5] bg-[#FAF8F3]">
                <span className="text-[10px] uppercase font-bold text-[#8C948E] block">
                  Category
                </span>
                <span className="font-semibold text-xs text-[#292F2B] flex items-center gap-1 mt-0.5">
                  {getCategoryIcon(selectedComplaint.category)}
                  {getCategoryLabel(selectedComplaint.category)}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E5E0D5] bg-[#FAF8F3]">
                <span className="text-[10px] uppercase font-bold text-[#8C948E] block">
                  Target Department
                </span>
                <span className="font-semibold text-xs text-[#292F2B] block truncate mt-0.5">
                  {selectedComplaint.department || 'Academic Division'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E5E0D5] bg-[#FAF8F3]">
                <span className="text-[10px] uppercase font-bold text-[#8C948E] block">
                  Campus Location
                </span>
                <span className="font-semibold text-xs text-[#292F2B] block truncate mt-0.5">
                  {selectedComplaint.location || 'Central Campus'}
                </span>
              </div>
            </div>

            {/* Supporting Attachments Section */}
            {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#8C948E] tracking-wider block">
                  Supporting Attachments ({selectedComplaint.attachments.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedComplaint.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8] hover:bg-[#FAF8F3] hover:border-[#A7B8A5] transition-colors flex items-center justify-between text-xs group"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-[#365442] shrink-0" />
                        <span className="font-medium text-[#292F2B] truncate">{att.name}</span>
                      </div>
                      <span className="text-[10px] text-[#496B58] font-semibold group-hover:underline shrink-0 ml-2">
                        View
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Card if Resolved or Closed */}
            {(selectedComplaint.status === 'resolved' || selectedComplaint.status === 'closed') && (
              <div className="p-4 rounded-xl bg-[#E6EDE5]/50 border border-[#A7B8A5] space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#365442]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Administrative Resolution Summary</span>
                </div>
                <p className="text-xs text-[#292F2B] leading-relaxed">
                  {selectedComplaint.resolutionSummary ||
                    'Remediation actions have been carried out and verified by university inspection staff.'}
                </p>
                {selectedComplaint.resolvedAt && (
                  <span className="text-[10px] text-[#68716A] block pt-1">
                    Resolved by {selectedComplaint.resolvedBy || 'Authorizing Officer'} on{' '}
                    {new Date(selectedComplaint.resolvedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* 5. TRACKING TIMELINE (Vertical Visual Stepper) */}
            <div className="space-y-3 pt-2 border-t border-[#E5E0D5]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#292F2B] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#365442]" />
                  <span>Investigation Milestones & Status Timeline</span>
                </span>
                <span className="text-[10px] text-[#8C948E]">
                  Chronological Audit Log
                </span>
              </div>

              {/* Stepper items */}
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E0D5]">
                {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 ? (
                  selectedComplaint.timeline.map((event: TimelineEvent, idx: number) => {
                    const isLast = idx === selectedComplaint.timeline!.length - 1;
                    return (
                      <div key={event.id || idx} className="relative">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                            isLast
                              ? 'bg-[#365442] text-white border-[#FFFDF8] ring-2 ring-[#A7B8A5]'
                              : 'bg-[#FAF8F3] text-[#365442] border-[#A7B8A5]'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </div>

                        {/* Event Details */}
                        <div className="bg-[#FAF8F3] p-3 rounded-lg border border-[#E5E0D5] space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="font-bold text-xs text-[#292F2B]">{event.title}</span>
                            <span className="text-[10px] text-[#8C948E] font-medium">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-[#68716A] leading-relaxed">
                            {event.description}
                          </p>

                          <div className="text-[10px] text-[#365442] font-semibold pt-0.5 flex items-center gap-1">
                            <span>Actor:</span>
                            <span>{event.actor}</span>
                            <span className="text-[#8C948E]">({event.actorRole})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#68716A] italic">
                    Grievance has been recorded. Initial triage review is pending.
                  </p>
                )}
              </div>
            </div>

            {/* Privacy notice banner */}
            <div className="p-3 rounded-lg bg-[#FAF8F3] border border-[#E5E0D5] text-[11px] text-[#68716A] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#496B58] shrink-0" />
              <span>
                Personal records are encrypted and protected under University Student Privacy Directives. Internal administrative discussions remain confidential to investigating committees.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
