import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  Clock,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studentComplaintService } from '../services/studentComplaint.service';
import type { StudentNotification } from '../types';
import { Button, Card, CardContent, EmptyState } from '../components/ui';
import { cn } from '../utilities/cn';

export function NotificationsPage() {
  const { user } = useAuth();
  const userId = user?.id || 'guest_student';

  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const list = studentComplaintService.getNotifications(userId);
    setNotifications(list);
  }, [userId]);

  const handleMarkAsRead = (id: string) => {
    studentComplaintService.markNotificationAsRead(userId, id);
    setNotifications(studentComplaintService.getNotifications(userId));
  };

  const handleMarkAllRead = () => {
    studentComplaintService.markAllNotificationsAsRead(userId);
    setNotifications(studentComplaintService.getNotifications(userId));
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationBadge = (type: StudentNotification['type']) => {
    switch (type) {
      case 'resolution':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Resolution Recorded</span>
          </span>
        );
      case 'info_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Action Required</span>
          </span>
        );
      case 'reopened':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Grievance Reopened</span>
          </span>
        );
      case 'investigation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6EDE5] text-[#365442] border border-[#A7B8A5]">
            <ShieldAlert className="w-2.5 h-2.5" />
            <span>Investigation Underway</span>
          </span>
        );
      case 'assignment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <HelpCircle className="w-2.5 h-2.5" />
            <span>Officer Assigned</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF8F3] text-[#68716A] border border-[#E5E0D5]">
            <Bell className="w-2.5 h-2.5" />
            <span>Status Milestone</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E0D5]">
        <div>
          <h1 className="text-2xl font-bold text-[#292F2B] tracking-tight">
            Notifications & Updates
          </h1>
          <p className="text-xs text-[#68716A] mt-0.5">
            Real-time milestones, investigation progress, and campus governance announcements
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Unread / All Filter */}
          <div className="flex items-center p-1 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-[#365442] text-white shadow-xs'
                  : 'text-[#68716A] hover:text-[#292F2B]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filter === 'unread'
                  ? 'bg-[#365442] text-white shadow-xs'
                  : 'text-[#68716A] hover:text-[#292F2B]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              startIcon={<Check className="w-3.5 h-3.5" />}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <EmptyState
              title={filter === 'unread' ? 'All Caught Up!' : 'No Notifications'}
              description={
                filter === 'unread'
                  ? 'You have read all status updates and alerts.'
                  : 'You have no notifications or status updates at this moment.'
              }
              icon={<Bell className="w-8 h-8 text-[#365442]" />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                'transition-all duration-150',
                !notif.read ? 'border-[#A7B8A5] bg-[#E6EDE5]/20 shadow-xs' : 'bg-[#FFFDF8]'
              )}
            >
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                      !notif.read
                        ? 'bg-[#365442] text-white shadow-xs'
                        : 'bg-[#FAF8F3] text-[#68716A] border border-[#E5E0D5]'
                    )}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-[#292F2B]">{notif.title}</h4>
                      {getNotificationBadge(notif.type)}
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#B8755D]" title="Unread Alert" />
                      )}
                    </div>
                    <p className="text-xs text-[#292F2B] leading-relaxed">{notif.message}</p>

                    <div className="flex items-center gap-4 text-[10px] text-[#8C948E] pt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(notif.createdAt).toLocaleString()}</span>
                      </div>

                      {notif.complaintId && (
                        <Link
                          to={`/complaints?id=${notif.complaintId}`}
                          className="font-semibold text-[#365442] hover:underline flex items-center gap-1"
                          onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                        >
                          <span>View Grievance #{notif.complaintId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!notif.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="text-[11px] shrink-0 text-[#365442] hover:bg-[#E6EDE5]"
                  >
                    Mark Read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
