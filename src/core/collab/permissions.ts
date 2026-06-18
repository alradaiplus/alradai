import { supabase } from '@/src/core/supabase';

export type Role = 'owner' | 'editor' | 'commenter' | 'viewer';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  owner: ['read', 'write', 'delete', 'share', 'manage_members', 'manage_permissions'],
  editor: ['read', 'write', 'comment', 'mention'],
  commenter: ['read', 'comment', 'mention'],
  viewer: ['read'],
};

/**
 * Check if user has permission
 */
export function hasPermission(userRole: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

/**
 * Add member to workspace
 */
export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: Role
): Promise<void> {
  const { error } = await supabase
    .from('workspace_members')
    .insert([{
      workspace_id: workspaceId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
    }]);

  if (error) throw error;
}

/**
 * Get user role in workspace
 */
export async function getUserRole(
  workspaceId: string,
  userId: string
): Promise<Role | null> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data?.role || null;
}

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*, users(email, full_name)')
    .eq('workspace_id', workspaceId);

  if (error) return [];
  return data || [];
}

/**
 * Update member role
 */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: Role
): Promise<void> {
  const { error } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Remove member from workspace
 */
export async function removeMember(
  workspaceId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Create share link
 */
export async function createShareLink(
  workspaceId: string,
  role: Role,
  expiresIn?: number // minutes
): Promise<string> {
  const token = generateToken();
  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 60000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('share_links')
    .insert([{
      workspace_id: workspaceId,
      token,
      role,
      expires_at: expiresAt,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return token;
}

/**
 * Validate share link
 */
export async function validateShareLink(token: string): Promise<{ workspaceId: string; role: Role } | null> {
  const { data, error } = await supabase
    .from('share_links')
    .select('workspace_id, role, expires_at')
    .eq('token', token)
    .single();

  if (error) return null;

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return {
    workspaceId: data.workspace_id,
    role: data.role,
  };
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  workspaceId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  await supabase
    .from('audit_log')
    .insert([{
      workspace_id: workspaceId,
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      changes,
      created_at: new Date().toISOString(),
    }]);
}

/**
 * Get audit log
 */
export async function getAuditLog(workspaceId: string, limit: number = 100) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

/**
 * Generate secure token
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
