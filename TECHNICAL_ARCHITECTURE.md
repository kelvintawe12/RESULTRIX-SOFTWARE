# Technical Architecture & Roadmap

## Executive Summary

EduMaster is a cloud-native, multi-tenant SaaS platform designed for educational institution management. The system leverages a modern **Composable Architecture**, utilizing **React** for the frontend and **Supabase** as a comprehensive Backend-as-a-Service (BaaS) provider. This document outlines the current architectural state, core design principles, and the technical roadmap for future scalability and feature expansion.

## 1. Current Architecture (As-Is)

### 1.1 High-Level Overview

The platform operates as a Single Page Application (SPA) served via a Content Delivery Network (CDN), interacting directly with a PostgreSQL database via secure, authenticated API calls.

```mermaid
graph TD
    Client[Client Browser / PWA]
    CDN[Vercel Edge Network]
    Auth[Supabase Auth (GoTrue)]
    DB[(Supabase PostgreSQL)]
    Storage[Supabase Storage]
    
    Client -->|Static Assets| CDN
    Client -->|Authentication| Auth
    Client -->|Data (REST/Realtime)| DB
    Client -->|File Uploads| Storage
```

### 1.2 Frontend Layer
- **Framework**: React 18 with TypeScript 5.0.
- **Build System**: Vite for rapid development and optimized production builds.
- **Styling**: Tailwind CSS for utility-first, responsive design.
- **State Management**: React Context API for global state (User, Theme, Toast).
- **Routing**: React Router v6 with protected route wrappers.
- **Visualization**: Recharts for analytics dashboards.
- **PWA**: Service Workers (Workbox) for offline capabilities and caching.

### 1.3 Backend & Data Layer
- **Infrastructure**: Supabase (AWS-backed).
- **Database**: PostgreSQL 15+ with Row Level Security (RLS).
- **API**: PostgREST (auto-generated RESTful API from schema).
- **Real-time**: Supabase Realtime (WebSockets) for live updates.
- **Business Logic**: 
  - **PL/pgSQL Functions**: Complex calculations (e.g., `update_student_fees`, `recalc_grades_and_averages`).
  - **Database Triggers**: Audit logging, timestamp updates, and data consistency.

### 1.4 Security Architecture
- **Authentication**: JWT-based stateless authentication via Supabase Auth.
- **Authorization**: 
  - **RBAC (Role-Based Access Control)**: Enforced via database RLS policies.
  - **Multi-Tenancy**: Strict isolation using `school_id` column on all tenant-specific tables.
- **Data Protection**: 
  - Encryption at rest (PostgreSQL TDE).
  - Encryption in transit (TLS 1.3).

---

## 2. Architectural Principles

1.  **Strict Multi-Tenancy**: Data isolation is paramount. Every query must be scoped by `school_id` via RLS policies, ensuring no data leakage between institutions.
2.  **Offline-First Design**: Given the varying internet connectivity in educational settings, the architecture prioritizes PWA capabilities and optimistic UI updates.
3.  **Database-Centric Logic**: To maintain data integrity and performance, core transactional logic (fee calculations, grade aggregation) resides close to the data in SQL functions, rather than the client.
4.  **Component Modularity**: The frontend is built on atomic design principles, ensuring reusable, testable, and accessible UI components.

---

## 3. Technical Roadmap

### Phase 1: Foundation & Performance (Current Quarter)

Focus: Optimizing the existing codebase for speed and reliability.

- [ ] **State Management Migration**: Transition from Context API to **TanStack Query (React Query)** for server state.
    - *Benefit*: Automatic caching, background refetching, and elimination of "prop drilling".
- [ ] **Virtualization**: Implement `react-window` for large lists (Student Enrollment, Attendance) to improve rendering performance.
- [ ] **Image Optimization**: Implement an image resizing pipeline (Supabase Image Transformations) to serve optimized assets based on device viewport.
- [ ] **E2E Testing Suite**: Expand Playwright coverage to include critical flows (Fee Payment, Report Card Generation).

