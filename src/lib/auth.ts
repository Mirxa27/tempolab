// Enhanced authentication service with role-based access control
import { supabase } from './supabase';
import { User, UserRole } from '@/types/database';
import { AuthError, AuthResponse } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: UserRole;
  metadata?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  preferred_language?: string;
  address?: Record<string, any>;
  emergency_contact?: Record<string, any>;
  preferences?: Record<string, any>;
  profile_image_url?: string;
}

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const { email, password, full_name, phone, role = 'guest', metadata = {} } = data;

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            phone,
            role,
            ...metadata,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      // If user is created, create profile in users table
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email,
              full_name,
              phone,
              role,
              is_verified: false,
              is_active: true,
              preferences: metadata,
            },
          ]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Note: Auth user is already created, so we don't throw here
          // The profile will be created on first login if missing
        }

        // Create host profile if role is host
        if (role === 'host' && authData.user) {
          await this.createHostProfile(authData.user.id, { name: full_name });
        }
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  }

  /**
   * Sign in an existing user
   */
  static async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const { email, password } = data;

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Update last login timestamp
      if (authData.user) {
        await this.updateLoginStats(authData.user.id);
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select(`
          *,
          host_profile:hosts(*)
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: UpdateProfileData): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Create host profile
   */
  static async createHostProfile(userId: string, data: { name: string; bio?: string }): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('hosts')
        .insert([
          {
            user_id: userId,
            name: data.name,
            bio: data.bio || '',
            rating: 0,
            total_reviews: 0,
            total_properties: 0,
            total_bookings: 0,
            verified: false,
            commission_rate: 15.0,
            is_superhost: false,
            response_rate: 0,
            response_time_minutes: 0,
          },
        ]);

      if (error) {
        throw error;
      }

      // Update user role to host
      await supabase
        .from('users')
        .update({ role: 'host' })
        .eq('id', userId);

      return { error: null };
    } catch (error) {
      console.error('Create host profile error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Check if user has permission for action
   */
  static hasPermission(user: User | null, action: string, resource?: any): boolean {
    if (!user || !user.is_active) {
      return false;
    }

    const role = user.role;

    switch (action) {
      case 'view_properties':
        return true; // All users can view properties

      case 'create_property':
        return ['host', 'admin', 'super_admin'].includes(role);

      case 'manage_property':
        if (['admin', 'super_admin'].includes(role)) return true;
        if (role === 'host' && resource?.host_id) {
          // Check if user owns the property via host profile
          return user.host_profile?.id === resource.host_id;
        }
        return false;

      case 'create_booking':
        return ['guest', 'host', 'investor', 'admin', 'super_admin'].includes(role);

      case 'manage_booking':
        if (['admin', 'super_admin'].includes(role)) return true;
        if (resource?.guest_id === user.id || resource?.host?.user_id === user.id) return true;
        return false;

      case 'view_investments':
        return ['investor', 'host', 'admin', 'super_admin'].includes(role);

      case 'create_investment':
        return ['investor', 'admin', 'super_admin'].includes(role);

      case 'manage_investment':
        if (['admin', 'super_admin'].includes(role)) return true;
        if (role === 'investor' && resource?.investor_id === user.id) return true;
        return false;

      case 'access_admin':
        return ['admin', 'super_admin'].includes(role);

      case 'manage_users':
        return ['super_admin'].includes(role);

      case 'manage_system_settings':
        return ['super_admin'].includes(role);

      case 'view_analytics':
        return ['host', 'admin', 'super_admin'].includes(role);

      default:
        return false;
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error };
    } catch (error) {
      console.error('Password update error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(token: string, type: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any,
      });

      if (!error) {
        // Update user verification status
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('users')
            .update({ is_verified: true })
            .eq('id', user.id);
        }
      }

      return { error };
    } catch (error) {
      console.error('Email verification error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Get user by ID (admin only)
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          host_profile:hosts(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }

  /**
   * List users with pagination (admin only)
   */
  static async listUsers(page: number = 1, limit: number = 20, role?: UserRole): Promise<{
    users: User[];
    total: number;
    error: Error | null;
  }> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          host_profile:hosts(*)
        `, { count: 'exact' });

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        users: data || [],
        total: count || 0,
        error: null,
      };
    } catch (error) {
      console.error('List users error:', error);
      return {
        users: [],
        total: 0,
        error: error as Error,
      };
    }
  }

  /**
   * Update user login statistics
   */
  private static async updateLoginStats(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          login_count: supabase.raw('login_count + 1'),
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating login stats:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Create super admin (system initialization)
   */
  static async createSuperAdmin(email: string, password: string, fullName: string): Promise<{ error: Error | null }> {
    try {
      // This should only be called during system setup
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'super_admin',
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              full_name: fullName,
              role: 'super_admin',
              is_verified: true,
              is_active: true,
            },
          ]);

        if (profileError) {
          throw profileError;
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Create super admin error:', error);
      return { error: error as Error };
    }
  }
}

// Auth context hook helpers
export const useAuthState = () => {
  // This would typically be implemented with React Context
  // For now, returning a basic structure
  return {
    user: null,
    session: null,
    loading: false,
    error: null,
  };
};

export default AuthService;