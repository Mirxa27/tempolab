import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// =====================================================
// DTOs and Validation Schemas
// =====================================================

export const SignUpDTO = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  role: z.enum(['guest', 'property_owner', 'investor']).default('guest'),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export const SignInDTO = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateProfileDTO = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  preferredLanguage: z.enum(['en', 'ar', 'fr', 'es', 'de', 'zh']).optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }).optional(),
});

export const ChangePasswordDTO = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ResetPasswordDTO = z.object({
  email: z.string().email('Invalid email address'),
});

export const VerifyOTPDTO = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().length(6, 'OTP must be 6 digits'),
});

// Types
export type SignUpData = z.infer<typeof SignUpDTO>;
export type SignInData = z.infer<typeof SignInDTO>;
export type UpdateProfileData = z.infer<typeof UpdateProfileDTO>;
export type ChangePasswordData = z.infer<typeof ChangePasswordDTO>;
export type ResetPasswordData = z.infer<typeof ResetPasswordDTO>;
export type VerifyOTPData = z.infer<typeof VerifyOTPDTO>;

export type UserRole = 'super_admin' | 'admin' | 'property_owner' | 'investor' | 'guest' | 'support';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  dateOfBirth?: string;
  nationality?: string;
  preferredLanguage: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycVerified: boolean;
  kycDocuments?: any;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// =====================================================
