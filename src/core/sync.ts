import { supabase } from './supabase';
import { db } from './db';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncQueue {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

class SyncManager {
  private queue: SyncQueue[] = [];
  private isOnline = navigator.onLine;
  private syncing = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.sync();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Queue an operation for sync
   */
  async queueOperation(table: string, action: 'insert' | 'update' | 'delete', data: Record<string, unknown>) {
    const operation: SyncQueue = {
      id: `${table}-${Date.now()}-${Math.random()}`,
      table,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(operation);

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.sync();
    }

    return operation.id;
  }

  /**
   * Sync queued operations to Supabase
   */
  async sync() {
    if (this.syncing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.syncing = true;

    try {
      const operations = [...this.queue];
      const successful: string[] = [];

      for (const op of operations) {
        try {
          await this.syncOperation(op);
          successful.push(op.id);
        } catch (error) {
          op.retries++;
          if (op.retries > 3) {
            console.error(`Failed to sync ${op.table} after 3 retries:`, error);
            successful.push(op.id); // Remove from queue even on failure
          }
        }
      }

      // Remove successful operations from queue
      this.queue = this.queue.filter(op => !successful.includes(op.id));
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(op: SyncQueue) {
    const { table, action, data } = op;

    if (action === 'insert') {
      const { error } = await supabase.from(table).insert([data]);
      if (error) throw error;
    } else if (action === 'update') {
      const { id, ...updateData } = data;
      const { error } = await supabase.from(table).update(updateData).eq('id', id);
      if (error) throw error;
    } else if (action === 'delete') {
      const { id } = data;
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    }
  }

  /**
   * Subscribe to realtime changes for a table
   */
  subscribeToTable(table: string, workspaceId: string, onUpdate: (data: any) => void) {
    const subscription = supabase
      .channel(`${table}:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    if (!this.isOnline) return 'error';
    if (this.syncing) return 'syncing';
    if (this.queue.length === 0) return 'synced';
    return 'idle';
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.queue.length;
  }
}

export const syncManager = new SyncManager();

/**
 * Optimistic update: update local state immediately, sync to server in background
 */
export async function optimisticUpdate(
  table: string,
  id: string,
  data: Record<string, unknown>,
  localUpdate: () => void
) {
  // Update local state immediately
  localUpdate();

  // Queue sync operation
  await syncManager.queueOperation(table, 'update', { id, ...data });
}

/**
 * Optimistic insert: insert to local DB immediately, sync to server in background
 */
export async function optimisticInsert(
  table: string,
  data: Record<string, unknown>,
  localInsert: () => void
) {
  // Insert to local DB immediately
  localInsert();

  // Queue sync operation
  await syncManager.queueOperation(table, 'insert', data);
}

/**
 * Optimistic delete: delete from local DB immediately, sync to server in background
 */
export async function optimisticDelete(
  table: string,
  id: string,
  localDelete: () => void
) {
  // Delete from local DB immediately
  localDelete();

  // Queue sync operation
  await syncManager.queueOperation(table, 'delete', { id });
}
