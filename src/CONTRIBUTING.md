
# Contributing to EduMaster

First off, thank you for considering contributing to EduMaster! It's people like you that make EduMaster such a great tool for educational institutions worldwide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Collaborative**: Work together and help each other
- **Be Professional**: Keep discussions focused and constructive
- **Be Inclusive**: Welcome contributors from all backgrounds

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git
- Supabase account
- Code editor (VS Code recommended)

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/edumaster.git
   cd edumaster
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/edumaster.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Development Process

### Branching Strategy

We use Git Flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
# Update your local develop branch
git checkout develop
git pull upstream develop

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write Clean Code**
   - Follow TypeScript best practices
   - Use meaningful variable/function names
   - Add comments for complex logic
   - Keep functions small and focused

2. **Test Your Changes**
   - Test manually in the browser
   - Add unit tests for new functions
   - Ensure existing tests pass

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add password reset functionality
fix(dashboard): resolve student count calculation bug
docs(readme): update installation instructions
style(components): format Button component
refactor(api): simplify data fetching logic
test(utils): add tests for date formatting
chore(deps): update dependencies
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout feature/your-feature
   git rebase develop
   ```

2. **Run tests**
   ```bash
   npm test
   npm run lint
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

### Submitting a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature
   ```

2. **Create Pull Request**
   - Go to GitHub and click "New Pull Request"
   - Select your branch
   - Fill out the PR template

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Manual testing completed
   - [ ] Unit tests added/updated
   - [ ] All tests passing

   ## Screenshots (if applicable)
   Add screenshots here

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs automatically
   - Linting and tests must pass

2. **Code Review**
   - At least one maintainer review required
   - Address all feedback
   - Make requested changes

3. **Approval & Merge**
   - Once approved, maintainer will merge
   - Delete your branch after merge

## 📝 Coding Standards

### TypeScript

```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
}

export function getUserById(id: string): User | null {
  // Implementation
}

// ❌ Bad
function getUser(id: any): any {
  // Implementation
}
```

### React Components

```typescript
// ✅ Good - Named export, TypeScript, clear props
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  )
}

// ❌ Bad - Default export, no types
export default function Button(props) {
  return <button onClick={props.onClick}>{props.label}</button>
}
```

### File Organization

```
src/
├── components/
│   ├── ui/              # Base UI components
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── pages/               # Page components
├── hooks/               # Custom hooks
├── utils/               # Utility functions
└── types/               # TypeScript types
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserProfile`)
- **Files**: Match component name (`UserProfile.tsx`)

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use trailing commas
- Max line length: 100 characters

## 🧪 Testing Guidelines

### Unit Tests

```typescript
// Example test
import { formatCurrency } from './utils'

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000')
  })

  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0')
  })
})
```

### Integration Tests

- Test user flows
- Test component interactions
- Test API integrations

### Manual Testing Checklist

- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Test with different user roles
- [ ] Test error scenarios
- [ ] Test edge cases

## 📚 Documentation

### Code Comments

```typescript
/**
 * Calculates the average grade for a student
 * @param grades - Array of numerical grades
 * @returns Average grade rounded to 2 decimal places
 */
export function calculateAverage(grades: number[]): number {
  if (grades.length === 0) return 0
  const sum = grades.reduce((acc, grade) => acc + grade, 0)
  return Math.round((sum / grades.length) * 100) / 100
}
```

### Component Documentation

```typescript
/**
 * Button Component
 * 
 * A reusable button component with multiple variants
 * 
 * @example
 * ```tsx
 * <Button 
 *   label="Click me" 
 *   onClick={() => console.log('clicked')}
 *   variant="primary"
 * />
 * ```
 */
```

### README Updates

- Update README.md if you add new features
- Add examples for new functionality
- Update configuration docs if needed

## 🐛 Bug Reports

### Before Reporting

1. Search existing issues
2. Try to reproduce the bug
3. Gather relevant information

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Version: 1.0.0

## Screenshots
Add screenshots if applicable

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem it Solves
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other solutions you've thought about

## Additional Context
Any other relevant information
```

## 🎯 Areas for Contribution

### Good First Issues

- Documentation improvements
- UI/UX enhancements
- Bug fixes
- Test coverage
- Code refactoring

### High Priority

- Performance optimizations
- Accessibility improvements
- Mobile responsiveness
- Security enhancements

### Feature Requests

- Parent portal
- SMS notifications
- Advanced reporting
- API integrations

## 📞 Getting Help

- **Discord**: [Join our community](https://discord.gg/edumaster)
- **Email**: dev@edumaster.com
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/edumaster/discussions)

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to contributor meetings
- Given contributor badge on Discord

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to EduMaster! 🎓
