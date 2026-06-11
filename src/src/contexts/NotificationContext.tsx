/**
 * Notification Context
 * Provides real-time notification state and functionality throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, Notification, NotificationType } from '../services/notificationService';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (params: {
    title: string;
    message: string;
    type?: NotificationType;
    action_url?: string;
    action_label?: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userNotifications = await notificationService.getUserNotifications(user.id, false, 50);
      setNotifications(userNotifications);
      
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, refreshNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    // Subscribe to notification changes
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification change:', payload);
          refreshNotifications();
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await notificationService.markAsRead(notificationId, user.id);
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const markedCount = await notificationService.markAllAsRead(user.id);
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const success = await notificationService.deleteNotification(notificationId, user.id);
      if (success) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        // Update unread count if needed
        const deletedNotif = notifications.find(n => n.id === notificationId);
        if (deletedNotif && !deletedNotif.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Create notification
  const createNotification = async (params: {
    title: string;
    message: string;
    type?: NotificationType;
    action_url?: string;
    action_label?: string;
    metadata?: Record<string, any>;
  }) => {
    if (!user) return;
    
    try {
      await notificationService.createNotification({
        user_id: user.id,
        school_id: user.school_id,
        ...params
      });
      // Refresh to get the new notification
      refreshNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}