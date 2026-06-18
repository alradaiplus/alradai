import { create } from 'zustand';
import { supabase, getCurrentUser, ensureWorkspace } from '@/src/core/supabase';

export type AuthState = {
  user: { id: string; email: string; full_name?: string } | null;
  workspace: { id: string; owner_id: string; name: string } | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<void>;
  signOut: () => Promise<void>;
  setError: (error: string | null) => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  workspace: null,
  loading: false,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const { user, error } = await getCurrentUser();
      
      if (error || !user) {
        set({ user: null, workspace: null, loading: false });
        return;
      }

      // Ensure workspace exists
      const { workspace, error: wsError } = await ensureWorkspace(user.id);
      
      if (wsError) {
        set({ 
          user: { id: user.id, email: user.email || '', full_name: user.user_metadata?.full_name },
          workspace: null,
          error: 'Failed to load workspace',
          loading: false 
        });
        return;
      }

      set({
        user: { id: user.id, email: user.email || '', full_name: user.user_metadata?.full_name },
        workspace: workspace as any,
        loading: false,
      });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create workspace for new user
        const { workspace } = await ensureWorkspace(data.user.id);
        set({
          user: { id: data.user.id, email: data.user.email || '', full_name: fullName },
          workspace: workspace as any,
          loading: false,
        });
      }
    } catch (err) {
      set({ error: String(err), loading: false });
      throw err;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { workspace } = await ensureWorkspace(data.user.id);
        set({
          user: { id: data.user.id, email: data.user.email || '', full_name: data.user.user_metadata?.full_name },
          workspace: workspace as any,
          loading: false,
        });
      }
    } catch (err) {
      set({ error: String(err), loading: false });
      throw err;
    }
  },

  signInWithOAuth: async (provider: 'github' | 'google') => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      set({ error: String(err), loading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, workspace: null, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
      throw err;
    }
  },

  setError: (error: string | null) => set({ error }),
}));
