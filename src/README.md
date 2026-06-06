# EduMaster - School Management SaaS Platform

A comprehensive, modern school management system built with React, TypeScript, and Supabase. Streamline your educational institution's operations with powerful tools for academics, finances, and administration.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

## Features

### Multi-Tenant Architecture
- **Super Admin Dashboard**: Platform-wide management and analytics
- **School Admin Portal**: Complete school operations control
- **Teacher Interface**: Classroom management and grading
- **Bursar Tools**: Financial management and fee tracking
- **Student Portal**: Access to grades, schedules, and resources

### Academic Management
- Student enrollment and class management
- Subject and curriculum planning
- Teacher assignments and scheduling
- Marks entry and grade calculation
- Attendance tracking
- Report card generation (PDF)
- Bulk operations for efficiency

### Financial Management
- Fee structure configuration
- Payment processing and tracking
- Receipt generation
- Outstanding balance monitoring
- Financial reports and analytics
- Multiple payment methods support

### Analytics & Reporting
- Real-time dashboards
- Performance analytics
- Custom report generation
- Data export (CSV, PDF)
- Trend analysis
- Audit logs

### Security & Compliance
- Role-based access control (RBAC)
- Comprehensive audit logging
- Data encryption
- Secure authentication
- GDPR compliance ready
- Regular backups

### Modern UX
- Responsive design (mobile, tablet, desktop)
- Progressive Web App (PWA) support
- Dark mode ready
- Intuitive navigation
- Fast performance
- Offline capabilities

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account ([Sign up free](https://supabase.com))
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/edumaster.git
   cd edumaster
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the SQL scripts in your Supabase SQL editor in this order:
   ```bash
   1. schema.sql              # Core database schema
   2. database-audit-triggers.sql  # Audit logging
   3. billing.sql             # Subscription management (optional)
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173`

### First-Time Setup

1. **Create Super Admin Account**
   - Navigate to `/super-admin/login`
   - Sign up with your email
   - Manually set role to `super_admin` in Supabase dashboard

2. **Create Your First School**
   - Log in as super admin
   - Go to Schools Management
   - Add a new school with details

3. **Set Up Academic Structure**
   - Create academic year
   - Add terms and sequences
   - Define classes and subjects

4. **Add Users**
   - Create school admin accounts
   - Add teachers and bursars
   - Enroll students

## Documentation

### Project Structure

```
edumaster/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Shared components
│   │   ├── dashboard/   # Dashboard-specific
│   │   ├── forms/       # Form components
│   │   ├── layout/      # Layout components
│   │   ├── reports/     # Report components
│   │   └── ui/          # Base UI components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Third-party integrations
│   ├── pages/           # Page components
│   │   ├── auth/        # Authentication pages
│   │   ├── bursar/      # Bursar pages
│   │   ├── common/      # Shared pages
│   │   ├── dashboard/   # School admin pages
│   │   ├── public/      # Public pages
│   │   ├── super-admin/ # Super admin pages
│   │   └── teacher/     # Teacher pages
│   ├── routes/          # Routing configuration
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── schema.sql           # Database schema
├── billing.sql          # Billing schema
└── database-audit-triggers.sql  # Audit triggers
```

### Key Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Context API
- **Routing**: React Router v6
- **Charts**: Recharts
- **Forms**: Custom form components
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Build Tool**: Vite

### Database Schema

The application uses a comprehensive PostgreSQL schema with:

- **Multi-tenancy**: School-based data isolation
- **Academic Structure**: Years, terms, sequences, classes, subjects
- **User Management**: Role-based access control
- **Student Records**: Complete student profiles and enrollment
- **Financial**: Fee structures, payments, receipts
- **Academic Records**: Marks, attendance, report cards
- **Audit Trail**: Comprehensive change logging

See `schema.sql` for complete schema documentation.

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

### Supabase Setup

1. **Enable Email Authentication**
   - Go to Authentication > Providers
   - Enable Email provider

2. **Set Up Row Level Security (RLS)**
   - The schema includes RLS policies
   - Ensure they're enabled in your project

3. **Configure Storage (Optional)**
   - Create buckets for: `logos`, `receipts`, `reports`
   - Set appropriate access policies

## Customization

### Branding

Edit `tailwind.config.js` to customize colors:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',    // Your brand color
        secondary: '#10B981',  // Secondary color
      }
    }
  }
}
```

### Features

Enable/disable features in `src/config/features.ts` (create if needed):

```typescript
export const features = {
  billing: true,
  parentPortal: false,
  smsNotifications: false,
}
```

## PWA Support

The application is a Progressive Web App:

- **Offline Support**: Core features work offline
- **Install Prompt**: Users can install on mobile/desktop
- **Push Notifications**: Ready for implementation
- **App-like Experience**: Full-screen, fast loading

To customize PWA settings, edit `public/manifest.json`.

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import project in Vercel dashboard
   - Connect your GitHub repository

2. **Configure Environment**
   - Add environment variables in Vercel settings
   - Set build command: `npm run build`
   - Set output directory: `dist`

3. **Deploy**
   - Push to main branch
   - Automatic deployment on every commit

### Manual Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy dist/ folder to your hosting
```

### Docker Deployment

```bash
# Build Docker image
docker build -t edumaster .

# Run container
docker run -p 3000:3000 edumaster
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier (configured)
- Write meaningful commit messages
- Add tests for new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Lucide](https://lucide.dev) - Icon library
- [Recharts](https://recharts.org) - Charting library

## Support

- **Documentation**: [docs.edumaster.com](https://docs.edumaster.com)
- **Email**: support@edumaster.com
- **Discord**: [Join our community](https://discord.gg/edumaster)
- **Issues**: [GitHub Issues](https://github.com/yourusername/edumaster/issues)

## Roadmap

- [ ] Parent portal
- [ ] Mobile apps (iOS/Android)
- [ ] SMS notifications
- [ ] Advanced analytics
- [ ] AI-powered insights
- [ ] Integration marketplace
- [ ] Multi-language support
- [ ] Video conferencing integration

## Status

- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: 2024
- **Maintained**: Yes

# Project Mission

Our mission is to build a smart, dynamic school management system that leverages automated data aggregation and intelligent UI techniques to generate, display, and manage student report cards. The system ensures:

- **Accurate, real-time academic data**: All grades, ranks, and statistics are fetched and calculated directly from the backend, eliminating manual errors.
- **Dynamic mapping**: Sequences, terms, and academic years are mapped automatically based on database structure, supporting any curriculum or school setup.
- **Consistent, intelligent UI**: Every report card view (list, modal, print) uses a unified, data-driven approach for displaying performance, rank, attendance, and analytics.
- **Advanced filtering and analytics**: Users can filter, analyze, and export report cards using smart, context-aware tools.
- **Automation and reliability**: The system minimizes manual intervention, using smart techniques to ensure data integrity and ease of use for all stakeholders.

This approach empowers schools to manage academic records efficiently, with confidence in the accuracy and intelligence of every report card generated.
