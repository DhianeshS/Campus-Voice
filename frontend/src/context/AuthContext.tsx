import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import type { UserProfile, UserRole, StudentRegistrationData } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInAdmin: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpStudent: (data: StudentRegistrationData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  resetPassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  // Helper to construct UserProfile from Supabase User and metadata
  const extractProfile = (authUser: User): UserProfile => {
    const meta = authUser.user_metadata || {};
    return {
      id: authUser.id,
      email: authUser.email || '',
      fullName: meta.fullName || meta.full_name || authUser.email?.split('@')[0] || 'Campus User',
      role: (meta.role as UserRole) || 'student',
      studentId: meta.studentId || meta.student_id,
      department: meta.department,
      academicYear: meta.academicYear || meta.academic_year,
      avatarUrl: meta.avatarUrl || meta.avatar_url,
      createdAt: authUser.created_at,
    };
  };

  useEffect(() => {
    let isMounted = true;

    if (!isConfigured || !supabase) {
      // Local Standby Mode: restore locally persisted session if available
      try {
        const localUserRaw = localStorage.getItem('campusvoice_local_user');
        const localProfileRaw = localStorage.getItem('campusvoice_local_profile');
        if (localUserRaw && localProfileRaw) {
          const parsedUser = JSON.parse(localUserRaw) as User;
          const parsedProfile = JSON.parse(localProfileRaw) as UserProfile;
          setUser(parsedUser);
          setProfile(parsedProfile);
          setSession({
            access_token: 'local-standby-session-token',
            token_type: 'bearer',
            user: parsedUser,
            expires_in: 3600 * 24 * 7,
            expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
            refresh_token: 'local-standby-refresh-token',
          } as Session);
        }
      } catch (err) {
        console.warn('Could not restore local auth session:', err);
      }
      setIsLoading(false);
      return;
    }

    // Fetch initial active session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (isMounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          setProfile(extractProfile(currentSession.user));
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    });

    // Listen for auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setProfile(extractProfile(newSession.user));
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const cleanEmail = email.trim();

    if (!isConfigured || !supabase) {
      // Standby / Local Mode: check saved accounts or create an immediate student session
      try {
        const accountsRaw = localStorage.getItem('campusvoice_local_accounts');
        const accounts = accountsRaw ? JSON.parse(accountsRaw) : [];
        const matched = accounts.find((acc: { email: string; password?: string; user: User; profile: UserProfile }) => 
          acc.email.toLowerCase() === cleanEmail.toLowerCase()
        );

        let activeUser: User;
        let activeProfile: UserProfile;

        if (matched) {
          if (matched.password && matched.password !== password) {
            return { error: new Error('Invalid email or password.') };
          }
          activeUser = matched.user;
          activeProfile = matched.profile;
        } else {
          const nowIso = new Date().toISOString();
          const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const displayName = cleanEmail.split('@')[0] || 'Student';

          activeUser = {
            id: userId,
            app_metadata: { provider: 'local_standby' },
            user_metadata: {
              fullName: displayName,
              role: 'student',
            },
            aud: 'authenticated',
            created_at: nowIso,
            email: cleanEmail,
            role: 'authenticated',
          } as User;

          activeProfile = {
            id: userId,
            email: cleanEmail,
            fullName: displayName,
            role: 'student',
            createdAt: nowIso,
          };
        }

        const localSession = {
          access_token: 'local-standby-session-token',
          token_type: 'bearer',
          user: activeUser,
          expires_in: 3600 * 24 * 7,
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
          refresh_token: 'local-standby-refresh-token',
        } as Session;

        localStorage.setItem('campusvoice_local_user', JSON.stringify(activeUser));
        localStorage.setItem('campusvoice_local_profile', JSON.stringify(activeProfile));
        localStorage.setItem('campusvoice_auth_token', localSession.access_token);

        setUser(activeUser);
        setProfile(activeProfile);
        setSession(localSession);

        return { error: null };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err : new Error('Local sign in failed.') };
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        setProfile(extractProfile(data.user));
        if (data.session?.access_token) {
          localStorage.setItem('campusvoice_auth_token', data.session.access_token);
        }
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('An unexpected login error occurred') };
    }
  };

  const signInAdmin = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const cleanEmail = email.trim();

    if (!isConfigured || !supabase) {
      // Standby / Local Mode: provision authenticated administrator session
      const nowIso = new Date().toISOString();
      const adminId = 'admin_demo_001';
      const adminName = cleanEmail.toLowerCase().includes('dhianesh')
        ? 'Dhianesh'
        : cleanEmail.toLowerCase().includes('evelyn')
        ? 'Dr. Evelyn Vance'
        : cleanEmail.split('@')[0] || 'Administrator';

      const adminUser: User = {
        id: adminId,
        app_metadata: { provider: 'local_standby' },
        user_metadata: {
          fullName: adminName,
          role: 'admin',
          department: 'Dean of Student Affairs',
        },
        aud: 'authenticated',
        created_at: nowIso,
        email: cleanEmail,
        role: 'admin',
      } as User;

      const adminProfile: UserProfile = {
        id: adminId,
        email: cleanEmail,
        fullName: adminName,
        role: 'admin',
        department: 'Dean of Student Affairs',
        createdAt: nowIso,
      };

      const adminSession = {
        access_token: 'local-admin-session-token',
        token_type: 'bearer',
        user: adminUser,
        expires_in: 3600 * 24 * 7,
        expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
        refresh_token: 'local-admin-refresh-token',
      } as Session;

      localStorage.setItem('campusvoice_local_user', JSON.stringify(adminUser));
      localStorage.setItem('campusvoice_local_profile', JSON.stringify(adminProfile));
      localStorage.setItem('campusvoice_auth_token', adminSession.access_token);

      setUser(adminUser);
      setProfile(adminProfile);
      setSession(adminSession);

      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { error };
      }

      if (!data.user) {
        return { error: new Error('User identity could not be established.') };
      }

      const userProfile = extractProfile(data.user);

      // Enforce server-side role authorization check
      if (userProfile.role !== 'admin' && userProfile.role !== 'staff') {
        // Immediate session termination for unauthorized users attempting admin access
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);

        return {
          error: new Error(
            'Access Denied: This account does not possess authorized administrator credentials.'
          ),
        };
      }

      setUser(data.user);
      setSession(data.session);
      setProfile(userProfile);
      if (data.session?.access_token) {
        localStorage.setItem('campusvoice_auth_token', data.session.access_token);
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Administrative login verification failed') };
    }
  };

  const signUpStudent = async (data: StudentRegistrationData): Promise<{ error: Error | null }> => {
    const cleanEmail = data.email.trim();
    const cleanName = data.fullName.trim();
    const cleanStudentId = data.studentId.trim();

    if (!isConfigured || !supabase) {
      // Standby / Local Mode: register the student immediately in local session
      try {
        const nowIso = new Date().toISOString();
        const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const localUser: User = {
          id: userId,
          app_metadata: { provider: 'local_standby' },
          user_metadata: {
            fullName: cleanName,
            studentId: cleanStudentId,
            department: data.department,
            academicYear: data.academicYear,
            role: 'student',
          },
          aud: 'authenticated',
          created_at: nowIso,
          email: cleanEmail,
          role: 'authenticated',
        } as User;

        const localProfile: UserProfile = {
          id: userId,
          email: cleanEmail,
          fullName: cleanName,
          role: 'student',
          studentId: cleanStudentId,
          department: data.department,
          academicYear: data.academicYear,
          createdAt: nowIso,
        };

        const localSession = {
          access_token: 'local-standby-session-token',
          token_type: 'bearer',
          user: localUser,
          expires_in: 3600 * 24 * 7,
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
          refresh_token: 'local-standby-refresh-token',
        } as Session;

        // Persist to local accounts list for subsequent sign ins
        const accountsRaw = localStorage.getItem('campusvoice_local_accounts');
        const accounts = accountsRaw ? JSON.parse(accountsRaw) : [];
        const existingIdx = accounts.findIndex(
          (acc: { email: string }) => acc.email.toLowerCase() === cleanEmail.toLowerCase()
        );

        const accountRecord = {
          email: cleanEmail,
          password: data.password,
          user: localUser,
          profile: localProfile,
        };

        if (existingIdx >= 0) {
          accounts[existingIdx] = accountRecord;
        } else {
          accounts.push(accountRecord);
        }
        localStorage.setItem('campusvoice_local_accounts', JSON.stringify(accounts));

        // Save active session
        localStorage.setItem('campusvoice_local_user', JSON.stringify(localUser));
        localStorage.setItem('campusvoice_local_profile', JSON.stringify(localProfile));
        localStorage.setItem('campusvoice_auth_token', localSession.access_token);

        setUser(localUser);
        setProfile(localProfile);
        setSession(localSession);

        return { error: null };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err : new Error('Local account registration failed.') };
      }
    }

    try {
      // Role is hardcoded to 'student' to strictly prevent privilege escalation
      const { data: authData, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            fullName: cleanName,
            studentId: cleanStudentId,
            department: data.department,
            academicYear: data.academicYear,
            role: 'student',
          },
        },
      });

      if (error) {
        return { error };
      }

      if (authData.user) {
        setUser(authData.user);
        setSession(authData.session);
        setProfile(extractProfile(authData.user));
        if (authData.session?.access_token) {
          localStorage.setItem('campusvoice_auth_token', authData.session.access_token);
        }
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Registration encountered an unexpected issue.') };
    }
  };

  const signOut = async (): Promise<void> => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('campusvoice_local_user');
    localStorage.removeItem('campusvoice_local_profile');
    localStorage.removeItem('campusvoice_auth_token');
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const requestPasswordReset = async (email: string): Promise<{ error: Error | null }> => {
    if (!isConfigured || !supabase) {
      // Simulated in standby mode
      return { error: null };
    }

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      return { error: error ?? null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Password reset request failed.') };
    }
  };

  const resetPassword = async (newPassword: string): Promise<{ error: Error | null }> => {
    if (!isConfigured || !supabase) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error: error ?? null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Password update failed.') };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured,
        signIn,
        signInAdmin,
        signUpStudent,
        signOut,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
