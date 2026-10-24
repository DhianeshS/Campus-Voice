import { useState } from 'react';
import {
  Button,
  Input,
  PasswordInput,
  Checkbox,
  Select,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Modal,
  Dialog,
  StatusBadge,
  DataTable,
  Pagination,
  useToast,
  LoadingSpinner,
  Skeleton,
  EmptyState,
  ErrorState,
} from '../components/ui';
import {
  Send,
  Download,
  AlertCircle,
  HelpCircle,
  Shield,
  Palette,
  Layout,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { ComplaintStatus, ComplaintPriority } from '../types';

interface SampleRecord {
  id: string;
  title: string;
  category: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  date: string;
}

const SAMPLE_RECORDS: SampleRecord[] = [
  {
    id: 'CMP-2026-001',
    title: 'Wi-Fi drops in Block C Hostel 3rd Floor',
    category: 'Hostel',
    status: 'in_progress',
    priority: 'high',
    date: '2026-10-23',
  },
  {
    id: 'CMP-2026-002',
    title: 'Main Auditorium cooling system breakdown',
    category: 'Infrastructure',
    status: 'pending',
    priority: 'medium',
    date: '2026-10-22',
  },
  {
    id: 'CMP-2026-003',
    title: 'Digital library subscription certificate renewal',
    category: 'Library',
    status: 'resolved',
    priority: 'urgent',
    date: '2026-10-21',
  },
  {
    id: 'CMP-2026-004',
    title: 'Cafeteria seating capacity expansion suggestion',
    category: 'Cafeteria',
    status: 'rejected',
    priority: 'low',
    date: '2026-10-20',
  },
];

export function DesignSystemPage() {
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [demoInput, setDemoInput] = useState('Central Library Wing 2');
  const [demoPassword, setDemoPassword] = useState('SecretKey123!');
  const [demoSelect, setDemoSelect] = useState('infrastructure');
  const [demoTextarea, setDemoTextarea] = useState('The elevator in academic block 4 makes unusual noise between floors 2 and 3.');

  const colorTokens = [
    { name: 'Primary Sage', hex: '#496B58', usage: 'Active nav, key accents, focus rings', text: 'text-white' },
    { name: 'Deep Sage', hex: '#365442', usage: 'Primary buttons, brand marks, active badges', text: 'text-white' },
    { name: 'Soft Sage', hex: '#A7B8A5', usage: 'Borders, subtle highlights, active states', text: 'text-[#292F2B]' },
    { name: 'Warm Cream', hex: '#F7F4EC', usage: 'Page background & atmospheric warm surfaces', text: 'text-[#292F2B]' },
    { name: 'Off-White', hex: '#FFFDF8', usage: 'Card surfaces, input backgrounds, modals', text: 'text-[#292F2B]' },
    { name: 'Primary Text', hex: '#292F2B', usage: 'Headings, labels, and primary body copy', text: 'text-white' },
    { name: 'Secondary Text', hex: '#68716A', usage: 'Descriptions, helper text, and timestamps', text: 'text-white' },
    { name: 'Borders', hex: '#E5E0D5', usage: 'Restrained borders and panel dividers', text: 'text-[#292F2B]' },
    { name: 'Muted Terracotta', hex: '#B8755D', usage: 'High priority, alerts, and destructive actions', text: 'text-white' },
  ];

  const handleDialogConfirm = () => {
    setDialogLoading(true);
    setTimeout(() => {
      setDialogLoading(false);
      setDialogOpen(false);
      addToast({
        title: 'Action Confirmed',
        message: 'The administrative action has been executed successfully.',
        variant: 'success',
      });
    }, 700);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Header Banner */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6EDE5] text-[#365442] text-xs font-semibold border border-[#A7B8A5]/40 select-none">
          <Palette className="w-3.5 h-3.5 text-[#496B58]" />
          <span>Official Design System • Minimalist SaaS Standard</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292F2B] tracking-tight">
              CampusVoice Design System
            </h1>
            <p className="text-base font-serif italic text-[#365442] mt-1">
              "Your Campus. Your Voice. A Better Tomorrow."
            </p>
            <p className="text-xs text-[#68716A] max-w-2xl mt-2 leading-relaxed">
              Warm cream surfaces, natural sage-green accents, disciplined charcoal typography, and restrained borders engineered for accessibility and modern responsiveness.
            </p>
          </div>

          <div className="flex items-center gap-2 select-none">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                addToast({
                  title: 'Design System Synchronized',
                  message: 'All 18 standardized components verified against official guidelines.',
                  variant: 'info',
                });
              }}
              startIcon={<Sparkles className="w-3.5 h-3.5 text-[#496B58]" />}
            >
              Trigger Info Toast
            </Button>
            <Button
              variant="terracotta"
              size="sm"
              onClick={() => {
                addToast({
                  title: 'Terracotta Accent Triggered',
                  message: 'Muted terracotta is reserved strictly for high-urgency or alert feedback.',
                  variant: 'error',
                });
              }}
            >
              Trigger Terracotta Toast
            </Button>
          </div>
        </div>
      </section>

      {/* 1. Official Colour Palette Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
          <Layers className="w-4 h-4 text-[#496B58]" />
          <h2 className="text-lg font-bold text-[#292F2B]">1. Official Colour Palette</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colorTokens.map((token) => (
            <div
              key={token.hex}
              className="p-4 rounded-xl border border-[#E5E0D5] bg-[#FFFDF8] shadow-subtle flex items-start gap-4"
            >
              <div
                className={`w-14 h-14 rounded-lg shrink-0 border border-[#292F2B]/10 shadow-xs flex items-center justify-center font-mono text-[10px] font-bold ${token.text}`}
                style={{ backgroundColor: token.hex }}
              >
                {token.hex}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#292F2B]">{token.name}</h4>
                <p className="text-xs text-[#68716A] leading-snug">{token.usage}</p>
                <code className="text-[10px] text-[#496B58] font-mono bg-[#E6EDE5]/60 px-1.5 py-0.5 rounded inline-block">
                  {token.hex}
                </code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Button Component Matrix */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
          <Layout className="w-4 h-4 text-[#496B58]" />
          <h2 className="text-lg font-bold text-[#292F2B]">2. Standardized Buttons</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Button Variants & States</CardTitle>
            <CardDescription>
              Deep sage primary buttons, soft sage secondary actions, restrained outlines, and terracotta accents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Variants */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C948E] block mb-3">
                Variants
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Deep Sage Primary</Button>
                <Button variant="secondary">Soft Sage Secondary</Button>
                <Button variant="outline">Restrained Outline</Button>
                <Button variant="ghost">Subtle Ghost</Button>
                <Button variant="terracotta">Muted Terracotta</Button>
                <Button variant="link">Inline Link</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C948E] block mb-3">
                Sizes & Minimum Touch Targets (Min 40px for Default)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small (32px)</Button>
                <Button size="md">Medium Default (40px)</Button>
                <Button size="lg">Large Hero (46px)</Button>
              </div>
            </div>

            {/* Interactive States */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C948E] block mb-3">
                Interactive States (Loading, Disabled, Icons)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button isLoading>Processing</Button>
                <Button disabled>Disabled Primary</Button>
                <Button variant="outline" disabled>Disabled Outline</Button>
                <Button startIcon={<Send className="w-4 h-4" />}>Send Complaint</Button>
                <Button variant="outline" endIcon={<Download className="w-4 h-4" />}>
                  Export Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Form Input Controls */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
          <HelpCircle className="w-4 h-4 text-[#496B58]" />
          <h2 className="text-lg font-bold text-[#292F2B]">3. Form Controls & Inputs</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accessible Form Inputs</CardTitle>
            <CardDescription>
              Off-white input surfaces, sage focus rings, accessible error messages with terracotta borders, and custom dropdown chevrons.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Campus Location"
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              helperText="Specify building, floor, and room number."
              required
            />

            <PasswordInput
              label="Student Portal Password"
              value={demoPassword}
              onChange={(e) => setDemoPassword(e.target.value)}
              helperText="Use at least 8 characters with a number."
            />

            <Select
              label="Complaint Category"
              value={demoSelect}
              onChange={(e) => setDemoSelect(e.target.value)}
              options={[
                { value: 'academic', label: 'Academic Curriculum & Faculty' },
                { value: 'hostel', label: 'Hostel Accommodation & Facilities' },
                { value: 'infrastructure', label: 'Campus Infrastructure & Maintenance' },
                { value: 'cafeteria', label: 'Cafeteria & Dining Services' },
                { value: 'library', label: 'Digital Library & Research Services' },
                { value: 'security', label: 'Campus Safety & Security' },
              ]}
              helperText="Determines administrative routing."
            />

            <Input
              label="Input with Error State"
              defaultValue="invalid-format"
              error="Please enter a valid university roll number (e.g., CS-2026-042)."
            />

            <div className="md:col-span-2">
              <Textarea
                label="Detailed Issue Narrative"
                value={demoTextarea}
                onChange={(e) => setDemoTextarea(e.target.value)}
                maxLength={500}
                showCount
                helperText="Provide factual observations to assist investigation."
                required
              />
            </div>

            <div className="md:col-span-2 space-y-3 pt-2">
              <Checkbox
                id="anonymous-consent"
                label="Submit with Student Identity Protection"
                description="Only designated lead administrators can inspect your credentials for verification purposes."
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
              />
              <Checkbox
                id="email-updates"
                label="Receive Email Notifications on Status Lifecycle Changes"
                description="Automated updates sent when your complaint transitions between investigation and resolution."
                defaultChecked
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Status Badges & Priority Pills */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
          <Shield className="w-4 h-4 text-[#496B58]" />
          <h2 className="text-lg font-bold text-[#292F2B]">4. Status & Priority Badges</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Refined Lifecycle Badges</CardTitle>
            <CardDescription>
              Harmonious colors for complaint lifecycles and urgency categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C948E] block mb-3">
                Complaint Lifecycle Statuses
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status="pending" size="md" />
                <StatusBadge status="in_progress" size="md" />
                <StatusBadge status="resolved" size="md" />
                <StatusBadge status="rejected" size="md" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C948E] block mb-3">
                Urgency Priority Badges
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge priority="low" size="md" />
                <StatusBadge priority="medium" size="md" />
                <StatusBadge priority="high" size="md" />
                <StatusBadge priority="urgent" size="md" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. Data Table & Pagination */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
          <Layout className="w-4 h-4 text-[#496B58]" />
          <h2 className="text-lg font-bold text-[#292F2B]">5. Standardized Data Table & Pagination</h2>
        </div>

        <div className="space-y-3">
          <DataTable<SampleRecord>
            columns={[
              {
                key: 'id',
                header: 'Token ID',
                width: '130px',
                render: (item) => (
                  <span className="font-mono text-[11px] font-semibold text-[#292F2B] bg-[#E6EDE5]/60 px-2 py-0.5 rounded border border-[#A7B8A5]/40">
                    {item.id}
                  </span>
                ),
              },
              {
                key: 'title',
                header: 'Complaint Subject',
                render: (item) => (
                  <div>
                    <span className="font-semibold text-xs text-[#292F2B] block">{item.title}</span>
                    <span className="text-[10px] text-[#68716A]">Department: {item.category}</span>
                  </div>
                ),
              },
              {
                key: 'priority',
                header: 'Urgency',
                width: '120px',
                render: (item) => <StatusBadge priority={item.priority} />,
              },
              {
                key: 'status',
                header: 'Status',
                width: '160px',
                render: (item) => <StatusBadge status={item.status} />,
              },
              {
                key: 'date',
                header: 'Filed Date',
                width: '110px',
                render: (item) => <span className="text-[11px] text-[#68716A]">{item.date}</span>,
              },
            ]}
            data={SAMPLE_RECORDS}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => {
              addToast({
                title: `Selected ${item.id}`,
                message: item.title,
                variant: 'info',
              });
            }}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={4}
            totalRecords={38}
            pageSize={10}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </section>

      {/* 6. Modals & Dialogs */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
          <AlertCircle className="w-4 h-4 text-[#496B58]" />
          <h2 className="text-lg font-bold text-[#292F2B]">6. Accessible Modals & Dialogs</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interactive Dialog Controls</CardTitle>
            <CardDescription>
              Backdrop overlay with subtle blur, focus trapping, Escape key closing, and primary/terracotta confirmations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Open Content Modal
            </Button>
            <Button variant="terracotta" onClick={() => setDialogOpen(true)}>
              Open Confirmation Dialog
            </Button>
          </CardContent>
        </Card>

        {/* Modal Instance */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Campus Complaint Submission Guidelines"
          description="Institutional policy for lodging formal student grievances"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setModalOpen(false);
                  addToast({
                    title: 'Guidelines Acknowledged',
                    message: 'You can now proceed to submit your complaint.',
                    variant: 'success',
                  });
                }}
              >
                I Understand
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs leading-relaxed text-[#292F2B]">
            <p>
              CampusVoice ensures that every student complaint is recorded with an immutable timestamp and assigned to the relevant department head for investigation.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#68716A]">
              <li>Factual documentation accelerates resolution times.</li>
              <li>Emergency hazards should be marked as <strong>Urgent</strong>.</li>
              <li>False submissions or defamatory entries are subject to review.</li>
            </ul>
          </div>
        </Modal>

        {/* Dialog Instance */}
        <Dialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={handleDialogConfirm}
          title="Confirm Complaint Status Transition?"
          description="Are you sure you want to mark this complaint as Resolved? The student will be notified and invited to submit satisfaction feedback."
          confirmLabel="Mark as Resolved"
          variant="primary"
          isLoading={dialogLoading}
        />
      </section>

      {/* 7. Loading, Skeleton, Empty, and Error States */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
          <Sparkles className="w-4 h-4 text-[#496B58]" />
          <h2 className="text-lg font-bold text-[#292F2B]">7. Feedback & Operational States</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Loading & Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Loading & Skeletons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <LoadingSpinner size="md" />
                <span className="text-xs text-[#68716A]">Processing server request...</span>
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>

          {/* Empty State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Empty State</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="No Pending Issues"
                description="All submitted grievances in this department have been investigated."
                action={
                  <Button variant="outline" size="sm">
                    Refresh List
                  </Button>
                }
              />
            </CardContent>
          </Card>

          {/* Error State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Error State</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorState
                title="Service Unavailable"
                message="Unable to communicate with the grievance indexing gateway."
                code="GATEWAY_TIMEOUT"
                onRetry={() => {
                  addToast({
                    title: 'Retry Attempted',
                    message: 'Reconnected to backend services.',
                    variant: 'info',
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
