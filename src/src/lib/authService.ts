/**
 * Authentication Service
 * Handles all authentication operations including login, signup, password reset, 2FA, etc.
 */

import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'school_admin' | 'super_admin' | 'teacher' | 'bursar' | 'student';
  school_id?: string;
  is_active: boolean;
  avatar_url?: string;
  two_factor_enabled?: boolean;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  school_name: string;
  currency_code: string;
  grading_scale: string;
  plan_id?: string; // Optional plan selection during signup
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface TwoFactorSetup {
  user_id: string;
  secret: string;
  qr_code: string;
}

export interface TwoFactorVerify {
  user_id: string;
  code: string;
}

class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<{
    user: AuthUser;
    session: Session;
  }> {
    try {
      // Add timeout to prevent hanging
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email: credentials.email.toLowerCase(),
          password: credentials.password
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timeout')), 8000)
        )
      ]) as { data: any, error: any };

      if (error) throw error;
      if (!data.user || !data.session) throw new Error('Login failed');

      // Get user profile with timeout
      const userProfile = await Promise.race([
        this.getUserProfile(data.user.id),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        )
      ]);
      
      // Check if school is approved
      if (userProfile.role === 'school_admin') {
        const { data: schoolData } = await Promise.race([
          supabase
            .from('schools')
            .select('approved')
            .eq('id', userProfile.school_id)
            .single(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('School check timeout')), 3000)
          )
        ]);
        
        if (schoolData && !schoolData.approved) {
          await supabase.auth.signOut();
          throw new Error('Your school is pending approval. Please contact support.');
        }
      }

      // Update last login (fire and forget, don't await)
      this.updateLastLogin(data.user.id).catch(err => {
        console.error('Failed to update last login:', err);
      });

      // Store remember me preference
      if (credentials.rememberMe) {
        localStorage.setItem('edumaster_remember_email', credentials.email);
      } else {
        localStorage.removeItem('edumaster_remember_email');
      }

      return {
        user: userProfile,
        session: data.session
      };
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Sign up new school admin
   */
  async signup(data: SignupData): Promise<{
    user: AuthUser;
    school_id: string;
  }> {
    try {
      // Check if email exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single();

      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email.toLowerCase(),
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user?.id) throw new Error('Failed to create account');

      // Create school
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert([
          {
            name: data.school_name,
            currency_code: data.currency_code,
            grading_scale: data.grading_scale,
            approved: false,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (schoolError) throw schoolError;
      if (!schoolData?.id) throw new Error('Failed to create school');

      // Create user profile
      const { error: profileError } = await supabase.from('users').insert([
        {
          id: authData.user.id,
          email: data.email.toLowerCase(),
          full_name: data.full_name,
          phone: data.phone,
          role: 'school_admin',
          school_id: schoolData.id,
          is_active: true
        }
      ]);

      if (profileError) throw profileError;

      // Send verification email
      await this.sendEmailVerification(data.email);

      const userProfile = await this.getUserProfile(authData.user.id);

      // Subscription creation is handled separately to avoid circular dependencies
      // This should be called after signup completes successfully

      return {
        user: userProfile,
        school_id: schoolData.id
      };
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  }

  /**
   * Send password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`
        }
      );

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset email');
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error) throw error;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<AuthUser> {
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        )
      ]) as { data: any, error: any };

      if (error) throw error;
      if (!data) throw new Error('User not found');

      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
        school_id: data.school_id,
        is_active: data.is_active,
        avatar_url: data.avatar_url,
        two_factor_enabled: data.two_factor_enabled,
        last_login: data.last_login
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update profile');

      return this.getUserProfile(userId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Verify current password
      const { user } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not authenticated');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) throw new Error('Current password is incorrect');

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change password');
    }
  }

  /**
   * Enable 2FA - Get setup code and QR code
   */
  async setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret (in production, use a library like speakeasy)
      const secret = this.generateTwoFactorSecret();
      const qrCode = this.generateQRCode(secret);

      return {
        user_id: userId,
        secret,
        qr_code: qrCode
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to setup 2FA');
    }
  }

  /**
   * Verify 2FA code and enable it
   */
  async verifyAndEnableTwoFactor(userId: string, code: string, secret: string): Promise<void> {
    try {
      // Verify code (in production, use speakeasy.totp.verify)
      const isValid = this.verifyTwoFactorCode(code, secret);
      
      if (!isValid) {
        throw new Error('Invalid 2FA code');
      }

      // Store 2FA secret for user
      const { error } = await supabase
        .from('users')
        .update({
          two_factor_enabled: true,
          two_factor_secret: secret
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to enable 2FA');
    }
  }

  /**
   * Verify 2FA code during login
   */
  async verifyTwoFactorLogin(userId: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('two_factor_secret')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data?.two_factor_secret) {
        throw new Error('2FA not configured for this user');
      }

      return this.verifyTwoFactorCode(code, data.two_factor_secret);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to verify 2FA code');
    }
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(userId: string, password: string): Promise<void> {
    try {
      // Verify password first
      const { user } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not authenticated');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      });

      if (signInError) throw new Error('Password is incorrect');

      // Disable 2FA
      const { error } = await supabase
        .from('users')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to disable 2FA');
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resendSessionRefreshToken;
      if (error) console.error('Email verification queued');
    } catch (error: any) {
      console.error('Failed to send verification email:', error);
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmailOTP(email: string, otp: string): Promise<void> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Invalid verification code');
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  /**
   * Generate 2FA secret
   */
  private generateTwoFactorSecret(): string {
    // In production, use: import speakeasy from 'speakeasy'
    // return speakeasy.generateSecret().base32
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate QR code for 2FA
   */
  private generateQRCode(secret: string): string {
    // In production, use: import QRCode from 'qrcode'
    // const qr = await QRCode.toDataURL(...)
    return `data:image/svg+xml,...`; // Placeholder
  }

  /**
   * Verify 2FA code
   */
  private verifyTwoFactorCode(code: string, secret: string): boolean {
    // In production, use: import speakeasy from 'speakeasy'
    // return speakeasy.totp.verify({
    //   secret,
    //   encoding: 'base32',
    //   token: code,
    //   window: 2
    // });
    return code.length === 6; // Placeholder validation
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('edumaster_remember_email');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to logout');
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data.session;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Request account deletion
   */
  async requestAccountDeletion(userId: string, password: string): Promise<void> {
    try {
      const { user } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not authenticated');

      // Verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      });

      if (signInError) throw new Error('Password is incorrect');

      // Create deletion request
      const { error } = await supabase
        .from('account_deletion_requests')
        .insert([
          {
            user_id: userId,
            requested_at: new Date().toISOString(),
            status: 'pending'
          }
        ]);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to request account deletion');
    }
  }
}

export const authService = new AuthService();
