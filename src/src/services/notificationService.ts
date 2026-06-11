/**
 * Notification Service
 * Handles all notification operations including creating, reading, and managing notifications
 */

import { supabase } from '../lib/supabaseClient';
import { cacheService } from './cacheService';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'announcement';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  school_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  read_at: string | null;
  action_url?: string;
  action_label?: string;
  metadata: Record<string, any>;
  created_at: string;
  expires_at: string | null;
}

export interface CreateNotificationParams {
  user_id?: string;
  school_id?: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(params: CreateNotificationParams): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: params.user_id || null,
        p_school_id: params.school_id || null,
        p_title: params.title,
        p_message: params.message,
        p_type: params.type || 'info',
        p_priority: params.priority || 'medium',
        p_action_url: params.action_url || null,
        p_action_label: params.action_label || null,
        p_metadata: params.metadata || {},
        p_expires_at: params.expires_at || null
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating notification:', error);
      throw new Error(error.message || 'Failed to create notification');
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 50
  ): Promise<Notification[]> {
    try {
      // Check cache first
      const cacheKey = `user-notifications-${userId}-${unreadOnly}-${limit}`;
      const cached = cacheService.get<Notification[]>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      // Filter out expired notifications
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      const { data, error } = await query;
      
      if (error) throw error;
      
      const notifications = data || [];
      
      // Cache for 1 minute
      cacheService.set(cacheKey, notifications, 60 * 1000);
      
      return notifications;
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.message || 'Failed to fetch notifications');
    }
  }

  /**
   * Get notifications for a school (school-wide notifications)
   */
  async getSchoolNotifications(
    schoolId: string,
    unreadOnly: boolean = false,
    limit: number = 50
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      // Filter out expired notifications
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching school notifications:', error);
      throw new Error(error.message || 'Failed to fetch school notifications');
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Check cache first (short TTL for count)
      const cacheKey = `unread-count-${userId}`;
      const cached = cacheService.get<number>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const { data, error } = await supabase.rpc('get_notification_count', {
        p_user_id: userId,
        p_unread_only: true
      });

      if (error) throw error;
      
      const count = data || 0;
      
      // Cache for 30 seconds (short TTL for counts)
      cacheService.set(cacheKey, count, 30 * 1000);
      
      return count;
    } catch (error: any) {
      console.error('Error fetching notification count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_user_id: userId
      });

      if (error) throw error;
      
      // Invalidate cache
      cacheService.delete(`user-notifications-${userId}-true-50`);
      cacheService.delete(`user-notifications-${userId}-false-50`);
      cacheService.delete(`user-notifications-${userId}-true`);
      cacheService.delete(`user-notifications-${userId}-false`);
      cacheService.delete(`unread-count-${userId}`);
      
      return data || false;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: userId
      });

      if (error) throw error;
      
      // Invalidate cache
      cacheService.delete(`user-notifications-${userId}-true-50`);
      cacheService.delete(`user-notifications-${userId}-false-50`);
      cacheService.delete(`user-notifications-${userId}-true`);
      cacheService.delete(`user-notifications-${userId}-false`);
      cacheService.delete(`unread-count-${userId}`);
      
      return data || 0;
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpired(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_notifications');

      if (error) throw error;
      return data || 0;
    } catch (error: any) {
      console.error('Error cleaning up expired notifications:', error);
      return 0;
    }
  }

  /**
   * Convenience method to create different types of notifications
   */
  async info(params: Omit<CreateNotificationParams, 'type'>): Promise<string> {
    return this.createNotification({ ...params, type: 'info' });
  }

  async success(params: Omit<CreateNotificationParams, 'type'>): Promise<string> {
    return this.createNotification({ ...params, type: 'success' });
  }

  async warning(params: Omit<CreateNotificationParams, 'type'>): Promise<string> {
    return this.createNotification({ ...params, type: 'warning' });
  }

  async error(params: Omit<CreateNotificationParams, 'type'>): Promise<string> {
    return this.createNotification({ ...params, type: 'error' });
  }

  async announcement(params: Omit<CreateNotificationParams, 'type'>): Promise<string> {
    return this.createNotification({ ...params, type: 'announcement', priority: 'high' });
  }
}

export const notificationService = new NotificationService();