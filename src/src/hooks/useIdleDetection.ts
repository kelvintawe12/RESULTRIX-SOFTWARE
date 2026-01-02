import { useState, useEffect, useCallback } from 'react';
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useIdleDetection(timeout = IDLE_TIMEOUT) {
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (isIdle) {
      setIsIdle(false);
    }
  }, [isIdle]);
  useEffect(() => {
    // Events to listen for
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'keypress'];

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Check for idle status periodically
    const intervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity >= timeout && !isIdle) {
        setIsIdle(true);
      }
    }, 1000);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [handleActivity, isIdle, lastActivity, timeout]);
  const resetIdle = () => {
    setIsIdle(false);
    setLastActivity(Date.now());
  };
  return {
    isIdle,
    resetIdle,
    lastActivity
  };
}