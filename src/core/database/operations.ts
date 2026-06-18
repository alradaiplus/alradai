import { supabase } from '@/src/core/supabase';
import { Database, DatabaseView, Property, DatabaseRow } from './types';

/**
 * Create a new database
 */
export async function createDatabase(
  workspaceId: string,
  name: string,
  description?: string
): Promise<Database> {
  const id = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const { data, error } = await supabase
    .from('databases')
    .insert([{
      id,
      workspace_id: workspaceId,
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    name: data.name,
    description: data.description,
    properties: [],
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

/**
 * Get database by ID
 */
export async function getDatabase(databaseId: string): Promise<Database | null> {
  const { data, error } = await supabase
    .from('databases')
    .select('*')
    .eq('id', databaseId)
    .single();

  if (error) return null;

  // Fetch properties
  const { data: properties } = await supabase
    .from('database_properties')
    .select('*')
    .eq('database_id', databaseId)
    .order('order', { ascending: true });

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    name: data.name,
    description: data.description,
    properties: (properties || []).map(p => ({
      id: p.id,
      databaseId: p.database_id,
      name: p.name,
      type: p.type,
      config: p.config,
      order: p.order,
      createdAt: new Date(p.created_at).getTime(),
    })),
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

/**
 * Add property to database
 */
export async function addProperty(
  databaseId: string,
  name: string,
  type: string,
  config?: Record<string, unknown>
): Promise<Property> {
  const id = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Get current max order
  const { data: existing } = await supabase
    .from('database_properties')
    .select('order')
    .eq('database_id', databaseId)
    .order('order', { ascending: false })
    .limit(1);

  const order = (existing?.[0]?.order ?? -1) + 1;

  const { data, error } = await supabase
    .from('database_properties')
    .insert([{
      id,
      database_id: databaseId,
      name,
      type,
      config: config || {},
      order,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    databaseId: data.database_id,
    name: data.name,
    type: data.type,
    config: data.config,
    order: data.order,
    createdAt: new Date(data.created_at).getTime(),
  };
}

/**
 * Create database row
 */
export async function createDatabaseRow(
  databaseId: string,
  blockId: string,
  values: Record<string, unknown>
): Promise<DatabaseRow> {
  const id = `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await supabase
    .from('database_rows')
    .insert([{
      id,
      database_id: databaseId,
      block_id: blockId,
      values,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    databaseId: data.database_id,
    blockId: data.block_id,
    values: data.values,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

/**
 * Get database rows
 */
export async function getDatabaseRows(databaseId: string): Promise<DatabaseRow[]> {
  const { data, error } = await supabase
    .from('database_rows')
    .select('*')
    .eq('database_id', databaseId);

  if (error) return [];

  return data.map(row => ({
    id: row.id,
    databaseId: row.database_id,
    blockId: row.block_id,
    values: row.values,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

/**
 * Update database row
 */
export async function updateDatabaseRow(
  rowId: string,
  values: Record<string, unknown>
): Promise<DatabaseRow> {
  const { data, error } = await supabase
    .from('database_rows')
    .update({
      values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rowId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    databaseId: data.database_id,
    blockId: data.block_id,
    values: data.values,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

/**
 * Create database view
 */
export async function createDatabaseView(
  databaseId: string,
  name: string,
  type: string,
  config?: Record<string, unknown>
): Promise<DatabaseView> {
  const id = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await supabase
    .from('database_views')
    .insert([{
      id,
      database_id: databaseId,
      name,
      type,
      config: config || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    databaseId: data.database_id,
    name: data.name,
    type: data.type,
    config: data.config,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

/**
 * Get database views
 */
export async function getDatabaseViews(databaseId: string): Promise<DatabaseView[]> {
  const { data, error } = await supabase
    .from('database_views')
    .select('*')
    .eq('database_id', databaseId);

  if (error) return [];

  return data.map(view => ({
    id: view.id,
    databaseId: view.database_id,
    name: view.name,
    type: view.type,
    config: view.config,
    createdAt: new Date(view.created_at).getTime(),
    updatedAt: new Date(view.updated_at).getTime(),
  }));
}
