import { useState, useEffect, type FormEvent } from 'react';
import {
  MessageSquareCheck,
  Star,
  Send,
  ShieldCheck,
  History,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentComplaintService, type ComplaintWithAudit } from '../services/studentComplaint.service';
import type { Feedback } from '../types';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Textarea,
  Select,
  useToast,
} from '../components/ui';

export function FeedbackPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.id || 'guest_student';

  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [feedbackScope, setFeedbackScope] = useState<'general' | 'complaint'>('general');
  const [resolvedComplaints, setResolvedComplaints] = useState<ComplaintWithAudit[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>('');
  const [generalCategory, setGeneralCategory] = useState<string>('facilities');
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<Feedback[]>([]);

  useEffect(() => {
    async function load() {
      // 1. Load resolved complaints for resolution feedback selection
      const records = await studentComplaintService.getComplaints(userId);
      const resolved = records.filter((r) => r.status === 'resolved' || r.status === 'closed');
      setResolvedComplaints(resolved);
      if (resolved.length > 0) {
        setSelectedComplaintId(resolved[0].id);
        setFeedbackScope('complaint');
      } else {
        setFeedbackScope('general');
      }

      // 2. Load student's own submitted feedback history
      const history = studentComplaintService.getFeedbackHistory(userId);
      setFeedbackHistory(history);
    }
    load();
  }, [userId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (rating < 1 || rating > 5) {
      addToast({
        title: 'Validation Error',
        message: 'Please select a rating score between 1 and 5 stars.',
        variant: 'error',
      });
      return;
    }

    if (feedbackScope === 'complaint' && !selectedComplaintId) {
      addToast({
        title: 'Selection Required',
        message: 'Please choose which resolved grievance this evaluation applies to.',
        variant: 'error',
      });
      return;
    }

    setSubmitting(true);

    try {
      const saved = await studentComplaintService.submitFeedback(userId, {
        complaintId: feedbackScope === 'complaint' ? selectedComplaintId : undefined,
        feedbackType: feedbackScope === 'complaint' ? 'complaint_resolution' : 'general_campus',
        category: feedbackScope === 'complaint' ? undefined : generalCategory,
        rating,
        comment: feedbackText.trim() || undefined,
        isPrivate,
      });

      setFeedbackHistory((prev) => [saved, ...prev.filter((f) => f.id !== saved.id)]);
      setFeedbackText('');

      addToast({
        title: 'Feedback Recorded',
        message: 'Thank you! Your evaluation has been saved and submitted to institutional quality assurance.',
        variant: 'success',
      });

      // Switch to history tab to view submission
      setActiveTab('history');
    } catch (err: any) {
      addToast({
        title: 'Submission Failed',
        message: err.message || 'Unable to record feedback. Please try again.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E0D5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]/40 mb-1 select-none">
            <MessageSquareCheck className="w-3 h-3 text-[#496B58]" />
            <span>Student Voice & Quality Review</span>
          </div>
          <h1 className="text-2xl font-bold text-[#292F2B] tracking-tight">
            Campus Feedback & Grievance Satisfaction
          </h1>
          <p className="text-xs text-[#68716A] mt-1 max-w-2xl">
            Evaluate how effectively your grievances were resolved or submit broader suggestions for university operations.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'submit'
                ? 'bg-[#365442] text-white shadow-xs'
                : 'text-[#68716A] hover:text-[#292F2B]'
            }`}
          >
            Submit Feedback
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#365442] text-white shadow-xs'
                : 'text-[#68716A] hover:text-[#292F2B]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Feedback ({feedbackHistory.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'submit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Submission Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-[#FAF8F3]/50 pb-4">
                <CardTitle>Submit Quality Assessment</CardTitle>
                <CardDescription>
                  Provide direct appraisal on remediated complaints or general student services.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Scope Selector: General vs Complaint Resolution */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#292F2B]">
                      Evaluation Scope
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFeedbackScope('general')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          feedbackScope === 'general'
                            ? 'border-[#365442] bg-[#E6EDE5]/30 text-[#292F2B] ring-1 ring-[#365442]'
                            : 'border-[#E5E0D5] bg-[#FAF8F3] text-[#68716A] hover:border-[#A7B8A5]'
                        }`}
                      >
                        <span className="block text-xs font-bold">General Campus Feedback</span>
                        <span className="block text-[11px] text-[#68716A] mt-0.5">
                          Suggestions for campus, hostels, mess, or academics
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackScope('complaint')}
                        disabled={resolvedComplaints.length === 0}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          feedbackScope === 'complaint'
                            ? 'border-[#365442] bg-[#E6EDE5]/30 text-[#292F2B] ring-1 ring-[#365442]'
                            : resolvedComplaints.length === 0
                            ? 'border-[#E5E0D5] bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                            : 'border-[#E5E0D5] bg-[#FAF8F3] text-[#68716A] hover:border-[#A7B8A5]'
                        }`}
                      >
                        <span className="block text-xs font-bold">Complaint Resolution</span>
                        <span className="block text-[11px] text-[#68716A] mt-0.5">
                          {resolvedComplaints.length > 0
                            ? `Review a resolved grievance (${resolvedComplaints.length} available)`
                            : 'No resolved grievances available to review'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Target Selector */}
                  {feedbackScope === 'complaint' ? (
                    <Select
                      label="Associated Resolved Grievance"
                      value={selectedComplaintId}
                      onChange={(e) => setSelectedComplaintId(e.target.value)}
                      options={resolvedComplaints.map((c) => ({
                        value: c.id,
                        label: `${c.id} - ${c.title.substring(0, 48)}...`,
                      }))}
                      helperText="Only resolved or closed grievances appear for quality evaluation."
                    />
                  ) : (
                    <Select
                      label="Campus Sector / Category"
                      value={generalCategory}
                      onChange={(e) => setGeneralCategory(e.target.value)}
                      options={[
                        { value: 'facilities', label: 'Campus Facilities & Maintenance' },
                        { value: 'academic', label: 'Academic Curriculum & Faculty Support' },
                        { value: 'cafeteria', label: 'Cafeteria & Food Quality' },
                        { value: 'hostel', label: 'Hostel Administration & Cleanliness' },
                        { value: 'transportation', label: 'Campus Transit & Bus Logistics' },
                        { value: 'library', label: 'Library & Digital Journal Access' },
                        { value: 'it_services', label: 'IT Infrastructure & Wi-Fi' },
                        { value: 'administration', label: 'Registrar & Student Services' },
                      ]}
                      helperText="Direct your suggestion to the relevant university operational unit."
                    />
                  )}

                  {/* Star Rating */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5]">
                    <label className="block text-xs font-semibold text-[#292F2B]">
                      Satisfaction Score (Required)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 rounded-lg text-amber-500 hover:scale-110 transition-transform focus:outline-none"
                          aria-label={`Rate ${star} out of 5 stars`}
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= rating ? 'fill-amber-400 text-amber-500' : 'text-[#D0DDD0]'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-semibold text-[#365442] ml-2">
                        {rating === 5 && '5/5 — Highly Satisfied & Prompt'}
                        {rating === 4 && '4/5 — Satisfactory Resolution'}
                        {rating === 3 && '3/5 — Neutral / Acceptable'}
                        {rating === 2 && '2/5 — Needs Process Improvement'}
                        {rating === 1 && '1/5 — Unsatisfactory Outcome'}
                      </span>
                    </div>
                  </div>

                  {/* Optional Comments */}
                  <Textarea
                    label="Assessment Comments & Constructive Suggestions (Optional)"
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Provide details on what went well or what could be improved in the investigation process..."
                    helperText="Constructive feedback helps administrative heads refine SLAs and responsiveness."
                  />

                  {/* Privacy Checkbox (Defaulted to True as required) */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5]">
                    <input
                      type="checkbox"
                      id="feedback_private"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#365442] focus:ring-[#365442] border-[#E5E0D5]"
                    />
                    <label htmlFor="feedback_private" className="text-xs text-[#292F2B] cursor-pointer">
                      <span className="font-semibold block flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#365442]" />
                        Private Quality Review (Default)
                      </span>
                      <span className="text-[11px] text-[#68716A] block mt-0.5">
                        Your submission remains strictly confidential between you and the University Quality Evaluation Board. It will not be published publicly.
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={submitting}
                    startIcon={<Send className="w-4 h-4" />}
                  >
                    {submitting ? 'Submitting Evaluation...' : 'Submit Feedback'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Institutional Standards */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] text-xs text-[#68716A] space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-[#292F2B]">
                <ShieldCheck className="w-4 h-4 text-[#365442]" />
                <span>Quality & Governance Assurance</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Every rating contributes directly to the department's grievance redressal SLA score.
                University ombudspersons inspect low scores (&lt; 3 stars) to audit process compliance.
              </p>
              <div className="pt-2 border-t border-[#E5E0D5] text-[10px] space-y-1">
                <div className="flex items-center justify-between">
                  <span>Rating Scale:</span>
                  <span className="font-semibold text-[#292F2B]">1 to 5 Stars</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Privacy Default:</span>
                  <span className="font-semibold text-[#365442]">Confidential / Private</span>
                </div>
              </div>
            </div>

            {feedbackHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-[#68716A]">
                    Recent Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {feedbackHistory.slice(0, 3).map((f) => (
                    <div
                      key={f.id}
                      className="p-2.5 rounded-lg border border-[#E5E0D5] bg-[#FAF8F3] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#292F2B] truncate text-[11px]">
                          {f.complaintId ? `Grievance #${f.complaintId}` : `General: ${f.category}`}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: f.rating }).map((_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      {f.comment && (
                        <p className="text-[10px] text-[#68716A] line-clamp-1 italic">
                          "{f.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-[11px] font-semibold text-[#365442] hover:underline pt-1 block"
                  >
                    View all {feedbackHistory.length} submitted feedback &rarr;
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* History Tab: Student's Own Submitted Feedback */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#292F2B]">
              My Submitted Feedback History
            </h2>
            <span className="text-xs text-[#68716A]">
              Showing {feedbackHistory.length} personal record{feedbackHistory.length === 1 ? '' : 's'}
            </span>
          </div>

          {feedbackHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center mx-auto text-[#68716A]">
                  <MessageSquareCheck className="w-6 h-6 text-[#365442]" />
                </div>
                <h3 className="text-sm font-bold text-[#292F2B]">No Feedback Submitted Yet</h3>
                <p className="text-xs text-[#68716A] max-w-sm mx-auto">
                  You haven't submitted any evaluations or campus suggestions yet. Have your voice heard by submitting feedback today.
                </p>
                <Button variant="primary" size="sm" onClick={() => setActiveTab('submit')}>
                  Submit Your First Feedback
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {feedbackHistory.map((item) => (
                <Card key={item.id} className="border-[#E5E0D5] bg-[#FFFDF8]">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D5]/60 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#292F2B]">
                          {item.complaintId
                            ? `Grievance #${item.complaintId} Resolution`
                            : `Campus Suggestion: ${item.category?.toUpperCase()}`}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF8F3] text-[#365442] border border-[#E5E0D5]">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Private</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-[#68716A]">
                          {item.feedbackType === 'general_campus' ? 'General' : 'Resolution'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= item.rating ? 'fill-amber-400 text-amber-500' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-[#292F2B]">
                          {item.rating}/5
                        </span>
                      </div>
                    </div>

                    {item.comment ? (
                      <p className="text-xs text-[#292F2B] leading-relaxed bg-[#FAF8F3] p-3 rounded-lg border border-[#E5E0D5]/50">
                        "{item.comment}"
                      </p>
                    ) : (
                      <p className="text-xs text-[#68716A] italic">No written comment provided.</p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-[#8C948E] pt-1">
                      <span>Submitted on {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[#365442] font-semibold">Institutional Quality Registry</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