// Authentication Service Class
// =====================================================

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initializeAuth() {
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await this.loadUserProfile(session.user.id);
    }

    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await this.loadUserProfile(session.user.id);
        this.startSessionCheck();
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.stopSessionCheck();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        await this.loadUserProfile(session.user.id);
      }
    });
  }

  private startSessionCheck() {
    // Check session validity every 5 minutes
    this.sessionCheckInterval = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        await this.signOut();
      }
    }, 5 * 60 * 1000);
  }

  private stopSessionCheck() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      this.currentUser = {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        phone: data.phone,
        role: data.role,
        status: data.status,
        avatarUrl: data.avatar_url,
        dateOfBirth: data.date_of_birth,
        nationality: data.nationality,
        preferredLanguage: data.preferred_language,
        emailVerified: data.email_verified,
        phoneVerified: data.phone_verified,
        kycVerified: data.kyc_verified,
        kycDocuments: data.kyc_documents,
        notificationPreferences: data.notification_preferences,
        metadata: data.metadata,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastLoginAt: data.last_login_at,
      };

      // Update last login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);

    } catch (error) {
      console.error('Error loading user profile:', error);
      throw error;
    }
  }

  // =====================================================
  // Public Methods
  // =====================================================

  public async signUp(data: SignUpData): Promise<{ user: User; session: any }> {
    try {
      // Validate input
      const validatedData = SignUpDTO.parse(data);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            full_name: validatedData.fullName,
            phone: validatedData.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: validatedData.email,
          full_name: validatedData.fullName,
          phone: validatedData.phone,
          role: validatedData.role,
          status: 'pending_verification',
          nationality: validatedData.nationality,
          date_of_birth: validatedData.dateOfBirth,
          preferred_language: 'en',
          notification_preferences: {
            email: true,
            sms: false,
            push: true,
          },
        })
        .select()
        .single();

      if (profileError) {
        // Rollback auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      await this.loadUserProfile(authData.user.id);

      // Log audit event
      await this.logAuditEvent('USER_SIGNUP', 'users', authData.user.id, null, profile);

      return {
        user: this.currentUser!,
        session: authData.session,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  public async signIn(data: SignInData): Promise<{ user: User; session: any }> {
    try {
      // Validate input
      const validatedData = SignInDTO.parse(data);

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw authError;
      }

      if (!authData.user) throw new Error('Sign in failed');

      // Load user profile
      await this.loadUserProfile(authData.user.id);

      // Check if user is suspended
      if (this.currentUser?.status === 'suspended') {
        await this.signOut();
        throw new Error('Your account has been suspended. Please contact support.');
      }

      // Log audit event
      await this.logAuditEvent('USER_SIGNIN', 'users', authData.user.id);

      return {
        user: this.currentUser!,
        session: authData.session,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  public async signOut(): Promise<void> {
    try {
      const userId = this.currentUser?.id;
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      if (userId) {
        await this.logAuditEvent('USER_SIGNOUT', 'users', userId);
      }

      this.currentUser = null;
      this.stopSessionCheck();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  public async updateProfile(data: UpdateProfileData): Promise<User> {
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      // Validate input
      const validatedData = UpdateProfileDTO.parse(data);

      // Prepare update data
      const updateData: any = {};
      if (validatedData.fullName) updateData.full_name = validatedData.fullName;
      if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
      if (validatedData.nationality) updateData.nationality = validatedData.nationality;
      if (validatedData.dateOfBirth) updateData.date_of_birth = validatedData.dateOfBirth;
      if (validatedData.avatarUrl) updateData.avatar_url = validatedData.avatarUrl;
      if (validatedData.preferredLanguage) updateData.preferred_language = validatedData.preferredLanguage;
      if (validatedData.notificationPreferences) {
        updateData.notification_preferences = validatedData.notificationPreferences;
      }

      // Update profile
      const { data: profile, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      // Reload user profile
      await this.loadUserProfile(this.currentUser.id);

      // Log audit event
      await this.logAuditEvent('USER_PROFILE_UPDATE', 'users', this.currentUser.id, null, profile);

      return this.currentUser!;
    } catch (error) {
      console.error('Update profile error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  public async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      // Validate input
      const validatedData = ChangePasswordDTO.parse(data);

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: this.currentUser.email,
        password: validatedData.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: validatedData.newPassword,
      });

      if (updateError) throw updateError;

      // Log audit event
      await this.logAuditEvent('USER_PASSWORD_CHANGE', 'users', this.currentUser.id);

    } catch (error) {
      console.error('Change password error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  public async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      // Validate input
      const validatedData = ResetPasswordDTO.parse(data);

      const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      // Log audit event (without user ID as they're not authenticated)
      await this.logAuditEvent('PASSWORD_RESET_REQUEST', 'users', null, null, { email: validatedData.email });

    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  public async verifyEmail(token: string): Promise<void> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        type: 'email',
        token,
        email: this.currentUser?.email || '',
      });

      if (error) throw error;

      // Update user profile
      if (this.currentUser) {
        await supabase
          .from('users')
          .update({ 
            email_verified: true,
            status: 'active',
          })
          .eq('id', this.currentUser.id);

        await this.loadUserProfile(this.currentUser.id);
      }

    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  public async uploadAvatar(file: File): Promise<string> {
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      const fileExt = file.name.split('.').pop();
      const fileName = `${this.currentUser.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Update user profile
      await this.updateProfile({ avatarUrl: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }

  // =====================================================
  // Permission Checks
  // =====================================================

  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'super_admin';
  }

  public isSuperAdmin(): boolean {
    return this.currentUser?.role === 'super_admin';
  }

  public isPropertyOwner(): boolean {
    return this.currentUser?.role === 'property_owner' || this.isAdmin();
  }

  public isInvestor(): boolean {
    return this.currentUser?.role === 'investor';
  }

  public hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  public hasPermission(permission: string): Promise<boolean> {
    // This can be extended to check specific permissions from database
    const rolePermissions: Record<UserRole, string[]> = {
      super_admin: ['*'], // All permissions
      admin: [
        'manage_users',
        'manage_properties',
        'manage_bookings',
        'manage_investments',
        'view_reports',
        'manage_content',
      ],
      property_owner: [
        'manage_own_properties',
        'view_own_bookings',
        'view_own_reports',
        'manage_availability',
      ],
      investor: [
        'view_investments',
        'make_investments',
        'view_investment_reports',
      ],
      guest: [
        'view_properties',
        'make_bookings',
        'write_reviews',
      ],
      support: [
        'view_users',
        'view_bookings',
        'manage_messages',
        'view_reports',
      ],
    };

    if (!this.currentUser) return Promise.resolve(false);

    const userPermissions = rolePermissions[this.currentUser.role] || [];
    return Promise.resolve(
      userPermissions.includes('*') || userPermissions.includes(permission)
    );
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public async refreshSession(): Promise<void> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (session) {
        await this.loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      throw error;
    }
  }

  private async logAuditEvent(
    action: string,
    entityType: string,
    entityId: string | null,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_id: this.currentUser?.id || null,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // =====================================================
  // Social Authentication
  // =====================================================

  public async signInWithGoogle(): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  public async signInWithFacebook(): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }
  }

  // =====================================================
  // Two-Factor Authentication
  // =====================================================

  public async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      // This would typically call a backend endpoint that generates TOTP secret
      // For now, returning placeholder
      return {
        qrCode: 'data:image/png;base64,...',
        secret: 'JBSWY3DPEHPK3PXP',
      };
    } catch (error) {
      console.error('Enable 2FA error:', error);
      throw error;
    }
  }

  public async verifyTwoFactor(code: string): Promise<boolean> {
    try {
      if (!this.currentUser) throw new Error('No authenticated user');

      // This would typically verify the TOTP code
      // For now, returning true for demo
      return code === '123456';
    } catch (error) {
      console.error('Verify 2FA error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();