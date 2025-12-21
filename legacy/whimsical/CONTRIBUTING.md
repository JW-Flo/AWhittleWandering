# Contributing to A Whittle Wandering

Thank you for your interest in contributing to AWW! This guide will help you get started.

## Prerequisites

- **Node.js 20+** - JavaScript runtime
- **npm** - Package manager (comes with Node.js)
- **Deno 2.x** - For edge function development
- **Git** - Version control

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/a-whittle-wandering.git
cd a-whittle-wandering
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Fill in the required values. Note: The production environment is managed by Lovable Cloud.

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run preview` | Preview production build |

## Project Structure

```
├── src/
│   ├── components/     # React components
│   │   ├── ui/         # shadcn/ui primitives
│   │   ├── admin/      # Admin-only components
│   │   ├── journey/    # Journey features
│   │   ├── settings/   # User settings
│   │   └── social/     # Social features
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Route pages
│   ├── lib/            # Utility functions
│   └── integrations/   # External service clients
├── supabase/
│   ├── functions/      # Edge functions (Deno)
│   └── migrations/     # Database migrations
├── public/             # Static assets
└── docs/               # Documentation
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define explicit types for props and return values
- Avoid `any` - use `unknown` if type is truly unknown

### React Components

```typescript
// Use functional components with typed props
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent = ({ title, onAction }: MyComponentProps) => {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onAction}>Click me</button>
    </div>
  );
};
```

### Styling

- Use Tailwind CSS utility classes
- Use semantic design tokens (never raw colors)
- Use `cn()` utility for conditional classes:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-primary text-primary-foreground',
  isDisabled && 'opacity-50 cursor-not-allowed'
)} />
```

### Imports

Always use path aliases:

```typescript
// ✅ Good
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

// ❌ Bad
import { Button } from '../../../components/ui/button';
```

## Edge Function Development

Edge functions are written in TypeScript and run on Deno.

### Creating a New Edge Function

1. Create a new directory in `supabase/functions/`:

```bash
mkdir supabase/functions/my-function
```

2. Create `index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Your logic here
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Testing Edge Functions Locally

```bash
# Check syntax
deno check supabase/functions/my-function/index.ts

# Run locally (requires Supabase CLI)
supabase functions serve my-function --env-file .env
```

## Database Migrations

Migrations are managed through Lovable Cloud. To request a schema change:

1. Document the required SQL in your PR description
2. Include RLS policies for any new tables
3. A maintainer will apply the migration through the Lovable interface

### RLS Policy Requirements

All tables MUST have Row Level Security enabled with appropriate policies:

```sql
-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data"
ON my_table FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "Users can insert own data"
ON my_table FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Pull Request Guidelines

### Before Submitting

1. Run linting: `npm run lint`
2. Run type check: `npm run typecheck`
3. Build successfully: `npm run build`
4. Test your changes locally

### PR Title Format

Use conventional commit style:

- `feat: Add voice journal recording`
- `fix: Resolve timeline date sorting`
- `docs: Update API documentation`
- `refactor: Simplify auth hook`
- `chore: Update dependencies`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Database Changes (if applicable)
Include any required SQL migrations
```

## Self-Hosted GitHub Runner

This project uses a self-hosted GitHub Actions runner for CI/CD.

**Location**: `/Users/joe/actions-runner`

The runner executes:
- Build and lint checks on push/PR
- Edge function syntax validation
- Artifact uploads for successful builds

## Getting Help

- Check existing issues for similar problems
- Review the [Technical Documentation](docs/TECHNICAL.md)
- Read the [API Setup Guides](docs/API_SETUP_GUIDES.md)
- Check [E2E Test Scenarios](docs/E2E_TEST_SCENARIOS.md) for expected behavior

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
