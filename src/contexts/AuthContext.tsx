import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { EnhancedUser } from '@/types/enhanced';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: EnhancedUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profileData: {
    firstName: string;
    lastName: string;
    role: string;
    schoolId?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  getUserRole: () => string | null;
  hasAdminAccess: () => boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<EnhancedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    try {
      // First get basic user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          first_name,
          last_name,
          student_id,
          phone,
          school_id,
          approval_status,
          approved_by,
          approved_at,
          department,
          employee_id,
          device_id,
          profile_image,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .single();
      
      if (userError) {
        // If user profile doesn't exist and we haven't retried too many times, retry
        if (userError.code === 'PGRST116' && retryCount < 3) {
          console.log(`User profile not found, retrying in 1 second... (attempt ${retryCount + 1})`);
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1);
          }, 1000);
          return;
        }
        throw userError;
      }

      // Get school data if user has a school_id
      let schoolData = null;
      if (userData.school_id) {
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .select('*')
          .eq('id', userData.school_id)
          .single();
        
        if (!schoolError) {
          schoolData = school;
        }
      }

      // Transform to EnhancedUser format
      const enhancedUser: EnhancedUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role as EnhancedUser['role'],
        firstName: userData.first_name,
        lastName: userData.last_name,
        studentId: userData.student_id,
        phone: userData.phone,
        schoolId: userData.school_id,
        school: schoolData,
        approvalStatus: userData.approval_status as EnhancedUser['approvalStatus'],
        approvedBy: userData.approved_by,
        approvedAt: userData.approved_at,
        department: userData.department,
        employeeId: userData.employee_id,
        name: `${userData.first_name} ${userData.last_name}`, // Computed field for mobile compatibility
        deviceId: userData.device_id,
        profileImage: userData.profile_image,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at
      };

      setUserProfile(enhancedUser);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // For sign up event, we might need to wait a bit longer for profile creation
        if (event === 'SIGNED_IN') {
          console.log('User signed in, fetching profile...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, profileData: {
    firstName: string;
    lastName: string;
    role: string;
    schoolId?: string;
  }) => {
    // First, create the auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // If user was created successfully, create their profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          role: profileData.role,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          school_id: profileData.schoolId,
          approval_status: 'pending' // Default to pending approval
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Try to delete the auth user if profile creation fails
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (deleteError) {
          console.error('Error deleting auth user after profile creation failure:', deleteError);
        }
        throw new Error('Failed to create user profile');
      }

      // Wait a moment for the database to propagate the changes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Manually fetch the user profile to ensure it's loaded
      await fetchUserProfile(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUserProfile(null);
  };

  const getUserRole = () => {
    return userProfile?.role || null;
  };

  const hasAdminAccess = () => {
    const role = userProfile?.role;
    return role === 'system_admin' || role === 'admin' || role === 'head_lecturer';
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    getUserRole,
    hasAdminAccess,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 