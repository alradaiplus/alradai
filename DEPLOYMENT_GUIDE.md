# AlRadai+ Deployment Guide

## Prerequisites

1. **Supabase Project**
   - Create a project at https://supabase.com
   - Get your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **AI Provider Keys**
   - OpenAI API key: https://platform.openai.com/api-keys
   - Anthropic API key: https://console.anthropic.com

3. **Stripe Account** (for billing)
   - Create account at https://stripe.com
   - Get your `STRIPE_SECRET_KEY`

4. **Vercel Account** (for hosting)
   - Sign up at https://vercel.com
   - Connect your GitHub repository

## Database Setup

### 1. Create Supabase Tables

Run the following SQL in your Supabase SQL editor:

```sql
-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Blocks (core data model)
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  source TEXT,
  tags TEXT[],
  links TEXT[],
  attachments JSONB,
  tokens TEXT[],
  agent_summary TEXT,
  archived_at TIMESTAMP,
  inbox INT DEFAULT 0,
  pinned_today INT DEFAULT 0
);

-- Embeddings for semantic search
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id TEXT REFERENCES blocks(id),
  workspace_id UUID REFERENCES workspaces(id),
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index for embeddings
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);

-- Boards
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  title TEXT NOT NULL,
  topic TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  origin TEXT,
  prompt TEXT,
  expires_at TIMESTAMP,
  clusters JSONB
);

-- Board nodes
CREATE TABLE IF NOT EXISTS board_nodes (
  id TEXT PRIMARY KEY,
  board_id TEXT REFERENCES boards(id),
  block_id TEXT REFERENCES blocks(id),
  x FLOAT,
  y FLOAT,
  cluster TEXT
);

-- Board edges
CREATE TABLE IF NOT EXISTS board_edges (
  id TEXT PRIMARY KEY,
  board_id TEXT REFERENCES boards(id),
  from_block_id TEXT REFERENCES blocks(id),
  to_block_id TEXT REFERENCES blocks(id),
  label TEXT
);

-- Chat nodes
CREATE TABLE IF NOT EXISTS chat_nodes (
  id TEXT PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  block_id TEXT REFERENCES blocks(id),
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  chat_node_id TEXT REFERENCES chat_nodes(id),
  role TEXT,
  content TEXT,
  tokens INT,
  cost_usd FLOAT,
  citations JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agent runs
CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  kind TEXT,
  ran_at TIMESTAMP,
  provider TEXT,
  model TEXT,
  prompt_tokens INT,
  output_tokens INT,
  cost_usd FLOAT,
  result_block_id TEXT,
  ok INT,
  err TEXT
);

-- Stripe customers
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stripe_customer_id TEXT UNIQUE,
  email TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMP
);

-- Workspace members
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'editor',
  joined_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read blocks in their workspace" ON blocks
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert blocks in their workspace" ON blocks
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
```

### 2. Set Environment Variables

Create a `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Deployment to Vercel

### 1. Connect Repository

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the `Noter` branch

### 2. Configure Environment Variables

In Vercel project settings, add all variables from `.env.local`

### 3. Deploy

```bash
# Vercel will automatically deploy on push
git push origin Noter
```

## Post-Deployment

### 1. Set Up Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Subscribe to events: `customer.subscription.updated`, `customer.subscription.deleted`

### 2. Configure OAuth

1. Go to Supabase → Authentication → Providers
2. Enable GitHub and Google OAuth
3. Add callback URL: `https://your-domain.com/auth/callback`

### 3. Monitor Production

- Set up Sentry for error tracking
- Configure Vercel analytics
- Monitor Supabase metrics

## Troubleshooting

### Build Fails

- Check environment variables are set in Vercel
- Verify Supabase URL format
- Run `npm run typecheck` locally

### Database Connection Issues

- Verify Supabase URL and key
- Check RLS policies are correct
- Ensure tables are created

### AI Features Not Working

- Verify API keys are valid
- Check rate limits
- Review error logs in Vercel

## Scaling Considerations

1. **Database**: Use Supabase connection pooling for high concurrency
2. **Embeddings**: Consider using pgvector with proper indexing
3. **Real-time**: Monitor Supabase Realtime connections
4. **Storage**: Use Supabase Storage for large files
5. **Caching**: Implement Redis for session management

## Support

For issues or questions:
- GitHub Issues: https://github.com/alradaiplus/alradai/issues
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
