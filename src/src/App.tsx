import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleGuard } from './routes/RoleGuard';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
// Public Pages
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { PricingPage } from './pages/public/PricingPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { ResourcesPage } from './pages/public/ResourcesPage';
import { SecurityPage } from './pages/public/SecurityPage';
import { SchoolsPage } from './pages/solutions/SchoolsPage';
import { UniversitiesPage } from './pages/solutions/UniversitiesPage';
import { DistrictsPage } from './pages/solutions/DistrictsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { SuperAdminLoginPage } from './pages/auth/SuperAdminLoginPage';
import { AuthCallback } from './pages/auth/AuthCallback';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/legal/TermsOfServicePage';
// New Public Pages
import { FAQPage } from './pages/public/FAQPage';
import { CaseStudiesPage } from './pages/public/CaseStudiesPage';
import { BlogPage } from './pages/public/BlogPage';
import { DemoPage } from './pages/public/DemoPage';
import { StatusPage } from './pages/public/StatusPage';
import { IntegrationsPage } from './pages/public/IntegrationsPage';
import { RoadmapPage } from './pages/public/RoadmapPage';
import { ChangelogPage } from './pages/public/ChangelogPage';
import { PartnersPage } from './pages/public/PartnersPage';
import { ToolsPage } from './pages/public/ToolsPage';
// School Admin Pages
import { SchoolAdminDashboard } from './pages/dashboard/SchoolAdminDashboard';
import { SchoolInformationPage } from './pages/dashboard/SchoolInformationPage';
import { StudentsPage } from './pages/dashboard/StudentsPage';
import { StudentDetailsPage } from './pages/dashboard/StudentDetailsPage';
import { StudentAcademicRecordsPage } from './pages/dashboard/StudentAcademicRecordsPage';
import { TeachersPage } from './pages/dashboard/TeachersPage';
import { BursarsPage } from './pages/dashboard/BursarsPage';
import { FeesPage } from './pages/dashboard/FeesPage';
import { PaymentsPage } from './pages/dashboard/PaymentsPage';
import { FeeStructurePage } from './pages/dashboard/FeeStructurePage';
import { ReceiptsManagementPage } from './pages/dashboard/ReceiptsManagementPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { AcademicsPage } from './pages/dashboard/AcademicsPage';
import { AcademicSetupPage } from './pages/setup/AcademicSetupPage';
import { GradingSystemSetupPage } from './pages/setup/GradingSystemSetupPage';
import { AcademicManagementPage } from './pages/dashboard/AcademicManagementPage';
import { TeacherAssignmentsPage } from './pages/dashboard/TeacherAssignmentsPage';
import { StudentSubjectEnrollmentPage } from './pages/dashboard/StudentSubjectEnrollmentPage';
import { MarksReviewPage } from './pages/dashboard/MarksReviewPage';
import { BulkStudentEnrollmentPage } from './pages/dashboard/BulkStudentEnrollmentPage';
import { AdminMarksSubmissionPage } from './pages/dashboard/AdminMarksSubmissionPage';
import { ClassMasterSheetPage } from './pages/dashboard/ClassMasterSheetPage';
import { ReportCardsPage } from './pages/dashboard/ReportCardsPage';
import { ReportTemplatesPage } from './pages/dashboard/ReportTemplatesPage';
import { BulkReportGenerationPage } from './pages/dashboard/BulkReportGenerationPage';
import { EmailTemplatesPage } from './pages/dashboard/EmailTemplatesPage';
import { EmailCommunicationPage } from './pages/dashboard/EmailCommunicationPage';
import { AnnouncementsPage } from './pages/dashboard/AnnouncementsPage';
import { SubjectsManagementPage } from './pages/dashboard/SubjectsManagementPage';
import { AuditLogsPage } from './pages/dashboard/AuditLogsPage';
// Super Admin Pages
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard';
import { SchoolApprovalPage } from './pages/super-admin/SchoolApprovalPage';
import { SchoolsManagementPage } from './pages/super-admin/SchoolsManagementPage';
import { AdministratorsManagementPage } from './pages/super-admin/AdministratorsManagementPage';
import { UsersManagementPage } from './pages/super-admin/UsersManagementPage';
import { PlatformReportsPage } from './pages/super-admin/PlatformReportsPage';
import { BillingPage } from './pages/super-admin/BillingPage';
import { SystemEmailsPage } from './pages/super-admin/SystemEmailsPage';
import { SuperAdminAnnouncementsPage } from './pages/super-admin/SuperAdminAnnouncementsPage';
import { DatabaseInspectorPage } from './pages/super-admin/DatabaseInspectorPage';
import { SystemMaintenancePage } from './pages/super-admin/SystemMaintenancePage';
import { GlobalAnalyticsPage } from './pages/super-admin/GlobalAnalyticsPage';
import { SchoolDetailsPage } from './pages/super-admin/SchoolDetailsPage';
import { PlatformSettingsPage } from './pages/super-admin/PlatformSettingsPage';
import { AuditLogsPage as SuperAdminAuditLogsPage } from './pages/super-admin/AuditLogsPage';
// Bursar Pages
import { BursarDashboard } from './pages/bursar/BursarDashboard';
import { PaymentsPage as BursarPaymentsPage } from './pages/bursar/PaymentsPage';
import { BursarReportsPage } from './pages/bursar/BursarReportsPage';
import { StudentBalancesPage } from './pages/bursar/StudentBalancesPage';
import { PaymentTrendsPage } from './pages/bursar/PaymentTrendsPage';
import { ClassPaymentsPage } from './pages/bursar/ClassPaymentsPage';
import { OutstandingPaymentsPage } from './pages/bursar/OutstandingPaymentsPage';
import { BursarFeeStructurePage } from './pages/bursar/BursarFeeStructurePage';
import { BursarClassesPage } from './pages/bursar/BursarClassesPage';
import { ReceiptsPage } from './pages/bursar/ReceiptsPage';
import { BursarStudentsPage } from './pages/bursar/BursarStudentsPage';
import { InvoicingPage } from './pages/bursar/InvoicingPage';
// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { MarksEntryPage } from './pages/teacher/MarksEntryPage';
import { TeacherClassesPage } from './pages/teacher/TeacherClassesPage';
import { TeacherClassDetailsPage } from './pages/teacher/TeacherClassDetailsPage';
import { TeacherAttendancePage } from './pages/teacher/TeacherAttendancePage';
import { TeacherReportsPage } from './pages/teacher/TeacherReportsPage';
import { TeacherSchedulePage } from './pages/teacher/TeacherSchedulePage';
import { ProfilePage } from './pages/common/ProfilePage';
import { SettingsPage } from './pages/common/SettingsPage';
import { useAuth } from './hooks/useAuth';
// Wrapper components for common routes that need role detection
function ProfilePageWrapper() {
  const {
    user
  } = useAuth();
  const role = user?.role || 'teacher';
  return <DashboardLayout role={role}>
      <ProfilePage />
    </DashboardLayout>;
}
function SettingsPageWrapper() {
  const {
    user
  } = useAuth();
  const role = user?.role || 'teacher';
  return <DashboardLayout role={role}>
      <SettingsPage />
    </DashboardLayout>;
}
function App() {
  return <Router>
      <AuthProvider>
        <PWAInstallPrompt />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/security" element={<SecurityPage />} />

          {/* New Public Pages */}
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/case-studies" element={<CaseStudiesPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/tools" element={<ToolsPage />} />

          {/* Solutions Routes */}
          <Route path="/solutions/schools" element={<SchoolsPage />} />
          <Route path="/solutions/universities" element={<UniversitiesPage />} />
          <Route path="/solutions/districts" element={<DistrictsPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />

          {/* School Admin Routes */}
          <Route path="/dashboard" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <SchoolAdminDashboard />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />

          <Route path="/dashboard/school-information" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <SchoolInformationPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />

          <Route path="/dashboard/students" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <StudentsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/students/:id" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <StudentDetailsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/students/records" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <StudentAcademicRecordsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />

          <Route path="/dashboard/teachers" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <TeachersPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/bursars" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <BursarsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/fees" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <FeesPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/payments" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <PaymentsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/receipts" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin', 'bursar']}>
                  <DashboardLayout role="school_admin">
                    <ReceiptsManagementPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/fee-structure" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <FeeStructurePage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/academics" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <AcademicsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/subjects" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <SubjectsManagementPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/audit-logs" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <AuditLogsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/reports" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <ReportsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/report-cards" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <ReportCardsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/report-templates" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <ReportTemplatesPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/bulk-reports" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <BulkReportGenerationPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/email-templates" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin', 'bursar']}>
                  <DashboardLayout role="school_admin">
                    <EmailTemplatesPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/email-communication" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin', 'bursar']}>
                  <DashboardLayout role="school_admin">
                    <EmailCommunicationPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/setup" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <AcademicSetupPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/academic-management" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <AcademicManagementPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/grading-setup" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <GradingSystemSetupPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/teacher-assignments" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <TeacherAssignmentsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/student-enrollment" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <StudentSubjectEnrollmentPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/bulk-enrollment" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <BulkStudentEnrollmentPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/marks-review" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <MarksReviewPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/marks-submission" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <AdminMarksSubmissionPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/class-mastersheet" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin']}>
                  <DashboardLayout role="school_admin">
                    <ClassMasterSheetPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/dashboard/announcements" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['school_admin', 'teacher', 'bursar']}>
                  <DashboardLayout role="school_admin">
                    <AnnouncementsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />

          {/* Super Admin Routes */}
          <Route path="/super-admin" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <SuperAdminDashboard />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/schools" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <SchoolsManagementPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/administrators" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <AdministratorsManagementPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/users" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <UsersManagementPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/reports" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <PlatformReportsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/billing" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <BillingPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/emails" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <SystemEmailsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/announcements" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <SuperAdminAnnouncementsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/database" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <DatabaseInspectorPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/maintenance" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <SystemMaintenancePage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/analytics" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <GlobalAnalyticsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/approvals" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <SchoolApprovalPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/schools/:id" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <SchoolDetailsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/settings" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <PlatformSettingsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/audit-logs" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <SuperAdminAuditLogsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/database-inspector" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <DatabaseInspectorPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/super-admin/system-maintenance" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['super_admin']}>
                  <DashboardLayout role="super_admin">
                    <SystemMaintenancePage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />

          {/* Bursar Routes */}
          <Route path="/bursar" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <BursarDashboard />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/invoicing" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <InvoicingPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/payments" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <BursarPaymentsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/reports" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <BursarReportsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/student-balances" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <StudentBalancesPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/payment-trends" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <PaymentTrendsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/class-payments" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <ClassPaymentsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/outstanding" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <OutstandingPaymentsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/fee-structure" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <BursarFeeStructurePage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/classes" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <BursarClassesPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/receipts" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <ReceiptsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/students" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <BursarStudentsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/email-templates" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <EmailTemplatesPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/email-communication" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <EmailCommunicationPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/bursar/announcements" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['bursar']}>
                  <DashboardLayout role="bursar">
                    <AnnouncementsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout role="teacher">
                    <TeacherDashboard />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/teacher/classes" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout role="teacher">
                    <TeacherClassesPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/teacher/class-details/:assignmentId" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout role="teacher">
                    <TeacherClassDetailsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/teacher/marks" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout role="teacher">
                    <MarksEntryPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/teacher/attendance" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout role="teacher">
                    <TeacherAttendancePage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/teacher/reports" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout role="teacher">
                    <TeacherReportsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/teacher/schedule" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout role="teacher">
                    <TeacherSchedulePage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />
          <Route path="/teacher/announcements" element={<ProtectedRoute>
                <RoleGuard allowedRoles={['teacher']}>
                  <DashboardLayout role="teacher">
                    <AnnouncementsPage />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>} />

          {/* Common Routes */}
          <Route path="/profile" element={<ProtectedRoute>
                <ProfilePageWrapper />
              </ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute>
                <SettingsPageWrapper />
              </ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>;
}
export default App;