import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';
import { LoadingState } from '../ui/LoadingState';
import { ErrorState } from '../ui/ErrorState';
import type { UserRole } from '../../types';

export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingState message="Verifying authentication session..." />
      </div>
    );
  }

  // When live Supabase Auth is configured, enforce strict session requirement
  if (isSupabaseConfigured() && !user) {
    const isTargetingAdmin = location.pathname.startsWith('/admin');
    return <Navigate to={isTargetingAdmin ? '/admin/login' : '/login'} state={{ from: location }} replace />;
  }

  // When user is authenticated, enforce strict RBAC role requirements
  if (user && allowedRoles && allowedRoles.length > 0) {
    const userRole = profile?.role || 'student';
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="max-w-md mx-auto py-16 px-4">
          <ErrorState
            title="Access Restricted"
            message={`This portal requires ${allowedRoles.join(' or ')} authorization. Your current role is (${userRole}).`}
            code="UNAUTHORIZED_ROLE"
          />
        </div>
      );
    }
  }

  return <>{children}</>;
}
