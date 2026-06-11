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
    user,
    loading
  } = useAuth();

  const role = user?.role as unknown as UserRole | undefined;

  // If role value is not in the allowed set, treat as unauthorized
  // (avoids TS errors when auth roles include values outside UserRole union)


  if (loading) {
    return null; // Or a spinner
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

