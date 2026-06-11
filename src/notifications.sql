-- Notification System Schema
-- Real-time notification system for the EduMaster platform

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'info',
  'success',
  'warning',
  'error',
  'announcement'
);

-- Notification priorities enum
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    priority notification_priority NOT NULL DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    action_label VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_school ON notifications(school_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Add comments
COMMENT ON TABLE notifications IS 'User notifications for real-time updates';
COMMENT ON COLUMN notifications.action_url IS 'Optional URL to navigate to when notification is clicked';
COMMENT ON COLUMN notifications.action_label IS 'Label for the action button (e.g., "View Details")';
COMMENT ON COLUMN notifications.metadata IS 'Additional data related to the notification (e.g., student_id, class_id)';
COMMENT ON COLUMN notifications.expires_at IS 'Optional expiration time after which notification is hidden';

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_school_id UUID,
  p_title VARCHAR(255),
  p_message TEXT,
  p_type notification_type DEFAULT 'info',
  p_priority notification_priority DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    school_id,
    title,
    message,
    type,
    priority,
    action_url,
    action_label,
    metadata,
    expires_at
  ) VALUES (
    p_user_id,
    p_school_id,
    p_title,
    p_message,
    p_type,
    p_priority,
    p_action_url,
    p_action_label,
    p_metadata,
    p_expires_at
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET 
    is_read = TRUE,
    read_at = CURRENT_TIMESTAMP
  WHERE id = p_notification_id 
    AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET 
    is_read = TRUE,
    read_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id 
    AND is_read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification count for a user
CREATE OR REPLACE FUNCTION get_notification_count(p_user_id UUID, p_unread_only BOOLEAN DEFAULT TRUE)
RETURNS INTEGER AS $$
BEGIN
  IF p_unread_only THEN
    RETURN (
      SELECT COUNT(*)
      FROM notifications
      WHERE user_id = p_user_id 
      AND is_read = FALSE
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    );
  ELSE
    RETURN (
      SELECT COUNT(*)
      FROM notifications
      WHERE user_id = p_user_id
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic cleanup (optional)
-- This can be called by a scheduled job
-- CREATE OR REPLACE FUNCTION notify_cleanup_trigger()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   PERFORM cleanup_expired_notifications();
--   RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;