/**
 * Notification Helper
 * Convenience functions to trigger notifications from anywhere in the app
 */

import { notificationService } from '../services/notificationService';
import type { NotificationType, NotificationPriority } from '../services/notificationService';

/**
 * Trigger a notification for the current user
 * This is a convenience function that can be called from anywhere
 */
export async function notifyUser(params: {
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  expires_in_hours?: number;
}): Promise<void> {
  try {
    const expires_at = params.expires_in_hours
      ? new Date(Date.now() + params.expires_in_hours * 60 * 60 * 1000).toISOString()
      : undefined;

    await notificationService.createNotification({
      ...params,
      expires_at
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

/**
 * Notification helpers for common scenarios
 */
export const notify = {
  /**
   * Info notification
   */
  info: (title: string, message: string) => 
    notifyUser({ title, message, type: 'info' }),

  /**
   * Success notification
   */
  success: (title: string, message: string) => 
    notifyUser({ title, message, type: 'success' }),

  /**
   * Warning notification
   */
  warning: (title: string, message: string) => 
    notifyUser({ title, message, type: 'warning' }),

  /**
   * Error notification
   */
  error: (title: string, message: string) => 
    notifyUser({ title, message, type: 'error', priority: 'high' }),

  /**
   * Announcement
   */
  announcement: (title: string, message: string) => 
    notifyUser({ title, message, type: 'announcement', priority: 'high' }),

  /**
   * Action notification with link
   */
  action: (title: string, message: string, actionUrl: string, actionLabel?: string) => 
    notifyUser({ 
      title, 
      message, 
      type: 'info',
      action_url: actionUrl,
      action_label: actionLabel || 'View'
    }),

  /**
   * Student-related notification
   */
  student: (title: string, message: string, studentId: string) => 
    notifyUser({ 
      title, 
      message, 
      type: 'info',
      metadata: { student_id: studentId },
      action_url: `/dashboard/students/${studentId}`,
      action_label: 'View Student'
    }),

  /**
   * Payment notification
   */
  payment: (title: string, message: string, amount: number, currency: string = 'USD') => 
    notifyUser({ 
      title, 
      message, 
      type: 'success',
      priority: 'medium',
      metadata: { amount, currency }
    }),

  /**
   * Marks/Grade notification
   */
  grade: (title: string, message: string, classId: string) => 
    notifyUser({ 
      title, 
      message, 
      type: 'info',
      metadata: { class_id: classId },
      action_url: `/dashboard/marks-review`,
      action_label: 'Review Marks'
    }),

  /**
   * Report generated notification
   */
  report: (title: string, message: string, reportId: string) => 
    notifyUser({ 
      title, 
      message, 
      type: 'success',
      metadata: { report_id: reportId }
    }),

  /**
   * System notification (expires in 24 hours)
   */
  system: (title: string, message: string) => 
    notifyUser({ 
      title, 
      message, 
      type: 'info',
      priority: 'low',
      expires_in_hours: 24
    })
};