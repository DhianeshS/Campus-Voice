import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Clock,
  Shield,
  ArrowRight,
  Server,
  Database,
  RefreshCw,
  Code2,
  Sparkles,
  TerminalSquare,
  Palette,
} from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { isSupabaseConfigured } from '../services/supabase';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui';

export function HomePage() {
  const { health, loading, error, refetch } = useHealthCheck();
  const supabaseConfigured = isSupabaseConfigured();

  const stages = [
    { num: 1, name: 'Foundation & Scaffolding', active: true, desc: 'Project architecture, TypeScript, routing & env' },
    { num: 2, name: 'Database & Supabase Schema', active: false, desc: 'PostgreSQL tables, RLS policies & relationships' },
    { num: 3, name: 'Authentication & Roles', active: false, desc: 'Supabase Auth, JWT verification & RBAC' },
    { num: 4, name: 'Complaint Lifecycle API', active: false, desc: 'CRUD endpoints, pagination, validation' },
    { num: 5, name: 'Student Portal & Submission', active: false, desc: 'Issue logging, file attachments & tracking' },
    { num: 6, name: 'Admin Console & Workflow', active: false, desc: 'Triage, assignment & status updates' },
    { num: 7, name: 'Feedback & Ratings Module', active: false, desc: 'Post-resolution review & satisfaction metrics' },
    { num: 8, name: 'Notifications & Alerts', active: false, desc: 'Email/in-app updates on complaint progress' },
    { num: 9, name: 'Analytics & Reporting', active: false, desc: 'Resolution times, department trends' },
    { num: 10, name: 'Production Hardening', active: false, desc: 'Vercel + Render CI/CD deployment' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F3] via-[#F7F4EC] to-[#F7F4EC] pt-16 pb-16 border-b border-[#E5E0D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6EDE5] text-[#365442] text-xs font-semibold tracking-wide border border-[#A7B8A5]/50 shadow-subtle select-none">
              <Sparkles className="w-3.5 h-3.5 text-[#496B58]" />
              <span>CampusVoice Official Design System & Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#292F2B] tracking-tight leading-tight">
              A Transparent Voice for Students, <br />
              <span className="text-[#365442] font-serif italic font-normal">
                Accountability for Campus
              </span>
            </h1>

            <p className="text-sm font-serif italic text-[#365442] -mt-2">
              "Your Campus. Your Voice. A Better Tomorrow."
            </p>

            <p className="text-sm sm:text-base text-[#68716A] leading-relaxed max-w-2xl mx-auto">
              CampusVoice connects students and campus administration with structured issue tracking, transparent investigation lifecycles, and student feedback.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link to="/submit">
                <Button variant="primary" size="lg" endIcon={<ArrowRight className="w-4 h-4" />}>
                  Submit a Complaint
                </Button>
              </Link>
              <Link to="/complaints">
                <Button variant="outline" size="lg">
                  Browse Active Issues
                </Button>
              </Link>
              <Link to="/design-system">
                <Button variant="secondary" size="lg" startIcon={<Palette className="w-4 h-4" />}>
                  Design System Showcase
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live System Diagnostics Panel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card variant="elevated">
          <CardHeader className="bg-[#FAF8F3]/60 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <TerminalSquare className="w-5 h-5 text-[#365442]" />
                System Diagnostics & Architecture Verification
              </CardTitle>
              <CardDescription>
                Verifying frontend-backend synchronization, environment variables, and services
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              startIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Test API
            </Button>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Backend API Card */}
            <div className="p-4 rounded-xl border border-[#E5E0D5] bg-[#FFFDF8] flex flex-col justify-between shadow-subtle">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-xs text-[#292F2B]">
                    <Server className="w-4 h-4 text-[#496B58]" />
                    Express Backend API
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      loading
                        ? 'bg-[#FAF8F3] text-[#68716A] border-[#E5E0D5]'
                        : health?.status === 'ok'
                        ? 'bg-[#E6EDE5] text-[#365442] border-[#A7B8A5]/60'
                        : 'bg-[#FAF2EE] text-[#B8755D] border-[#ECCEC4]'
                    }`}
                  >
                    {loading ? 'Checking...' : health?.status === 'ok' ? 'Connected (200 OK)' : 'Awaiting Server'}
                  </span>
                </div>
                <p className="text-xs text-[#68716A]">
                  {health ? (
                    <>
                      Target: <code className="bg-[#E6EDE5]/60 px-1 py-0.5 rounded text-[11px] text-[#292F2B] font-mono">{health.service}</code> (uptime: {health.uptimeSeconds.toFixed(1)}s)
                    </>
                  ) : error ? (
                    <span className="text-[#B8755D] font-mono text-[11px]">{error}</span>
                  ) : (
                    'Run "npm run dev:backend" or start the server on port 5000'
                  )}
                </p>
              </div>
              <div className="pt-3 border-t border-[#E5E0D5] mt-3 text-[11px] text-[#68716A] font-mono">
                Endpoint: /api/health
              </div>
            </div>

            {/* Supabase PostgreSQL Card */}
            <div className="p-4 rounded-xl border border-[#E5E0D5] bg-[#FFFDF8] flex flex-col justify-between shadow-subtle">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-xs text-[#292F2B]">
                    <Database className="w-4 h-4 text-[#365442]" />
                    Supabase PostgreSQL & Auth
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      supabaseConfigured
                        ? 'bg-[#E6EDE5] text-[#365442] border-[#A7B8A5]'
                        : 'bg-[#FAF8F3] text-[#68716A] border-[#E5E0D5]'
                    }`}
                  >
                    {supabaseConfigured ? 'Keys Configured' : 'Stage 2 Blueprint Ready'}
                  </span>
                </div>
                <p className="text-xs text-[#68716A]">
                  {supabaseConfigured
                    ? 'Client credentials identified in environment variables.'
                    : 'PostgreSQL schema blueprint and safe .env.example prepared for Stage 2.'}
                </p>
              </div>
              <div className="pt-3 border-t border-[#E5E0D5] mt-3 text-[11px] text-[#68716A] font-mono">
                Adapter: @supabase/supabase-js
              </div>
            </div>

            {/* Strict TypeScript Card */}
            <div className="p-4 rounded-xl border border-[#E5E0D5] bg-[#FFFDF8] flex flex-col justify-between shadow-subtle">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-xs text-[#292F2B]">
                    <Code2 className="w-4 h-4 text-[#496B58]" />
                    Design System & TypeScript
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]/60">
                    Active & Strict
                  </span>
                </div>
                <p className="text-xs text-[#68716A]">
                  18 accessible UI components built with natural sage palette and strict TypeScript.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E5E0D5] mt-3 text-[11px] text-[#68716A] font-mono">
                Config: Strict Verbatim Modules
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 10-Stage Implementation Plan View */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#292F2B]">10-Stage Implementation Roadmap</h2>
              <p className="text-xs text-[#68716A]">
                Antigravity full-stack architecture progression for CampusVoice
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-[#E6EDE5] text-[#365442] rounded-full border border-[#A7B8A5]/40 select-none">
              Design System Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {stages.map((stage) => (
              <div
                key={stage.num}
                className={`p-3.5 rounded-xl border transition-all ${
                  stage.active
                    ? 'bg-[#E6EDE5]/80 border-[#A7B8A5] shadow-xs ring-1 ring-[#365442]/20'
                    : 'bg-[#FFFDF8] border-[#E5E0D5] opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      stage.active ? 'bg-[#365442] text-white' : 'bg-[#FAF8F3] text-[#68716A] border border-[#E5E0D5]'
                    }`}
                  >
                    Stage {stage.num}
                  </span>
                  {stage.active && (
                    <span className="w-2 h-2 rounded-full bg-[#496B58]" />
                  )}
                </div>
                <h3 className="text-xs font-semibold text-[#292F2B] line-clamp-1">{stage.name}</h3>
                <p className="text-[11px] text-[#68716A] mt-1 line-clamp-2">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-[#E6EDE5] text-[#365442] flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#292F2B] mb-1.5">Structured Issue Reporting</h3>
              <p className="text-xs text-[#68716A] leading-relaxed">
                Log campus concerns across Academics, Hostels, Infrastructure, Dining, and Security with specific room location and urgency ratings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-[#E6EDE5] text-[#365442] flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#292F2B] mb-1.5">Lifecycle Progress Tracking</h3>
              <p className="text-xs text-[#68716A] leading-relaxed">
                Follow grievances from receipt through departmental investigation, remediation, and final verification without ambiguity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-[#E6EDE5] text-[#365442] flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#292F2B] mb-1.5">Role-Based Accountability</h3>
              <p className="text-xs text-[#68716A] leading-relaxed">
                Empower administrative teams with designated operational consoles while safeguarding student privacy through Row-Level Security.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
