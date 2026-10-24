import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  Clock,
  Bell,
  Sparkles,
  Eye,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea,
  Checkbox,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Modal,
  useToast,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import {
  studentComplaintService,
  INSTITUTIONAL_CATEGORIES,
} from '../services/studentComplaint.service';
import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintAttachment,
  FollowUpPreferences,
  Complaint,
} from '../types';

export function SubmitComplaintPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const userId = user?.id || 'guest_student';
  const userFullName = profile?.fullName || user?.email?.split('@')[0] || 'Enrolled Student';
  const userEmail = profile?.email || user?.email || 'student@university.edu';

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('academics');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [description, setDescription] = useState('');

  // Follow-up Preferences
  const [notificationMethod, setNotificationMethod] = useState<'email' | 'sms' | 'portal_only'>('email');
  const [contactPhone, setContactPhone] = useState('');
  const [preferredContactTime, setPreferredContactTime] = useState<'morning' | 'afternoon' | 'anytime'>('anytime');
  const [isConfidential, setIsConfidential] = useState(false);

  // Attachments State
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Validation & Submission States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedComplaint, setConfirmedComplaint] = useState<Complaint | null>(null);

  // Active category info
  const selectedCategoryInfo = INSTITUTIONAL_CATEGORIES.find((c) => c.id === category);

  // File Upload Handler (Simulated private institutional attachment storage)
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setAttachmentError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      setAttachmentError('Maximum of 5 attachments permitted per grievance submission.');
      return;
    }

    const newAttachments: ComplaintAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setAttachmentError(`File "${file.name}" exceeds the 5MB institutional size limit.`);
        return;
      }

      // Validate allowed file types
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        setAttachmentError(`File "${file.name}" has an unsupported format. Allowed: PNG, JPG, PDF, TXT.`);
        return;
      }

      // Convert to client URL for preview
      const previewUrl = URL.createObjectURL(file);
      newAttachments.push({
        name: file.name,
        size: file.size,
        type: file.type,
        url: previewUrl,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Complaint title is required.';
    } else if (title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters.';
    } else if (title.trim().length > 150) {
      errs.title = 'Title cannot exceed 150 characters.';
    }

    if (!description.trim()) {
      errs.description = 'Detailed description is required.';
    } else if (description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    } else if (description.trim().length > 3000) {
      errs.description = 'Description cannot exceed 3000 characters.';
    }

    if (notificationMethod === 'sms') {
      if (!contactPhone.trim()) {
        errs.contactPhone = 'Phone number is required when SMS notifications are selected.';
      } else if (!/^[0-9+\s-]{8,15}$/.test(contactPhone.trim())) {
        errs.contactPhone = 'Please enter a valid phone number (8–15 digits).';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler with Duplicate Submission Prevention
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast({
        title: 'Validation Error',
        message: 'Please resolve the highlighted field errors before submitting.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const followUpPrefs: FollowUpPreferences = {
      notificationMethod,
      contactPhone: notificationMethod === 'sms' ? contactPhone : undefined,
      preferredContactTime,
      isConfidential: isConfidential || category === 'harassment_misconduct',
    };

    try {
      const created = await studentComplaintService.createComplaint(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          department: department.trim() || selectedCategoryInfo?.department,
          location: location.trim(),
          attachments,
          followUpPreferences: followUpPrefs,
        },
        userId,
        isConfidential ? `${userFullName} (Confidential Complainant)` : userFullName,
        userEmail
      );

      setConfirmedComplaint(created);
      addToast({
        title: 'Grievance Formally Registered',
        message: `Assigned Tracking Reference: ${created.id}`,
        variant: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Grievance submission failed. Please try again.';
      setSubmitError(msg);
      addToast({
        title: 'Submission Failed',
        message: msg,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Breadcrumb & Return Action */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D5]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          startIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Dashboard
        </Button>
        <span className="text-[11px] text-[#68716A]">Official Grievance Registration</span>
      </div>

      {/* Page Title & Explanation */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]/40 mb-1 select-none">
          <Sparkles className="w-3 h-3 text-[#496B58]" />
          <span>Student Voice Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F2B] tracking-tight">
          Submit a Formal Complaint or Grievance
        </h1>
        <p className="text-xs text-[#68716A] mt-1 max-w-2xl leading-relaxed">
          Lodged complaints are assigned an immutable tracking reference, routed to authorized university officers, and audited against institutional service standards.
        </p>
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div className="p-4 rounded-xl bg-[#FAF2EE] border border-[#ECCEC4] text-[#B8755D] flex items-start gap-3 shadow-subtle">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="block font-semibold">Submission Incomplete:</strong>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {/* Primary Form Card */}
      <Card variant="elevated">
        <CardHeader className="bg-[#FAF8F3]/50">
          <CardTitle>Grievance Particulars</CardTitle>
          <CardDescription>
            Provide accurate factual details to enable inspection teams to investigate and resolve your issue promptly.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#292F2B]">
                  Complaint Title <span className="text-[#B8755D]">*</span>
                </label>
                <span className="text-[10px] text-[#8C948E] font-mono">
                  {title.length}/150
                </span>
              </div>
              <Input
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                maxLength={150}
                placeholder="e.g., Water filtration unit malfunctioning in Hostel Block B, 2nd Floor"
                error={errors.title}
                helperText="Summarize the core problem concisely (minimum 5 characters)."
              />
            </div>

            {/* 2. Category & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <Select
                  label="Grievance Category *"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  options={INSTITUTIONAL_CATEGORIES.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                />
                {selectedCategoryInfo && (
                  <p className="text-[11px] text-[#68716A] italic mt-1 leading-snug">
                    {selectedCategoryInfo.description}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Select
                  label="Urgency Priority *"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                  options={[
                    { value: 'low', label: 'Low — General suggestion or non-urgent repair' },
                    { value: 'medium', label: 'Medium — Standard service interruption (Default)' },
                    { value: 'high', label: 'High — Impairs daily coursework, living, or study' },
                    { value: 'urgent', label: 'Urgent — Safety hazard, harassment, or emergency' },
                  ]}
                  helperText="Assign genuine priority to ensure rapid emergency triage."
                />
              </div>
            </div>

            {/* 3. Location / Department Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Target Department / Faculty"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={selectedCategoryInfo?.department || 'e.g., Campus Facilities & Maintenance'}
                helperText="University administrative wing handling this area."
              />

              <Input
                label="Specific Campus Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Science Block B, Room 204 or East Wing Canteen"
                helperText="Precise location assists on-site inspection teams."
              />
            </div>

            {/* 4. Detailed Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#292F2B]">
                  Detailed Description & Impact <span className="text-[#B8755D]">*</span>
                </label>
                <span className="text-[10px] text-[#8C948E] font-mono">
                  {description.length}/3000
                </span>
              </div>
              <Textarea
                required
                rows={5}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                maxLength={3000}
                placeholder="Detail what transpired, dates/times observed, any previous attempts to resolve, and the direct impact on students..."
                error={errors.description}
                helperText="Be objective and factual. You may attach photos or documentation below."
              />
            </div>

            {/* 5. Supporting Attachments Uploader */}
            <div className="space-y-2 pt-2 border-t border-[#E5E0D5]/70">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#292F2B] flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[#365442]" />
                  <span>Optional Supporting Attachments</span>
                </label>
                <span className="text-[11px] text-[#8C948E]">
                  {attachments.length}/5 files attached (Max 5MB each)
                </span>
              </div>

              {/* Upload Dropzone */}
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#A7B8A5]/70 rounded-xl bg-[#FAF8F3]/60 hover:bg-[#FAF8F3] transition-colors cursor-pointer text-center group"
              >
                <UploadCloud className="w-8 h-8 text-[#496B58] group-hover:scale-105 transition-transform mb-2" />
                <span className="text-xs font-semibold text-[#292F2B]">
                  Click to select photos or documents to attach
                </span>
                <span className="text-[11px] text-[#68716A] mt-0.5">
                  Supported formats: PNG, JPG, WebP, PDF, TXT (Maximum 5MB per file)
                </span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={attachments.length >= 5}
                />
              </label>

              {attachmentError && (
                <p className="text-xs text-[#B8755D] mt-1">{attachmentError}</p>
              )}

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-[#E5E0D5] bg-[#FFFDF8] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-[#365442] shrink-0" />
                        <span className="truncate font-medium text-[#292F2B]">{file.name}</span>
                        <span className="text-[10px] text-[#8C948E] shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="p-1 text-[#68716A] hover:text-[#B8755D] rounded transition-colors"
                        title="Remove attachment"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Follow-up Preferences & Confidentiality */}
            <div className="space-y-4 pt-4 border-t border-[#E5E0D5]/70">
              <h4 className="text-xs font-bold text-[#292F2B] uppercase tracking-wider text-[#8C948E] flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-[#365442]" />
                Follow-up & Communication Preferences
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Select
                  label="Notification Channel"
                  value={notificationMethod}
                  onChange={(e) =>
                    setNotificationMethod(e.target.value as 'email' | 'sms' | 'portal_only')
                  }
                  options={[
                    { value: 'email', label: 'Email Alerts (Institutional inbox)' },
                    { value: 'sms', label: 'SMS Alerts (Urgent status texts)' },
                    { value: 'portal_only', label: 'Portal Only (No external messaging)' },
                  ]}
                  helperText="How you wish to receive investigation milestone alerts."
                />

                <Select
                  label="Preferred Contact Time"
                  value={preferredContactTime}
                  onChange={(e) =>
                    setPreferredContactTime(e.target.value as 'morning' | 'afternoon' | 'anytime')
                  }
                  options={[
                    { value: 'anytime', label: 'Anytime during office hours (09:00 - 18:00)' },
                    { value: 'morning', label: 'Morning slot (09:00 - 12:00)' },
                    { value: 'afternoon', label: 'Afternoon slot (13:00 - 17:00)' },
                  ]}
                  helperText="When officers may reach out for clarification."
                />
              </div>

              {notificationMethod === 'sms' && (
                <Input
                  label="Student Contact Phone Number *"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g., +91 98765 43210"
                  error={errors.contactPhone}
                  helperText="Required for SMS milestone notifications."
                />
              )}

              {/* Confidentiality Option */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] space-y-2">
                <Checkbox
                  id="confidential-mode"
                  checked={isConfidential || category === 'harassment_misconduct'}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  disabled={category === 'harassment_misconduct'}
                  label="Enable Protected Student Identity (Confidential Submission)"
                  description="Your student roll number and real name will be redacted from general departmental staff. Only the university ombudsperson and designated inquiry chair will access your identity."
                />
                {category === 'harassment_misconduct' && (
                  <p className="text-[11px] text-[#365442] font-medium pl-6">
                    * Harassment and misconduct grievances automatically enforce confidential student identity protection by institutional mandate.
                  </p>
                )}
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-3.5 rounded-lg bg-[#FAF8F3] border border-[#E5E0D5] text-[11px] text-[#68716A] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#496B58] shrink-0 mt-0.5" />
              <span>
                All submitted grievances are audited against the University Student Code of Conduct and Anti-Harassment Regulations. Submission timestamps and tracking tokens are cryptographically logged.
              </span>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D5]/70">
              <Link to="/dashboard">
                <Button variant="ghost" size="md">
                  Cancel
                </Button>
              </Link>

              {/* Duplicate Submission Prevention: Disables on submit */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={isSubmitting || !title.trim() || !description.trim()}
                startIcon={<Send className="w-4 h-4" />}
                className="shadow-sm"
              >
                {isSubmitting ? 'Registering Grievance...' : 'Submit Grievance'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Submission Confirmation Modal */}
      <Modal
        isOpen={confirmedComplaint !== null}
        onClose={() => {
          setConfirmedComplaint(null);
          navigate('/complaints');
        }}
        size="md"
        title="Grievance Registered Successfully"
        description="Your complaint has been assigned an official university tracking reference."
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmedComplaint(null);
                navigate('/dashboard');
              }}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setConfirmedComplaint(null);
                navigate('/complaints');
              }}
              startIcon={<Eye className="w-3.5 h-3.5" />}
            >
              Track in My Complaints
            </Button>
          </div>
        }
      >
        {confirmedComplaint && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#E6EDE5]/60 border border-[#A7B8A5] flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#365442] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#365442] tracking-wider block">
                  Official Tracking Reference
                </span>
                <span className="text-xl font-mono font-extrabold text-[#292F2B] block tracking-tight">
                  {confirmedComplaint.id}
                </span>
                <span className="text-[11px] text-[#68716A] block mt-1">
                  Keep this token to follow investigation milestones and submit resolution feedback.
                </span>
              </div>
            </div>

            <div className="space-y-2 border border-[#E5E0D5] rounded-xl p-3 bg-[#FAF8F3]/60">
              <div className="flex justify-between py-1 border-b border-[#E5E0D5]/50">
                <span className="text-[#68716A]">Subject:</span>
                <span className="font-semibold text-[#292F2B] max-w-[200px] truncate">
                  {confirmedComplaint.title}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5E0D5]/50">
                <span className="text-[#68716A]">Department:</span>
                <span className="font-semibold text-[#292F2B]">
                  {confirmedComplaint.department || 'Academic Division'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5E0D5]/50">
                <span className="text-[#68716A]">Logged At:</span>
                <span className="font-semibold text-[#292F2B]">
                  {new Date(confirmedComplaint.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#68716A]">Confidentiality:</span>
                <span className="font-semibold text-[#365442]">
                  {confirmedComplaint.isConfidential ? 'Protected Identity' : 'Standard Student Identity'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#FFFDF8] border border-[#E5E0D5] text-[11px] text-[#68716A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#496B58] shrink-0" />
              <span>
                Standard administrative triage window: <strong>24 to 48 university working hours</strong>.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
