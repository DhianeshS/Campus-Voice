import { useState, useEffect } from 'react';
import {
  MessageSquareCheck,
  Star,
  Search,
  Calendar,
  Lock,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { adminComplaintService } from '../../services/adminComplaint.service';
import type { Feedback, FeedbackAggregateMetrics } from '../../types';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Select,
  Input,
} from '../../components/ui';

export function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [metrics, setMetrics] = useState<FeedbackAggregateMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [categoryFilter, typeFilter, dateFrom, dateTo, ratingFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const minRating = ratingFilter !== 'all' ? parseInt(ratingFilter, 10) : undefined;
      const [res, metricsRes] = await Promise.all([
        adminComplaintService.getFeedback({
          category: categoryFilter,
          feedbackType: typeFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          minRating,
          maxRating: minRating,
          search: searchQuery || undefined,
        }),
        adminComplaintService.getFeedbackMetrics({
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
      ]);

      setFeedbackList(res.feedback);
      setMetrics(metricsRes);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const filteredItems = searchQuery
    ? feedbackList.filter(
        (f) =>
          f.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.complaintId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : feedbackList;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E0D5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4] mb-1 select-none">
            <MessageSquareCheck className="w-3 h-3 text-[#B8755D]" />
            <span>Institutional Quality & Student Satisfaction</span>
          </div>
          <h1 className="text-2xl font-bold text-[#292F2B] tracking-tight">
            Feedback & Ratings Oversight
          </h1>
          <p className="text-xs text-[#68716A] mt-0.5">
            Audit resolution feedback scores, student satisfaction metrics, and recurring operational themes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            startIcon={<Sparkles className="w-3.5 h-3.5 text-[#365442]" />}
          >
            {loading ? 'Refreshing...' : 'Refresh Metrics'}
          </Button>
        </div>
      </div>

      {/* Aggregate Scorecards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[#E5E0D5] bg-[#FFFDF8]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#68716A] uppercase tracking-wider block">
                Overall Average Rating
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#292F2B]">
                  {metrics.averageRating > 0 ? metrics.averageRating : '—'}
                </span>
                <span className="text-xs text-[#68716A]">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= Math.round(metrics.averageRating)
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
                <span className="text-[10px] text-[#68716A] ml-1">
                  ({metrics.totalFeedback} evaluations)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E5E0D5] bg-[#FFFDF8]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#68716A] uppercase tracking-wider block">
                Resolution vs General
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#365442]">
                  {metrics.resolutionFeedbackCount}
                </span>
                <span className="text-xs text-[#68716A]">remediations</span>
              </div>
              <p className="text-[11px] text-[#68716A] pt-1">
                +{metrics.generalFeedbackCount} general campus suggestions
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E0D5] bg-[#FFFDF8]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#68716A] uppercase tracking-wider block">
                Top Rating Share (4-5 Stars)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700">
                  {metrics.totalFeedback > 0
                    ? `${Math.round(
                        ((metrics.ratingBreakdown.star5 + metrics.ratingBreakdown.star4) /
                          metrics.totalFeedback) *
                          100
                      )}%`
                    : '—'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 pt-1 font-medium">
                Satisfactory resolution index
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E0D5] bg-[#FFFDF8]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-[#68716A] uppercase tracking-wider block">
                Critical Reviews (1-2 Stars)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#B8755D]">
                  {metrics.ratingBreakdown.star1 + metrics.ratingBreakdown.star2}
                </span>
                <span className="text-xs text-[#68716A]">cases</span>
              </div>
              <p className="text-[11px] text-[#B8755D] pt-1 font-medium">
                Audited for SLA re-escalation
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recurring Concerns Analysis */}
      {metrics && metrics.recurringConcerns.length > 0 && (
        <Card className="border-[#E5E0D5] bg-[#FAF8F3]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#365442]" />
              <CardTitle className="text-sm">Recurring Concerns & Quality Themes</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Automated topic frequency extracted from student feedback text
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {metrics.recurringConcerns.map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#FFFDF8] border border-[#E5E0D5] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#292F2B]">{c.topic}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.sentiment === 'positive'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.sentiment === 'negative'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.occurrences} mention{c.occurrences === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#68716A] italic line-clamp-2">
                    "{c.sampleFeedback}"
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Bar */}
      <Card className="border-[#E5E0D5]">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search comments, reference numbers, or students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search className="w-4 h-4 text-[#8C948E]" />}
              />
            </div>

            {/* Category Filter */}
            <div className="w-44">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'infrastructure', label: 'Infrastructure' },
                  { value: 'hostel', label: 'Hostel' },
                  { value: 'academics', label: 'Academics' },
                  { value: 'cafeteria', label: 'Cafeteria' },
                  { value: 'transportation', label: 'Transportation' },
                  { value: 'it_services', label: 'IT & Wi-Fi' },
                  { value: 'facilities', label: 'Facilities' },
                ]}
              />
            </div>

            {/* Type Filter */}
            <div className="w-44">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Feedback Types' },
                  { value: 'complaint_resolution', label: 'Complaint Resolutions' },
                  { value: 'general_campus', label: 'General Campus Suggestions' },
                ]}
              />
            </div>

            {/* Rating Filter */}
            <div className="w-36">
              <Select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Ratings' },
                  { value: '5', label: '5 Stars Only' },
                  { value: '4', label: '4 Stars Only' },
                  { value: '3', label: '3 Stars Only' },
                  { value: '2', label: '2 Stars Only' },
                  { value: '1', label: '1 Star Only' },
                ]}
              />
            </div>

            {/* Date Pickers */}
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

            {(categoryFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo || searchQuery || ratingFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setTypeFilter('all');
                  setDateFrom('');
                  setDateTo('');
                  setSearchQuery('');
                  setRatingFilter('all');
                }}
                className="text-xs text-[#B8755D]"
              >
                Reset Filters
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Feedback Records Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#68716A]">
          <span>Showing {filteredItems.length} student evaluation records</span>
          <span className="text-[11px] text-[#365442] font-semibold">
            Privacy Status: Protected Quality Records
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-[#68716A] space-y-2">
              <MessageSquareCheck className="w-8 h-8 mx-auto text-[#8C948E]" />
              <h3 className="text-sm font-bold text-[#292F2B]">No Feedback Matching Filters</h3>
              <p className="text-xs max-w-sm mx-auto">
                No satisfaction evaluations match your current category, rating, or date filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="border-[#E5E0D5] bg-[#FFFDF8]">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D5]/60 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-[#292F2B]">
                      {item.complaintId
                        ? `Grievance #${item.complaintId}`
                        : `General: ${item.category?.toUpperCase()}`}
                    </span>
                    <span className="text-[10px] font-semibold text-[#68716A] px-2 py-0.5 rounded bg-gray-100">
                      {item.userName || 'Student'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#FAF8F3] text-[#365442] border border-[#E5E0D5]">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Private Review</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                      {item.feedbackType === 'general_campus' ? 'General Suggestion' : 'Resolution Review'}
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
                    <span className="text-xs font-bold text-[#292F2B]">
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
                  <span>Recorded on {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-[#365442] font-semibold">Quality Directorate Archive</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