### Phase 2: Scalability & Server-Side Logic (Q2)

Focus: Offloading heavy computation from the database and client.

- [ ] **Edge Functions Implementation**: Move complex non-transactional logic to Supabase Edge Functions (Deno).
    - *Use Cases*: PDF Report Generation, Bulk Email Sending, CSV Import Processing.
- [ ] **Async Audit Logging**: Refactor the synchronous audit trigger to an asynchronous queue (pg_net) to prevent blocking user interactions during high-volume writes.
- [ ] **Database Indexing Strategy**: Implement partial indexes for frequently queried "active" records (e.g., `WHERE is_current = true`).

### Phase 3: Advanced Features & Integration (Q3)

Focus: Expanding the platform's capabilities and external connectivity.

- [ ] **Notification Engine**: Build a unified notification service (Email, SMS, In-App) using a message queue architecture.
- [ ] **Parent Portal API**: Expose a dedicated, rate-limited API subset for the mobile parent application.
- [ ] **Payment Gateway Aggregation**: Create an abstraction layer to support multiple payment providers (Stripe, PayPal, Local Mobile Money) via a plugin architecture.
- [ ] **AI Analytics Service**: Integrate a separate service for analyzing student performance trends and predicting at-risk students.

### Phase 4: Enterprise Readiness (Q4)

Focus: Features required for large-scale institutional networks.

- [ ] **Multi-Region Support**: Configure read replicas for global deployments to reduce latency.
- [ ] **SSO Integration**: Support SAML 2.0 and OIDC for enterprise identity management (Microsoft Entra ID, Google Workspace).
- [ ] **Data Warehousing**: Set up ETL pipelines to sync transactional data to a data warehouse (e.g., Snowflake or BigQuery) for historical reporting without impacting production DB performance.

---

## 4. Data Model Architecture

The database schema follows a normalized relational model with specific optimizations for SaaS workloads.

### Core Entities

| Entity | Description | Key Relationships |
|--------|-------------|-------------------|
| **Schools** | Tenant root | Parent to all other entities. |
| **Users** | Global authentication | Linked to Schools via `school_id` (except Super Admins). |
| **Academic Structure** | Years > Terms > Sequences | Hierarchical time-boxing for data. |
| **Enrollments** | Junction table | Links Students, Subjects, and Classes. |

### Critical Flows

#### Grade Calculation Flow
1.  **Input**: Teacher submits marks for a Sequence.
2.  **Trigger**: `trg_recalc_grades` fires on `INSERT/UPDATE`.
3.  **Calculation**: SQL Function computes total, average, and letter grade.
4.  **Aggregation**: Updates `class_averages` materialized view (or table) for reporting.
5.  **Output**: Client receives updated data via Realtime subscription.

---

## 5. Deployment & DevOps

### CI/CD Pipeline

- **Provider**: GitHub Actions + Vercel.
- **Triggers**: Push to `main` (Production), Push to `develop` (Staging).
- **Checks**:
    1.  Linting (ESLint).
    2.  Type Checking (TypeScript).
    3.  Unit Tests (Vitest).
    4.  Build Verification.

### Environment Strategy

| Environment | URL | Branch | Database |
|-------------|-----|--------|----------|
| **Development** | `localhost:5173` | `feature/*` | Local / Dev Project |
| **Staging** | `staging.edumaster.com` | `develop` | Staging Project |
| **Production** | `app.edumaster.com` | `main` | Production Project |

---

## 6. Technology Stack Summary

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React, TypeScript | Type safety, ecosystem, component reusability. |
| **Build** | Vite | Superior dev experience, fast HMR. |
| **UI Library** | Tailwind CSS | Rapid styling, small bundle size. |
| **Backend** | Supabase | Reduces backend boilerplate, handles auth/security. |
| **Database** | PostgreSQL | Robust, relational, ACID compliance. |
| **Testing** | Vitest, Playwright | Modern, fast testing utilities. |
| **Hosting** | Vercel | Edge network, seamless React integration. |

---

*This document is a living artifact and should be updated as architectural decisions are made and implemented.*