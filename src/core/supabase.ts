import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not set. Running in offline mode.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workspaces']['Row']>;
      };
      blocks: {
        Row: {
          id: string;
          workspace_id: string;
          body: string;
          created_at: string;
          updated_at: string;
          source: 'manual' | 'capture' | 'voice' | 'share' | 'agent';
          tags: string[];
          links: string[];
          attachments: Record<string, unknown>[];
          tokens: string[];
          agent_summary: string | null;
          archived_at: string | null;
          inbox: number;
          pinned_today: number;
        };
        Insert: Omit<Database['public']['Tables']['blocks']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['blocks']['Row']>;
      };
      boards: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          topic: string;
          created_at: string;
          origin: 'agent' | 'manual';
          prompt: string;
          expires_at: string;
          clusters: Record<string, unknown>[];
        };
        Insert: Omit<Database['public']['Tables']['boards']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['boards']['Row']>;
      };
      agent_runs: {
        Row: {
          id: string;
          workspace_id: string;
          kind: 'recall' | 'synthesis' | 'contradiction' | 'thread' | 'board' | 'embed';
          ran_at: string;
          provider: string;
          model: string;
          prompt_tokens: number | null;
          output_tokens: number | null;
          cost_usd: number | null;
          result_block_id: string | null;
          ok: number;
          err: string | null;
        };
        Insert: Omit<Database['public']['Tables']['agent_runs']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['agent_runs']['Row']>;
      };
    };
  };
};

// Helper to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

// Helper to get current workspace
export async function getCurrentWorkspace(userId: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', userId)
    .single();
  return { workspace: data, error };
}

// Helper to ensure workspace exists
export async function ensureWorkspace(userId: string, workspaceName: string = 'Default') {
  const { workspace, error: fetchError } = await getCurrentWorkspace(userId);
  
  if (workspace) {
    return { workspace, created: false };
  }

  if (fetchError?.code === 'PGRST116') {
    // No workspace found, create one
    const { data, error: createError } = await supabase
      .from('workspaces')
      .insert([{ owner_id: userId, name: workspaceName }])
      .select()
      .single();

    return { workspace: data, error: createError, created: true };
  }

  return { workspace: null, error: fetchError, created: false };
}
