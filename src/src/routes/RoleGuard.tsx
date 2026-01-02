import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}
export function RoleGuard({
  children,
  allowedRoles
}: RoleGuardProps) {
  const {
    role,
    loading
  } = useAuth();
  if (loading) {
    return null; // Or a spinner
  }
  if (!role || !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role, or 403 page
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}