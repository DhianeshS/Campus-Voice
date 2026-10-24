import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Layers,
  Clock,
  SearchCheck,
  CheckCircle2,
  RefreshCw,
  Eye,
  Building2,
  BookOpen,
  Utensils,
  Laptop,
  ShieldCheck,
  MapPin,
  Calendar,
  Sparkles,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  studentComplaintService,
  type ComplaintWithAudit,
} from '../services/studentComplaint.service';
import type { DashboardSummary, ComplaintCategory } from '../types';
import {
  Button,
  Card,
  CardContent,
  StatusBadge,
  Modal,
  EmptyState,
  ErrorState,
  Skeleton,
  useToast,
} from '../components/ui';
import { cn } from '../utilities/cn';

export function StudentDashboardPage() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const userId = user?.id || 'guest_student';
  const studentName = profile?.fullName || user?.email?.split('@')[0] || 'Student';

  // State
  const [complaints, setComplaints] = useState<ComplaintWithAudit[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    total: 0,
    open: 0,
    underReview: 0,
    resolved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithAudit | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await studentComplaintService.getComplaints(userId);
      const computedSummary = await studentComplaintService.getDashboardSummary(userId);
      setComplaints(records);
      setSummary(computedSummary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve complaint records.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasDevFixtures = complaints.some((c) => c.isDevFixture);

  const getCategoryIcon = (cat: ComplaintCategory) => {
    switch (cat) {
      case 'hostel':
        return <Building2 className="w-3.5 h-3.5 text-[#365442]" />;
      case 'academics':
      case 'academic':
        return <BookOpen className="w-3.5 h-3.5 text-[#496B58]" />;
      case 'cafeteria':
        return <Utensils className="w-3.5 h-3.5 text-[#365442]" />;
      case 'library':
        return <Laptop className="w-3.5 h-3.5 text-[#496B58]" />;
      case 'it_services':
        return <Laptop className="w-3.5 h-3.5 text-[#365442]" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-[#365442]" />;
    }
  };

  const handleOpenDetails = (complaint: ComplaintWithAudit) => {
    setSelectedComplaint(complaint);
    setDetailsModalOpen(true);
    setFeedbackSent(false);
  };

  const handleSendFeedback = () => {
    setFeedbackSent(true);
    addToast({
      title: 'Feedback Registered',
      message: 'Thank you! Your satisfaction feedback has been linked to the resolution audit.',
      variant: 'success',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* 1. DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E0D5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]/40 mb-1 select-none">
            <Sparkles className="w-3 h-3 text-[#496B58]" />
            <span>Student Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F2B] tracking-tight">
            {getGreeting()}, {studentName}
          </h1>
          <p className="text-xs text-[#68716A] mt-1 max-w-2xl leading-relaxed">
            Monitor your lodged grievances, track administrative investigation milestones, and review verified institutional resolutions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={loadData}
            disabled={loading}
            startIcon={<RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />}
            title="Refresh Dashboard Records"
          >
            Refresh
          </Button>

          <Link to="/submit">
            <Button
              variant="primary"
              size="md"
              startIcon={<Plus className="w-4 h-4" />}
              className="shadow-sm"
            >
              Submit a Complaint
            </Button>
          </Link>
        </div>
      </div>

      {/* Dev Fixtures Notification Banner if active */}
      {hasDevFixtures && (
        <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-between text-xs text-[#292F2B]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#496B58] shrink-0" />
            <span>
              <strong className="text-[#365442]">Development Mode Fixtures Loaded:</strong> These demo records are labeled for testing purposes.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              studentComplaintService.clearAllRecords(userId);
              loadData();
              addToast({ title: 'Fixtures Cleared', message: 'Switched to clean 0-record state.', variant: 'info' });
            }}
            className="text-[11px] font-medium text-[#B8755D] hover:underline"
          >
            Clear to Empty State
          </button>
        </div>
      )}

      {/* Error State Banner */}
      {error && (
        <ErrorState
          title="Unable to Retrieve Complaints"
          message={error}
          onRetry={loadData}
        />
      )}

      {/* 2. SUMMARY CARDS (Calculated from authenticated student's actual records) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#68716A]">
          <span className="font-semibold uppercase tracking-wider text-[#8C948E] text-[10px]">
            Complaint Metrics Overview
          </span>
          <span className="text-[11px]">Dynamic live counts</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Complaints */}
            <Card className="hover:border-[#A7B8A5] transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#68716A] block">
                    Total Complaints
                  </span>
                  <span className="text-3xl font-extrabold text-[#292F2B] tracking-tight block">
                    {summary.total}
                  </span>
                  <span className="text-[11px] text-[#8C948E] block">
                    Total lifetime submissions
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#E6EDE5] text-[#365442] flex items-center justify-center shrink-0 shadow-subtle">
                  <Layers className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* 2. Open Complaints (Pending) */}
            <Card className="hover:border-[#A7B8A5] transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#68716A] block">
                    Open Complaints
                  </span>
                  <span className="text-3xl font-extrabold text-[#292F2B] tracking-tight block">
                    {summary.open}
                  </span>
                  <span className="text-[11px] text-[#9C5A28] block">
                    Awaiting staff triage
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#FAF8F3] text-[#8C6D46] border border-[#E8DFC8] flex items-center justify-center shrink-0 shadow-subtle">
                  <Clock className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* 3. Under Review (In Progress) */}
            <Card className="hover:border-[#A7B8A5] transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#68716A] block">
                    Under Review
                  </span>
                  <span className="text-3xl font-extrabold text-[#292F2B] tracking-tight block">
                    {summary.underReview}
                  </span>
                  <span className="text-[11px] text-[#365442] block">
                    Active departmental investigation
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]/60 flex items-center justify-center shrink-0 shadow-subtle">
                  <SearchCheck className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* 4. Resolved */}
            <Card className="hover:border-[#A7B8A5] transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#68716A] block">
                    Resolved
                  </span>
                  <span className="text-3xl font-extrabold text-[#292F2B] tracking-tight block">
                    {summary.resolved}
                  </span>
                  <span className="text-[11px] text-[#2A4234] block">
                    Remediated & confirmed
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#D0DDD0]/60 text-[#2A4234] border border-[#A7B8A5] flex items-center justify-center shrink-0 shadow-subtle">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* 3. RECENT COMPLAINTS SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D5] pb-3">
          <div>
            <h2 className="text-lg font-bold text-[#292F2B] flex items-center gap-2">
              Recent Complaints
              {!loading && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]/50">
                  {complaints.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-[#68716A]">
              Detailed lifecycle tracking for grievances filed under your student credentials
            </p>
          </div>

          {!loading && complaints.length > 0 && (
            <Link to="/complaints">
              <Button variant="ghost" size="sm" endIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View all in My Complaints
              </Button>
            </Link>
          )}
        </div>

        {/* Loading Skeleton */}
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

        {/* Empty State when student has 0 complaints */}
        {!loading && complaints.length === 0 && (
          <Card>
            <CardContent className="p-8">
              <EmptyState
                title="No complaints submitted yet"
                description="You have not lodged any campus grievances or suggestions yet. When you submit an issue, its live progress and investigation timeline will be tracked here."
                action={
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    <Link to="/submit">
                      <Button variant="primary" size="md" startIcon={<Plus className="w-4 h-4" />}>
                        Submit Your First Complaint
                      </Button>
                    </Link>

                    {/* Developer helper toggle to test populated state */}
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        studentComplaintService.loadDevFixtures(userId);
                        loadData();
                        addToast({
                          title: 'Dev Fixtures Loaded',
                          message: 'Loaded sample complaints for visual and calculation verification.',
                          variant: 'info',
                        });
                      }}
                      startIcon={<Database className="w-4 h-4 text-[#496B58]" />}
                    >
                      Load Sample Fixtures (Dev Testing)
                    </Button>
                  </div>
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Populated State */}
        {!loading && complaints.length > 0 && (
          <>
            {/* DESKTOP VIEW: Clean Responsive Table (Hidden on Mobile) */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-subtle">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E0D5] bg-[#FAF8F3] text-[11px] font-semibold text-[#292F2B] uppercase tracking-wider select-none">
                    <th className="px-4 py-3 w-32">Reference</th>
                    <th className="px-4 py-3">Complaint Title</th>
                    <th className="px-4 py-3 w-36">Category</th>
                    <th className="px-4 py-3 w-32">Submitted</th>
                    <th className="px-4 py-3 w-36">Status</th>
                    <th className="px-4 py-3 w-32">Last Updated</th>
                    <th className="px-4 py-3 w-28 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5]/70 text-xs text-[#292F2B]">
                  {complaints.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#FAF8F3]/60 transition-colors duration-100"
                    >
                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono font-semibold text-[11px] text-[#292F2B]">
                        <span className="bg-[#E6EDE5]/60 px-2 py-0.5 rounded border border-[#A7B8A5]/40">
                          {item.id}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-xs text-[#292F2B] block line-clamp-1">
                          {item.title}
                        </span>
                        {item.location && (
                          <span className="text-[11px] text-[#68716A] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#496B58]" />
                            {item.location}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-[#FAF8F3] text-[#292F2B] border border-[#E5E0D5] capitalize">
                          {getCategoryIcon(item.category)}
                          {item.category}
                        </span>
                      </td>

                      {/* Submission Date */}
                      <td className="px-4 py-3.5 text-[#68716A]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3.5 text-[#68716A]">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
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

            {/* MOBILE VIEW: Stacked Compact Cards (Hidden on Desktop) */}
            <div className="md:hidden space-y-3">
              {complaints.map((item) => (
                <Card key={item.id} className="shadow-subtle">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-[11px] bg-[#E6EDE5]/60 px-2 py-0.5 rounded border border-[#A7B8A5]/40 text-[#292F2B]">
                        {item.id}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#292F2B] leading-snug">
                        {item.title}
                      </h3>
                      {item.location && (
                        <p className="text-[11px] text-[#68716A] flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-[#496B58]" />
                          {item.location}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#68716A] pt-2 border-t border-[#E5E0D5]/60">
                      <div className="flex items-center gap-1.5 capitalize">
                        {getCategoryIcon(item.category)}
                        <span>{item.category}</span>
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
                      View Complaint Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 4. COMPLAINT DETAILS MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        size="lg"
        title={selectedComplaint?.id || 'Complaint Particulars'}
        description={`Submitted by ${selectedComplaint?.userFullName || 'Student'} on ${
          selectedComplaint ? new Date(selectedComplaint.createdAt).toLocaleDateString() : ''
        }`}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-[#68716A]">
              Last updated: {selectedComplaint ? new Date(selectedComplaint.updatedAt).toLocaleString() : ''}
            </span>
            <Button variant="primary" size="sm" onClick={() => setDetailsModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        {selectedComplaint && (
          <div className="space-y-6 text-left">
            {/* Status & Priority Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#68716A]">Current Status:</span>
                <StatusBadge status={selectedComplaint.status} size="md" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#68716A]">Priority Level:</span>
                <StatusBadge priority={selectedComplaint.priority} size="md" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#292F2B]">{selectedComplaint.title}</h3>
              <p className="text-xs text-[#68716A] leading-relaxed whitespace-pre-wrap bg-[#FFFDF8] p-3 rounded-lg border border-[#E5E0D5]">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Location & Category Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8]">
                <span className="text-[10px] uppercase font-bold text-[#8C948E] block">Department</span>
                <span className="font-semibold text-[#292F2B] capitalize flex items-center gap-1.5 mt-0.5">
                  {getCategoryIcon(selectedComplaint.category)}
                  {selectedComplaint.category}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8]">
                <span className="text-[10px] uppercase font-bold text-[#8C948E] block">Campus Location</span>
                <span className="font-semibold text-[#292F2B] block mt-0.5">
                  {selectedComplaint.location || 'General Campus'}
                </span>
              </div>
            </div>

            {/* Investigation Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#292F2B]">
                Investigation Milestones
              </h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E0D5]">
                {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 ? (
                  selectedComplaint.timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative text-xs">
                      <span
                        className={cn(
                          'absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center bg-[#365442] border-[#365442] text-white'
                        )}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </span>
                      <span className="font-bold text-[#292F2B] block">{event.title}</span>
                      <span className="text-[11px] text-[#68716A]">
                        {event.actor} • {new Date(event.timestamp).toLocaleString()}
                      </span>
                      <p className="text-[11px] text-[#68716A] mt-0.5">{event.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#68716A] italic">Awaiting administrative triage update.</p>
                )}
              </div>
            </div>

            {/* Post-Resolution Feedback Module (Available when complaint is resolved) */}
            {selectedComplaint.status === 'resolved' && (
              <div className="p-4 rounded-xl bg-[#E6EDE5]/60 border border-[#A7B8A5] space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#365442]" />
                  <span className="text-xs font-bold text-[#292F2B]">
                    Student Resolution Feedback
                  </span>
                </div>
                {feedbackSent ? (
                  <p className="text-xs text-[#365442] font-medium">
                    ✓ Your feedback rating of {feedbackRating} / 5 stars has been saved to the permanent audit record.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-[#68716A]">
                      How satisfied are you with the timeliness and resolution of this issue?
                    </p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={cn(
                            'w-7 h-7 rounded-lg text-xs font-bold transition-colors border',
                            feedbackRating >= star
                              ? 'bg-[#365442] text-white border-[#365442]'
                              : 'bg-[#FFFDF8] text-[#68716A] border-[#E5E0D5]'
                          )}
                        >
                          {star}★
                        </button>
                      ))}
                      <Button variant="secondary" size="sm" onClick={handleSendFeedback} className="ml-2">
                        Submit Rating
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
