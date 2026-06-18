import { supabase } from '@/src/core/supabase';

export interface ChatMessage {
  id: string;
  chatNodeId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  costUsd?: number;
  citations?: Array<{ blockId: string; title: string }>;
  createdAt: number;
}

export interface ChatNode {
  id: string;
  workspaceId: string;
  blockId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Create a new chat node
 */
export async function createChatNode(
  workspaceId: string,
  blockId: string,
  title: string
): Promise<ChatNode> {
  const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await supabase
    .from('chat_nodes')
    .insert([{
      id,
      workspace_id: workspaceId,
      block_id: blockId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    blockId: data.block_id,
    title: data.title,
    messages: [],
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

/**
 * Get chat node by ID
 */
export async function getChatNode(chatNodeId: string): Promise<ChatNode | null> {
  const { data: chatNode, error: nodeError } = await supabase
    .from('chat_nodes')
    .select('*')
    .eq('id', chatNodeId)
    .single();

  if (nodeError) return null;

  // Fetch messages
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_node_id', chatNodeId)
    .order('created_at', { ascending: true });

  return {
    id: chatNode.id,
    workspaceId: chatNode.workspace_id,
    blockId: chatNode.block_id,
    title: chatNode.title,
    messages: (messages || []).map(m => ({
      id: m.id,
      chatNodeId: m.chat_node_id,
      role: m.role,
      content: m.content,
      tokens: m.tokens,
      costUsd: m.cost_usd,
      citations: m.citations,
      createdAt: new Date(m.created_at).getTime(),
    })),
    createdAt: new Date(chatNode.created_at).getTime(),
    updatedAt: new Date(chatNode.updated_at).getTime(),
  };
}

/**
 * Add message to chat node
 */
export async function addChatMessage(
  chatNodeId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  tokens?: number,
  costUsd?: number,
  citations?: Array<{ blockId: string; title: string }>
): Promise<ChatMessage> {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{
      id,
      chat_node_id: chatNodeId,
      role,
      content,
      tokens,
      cost_usd: costUsd,
      citations,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    chatNodeId: data.chat_node_id,
    role: data.role,
    content: data.content,
    tokens: data.tokens,
    costUsd: data.cost_usd,
    citations: data.citations,
    createdAt: new Date(data.created_at).getTime(),
  };
}

/**
 * Get chat history for context
 */
export async function getChatHistory(chatNodeId: string, limit: number = 10): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_node_id', chatNodeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return data
    .reverse()
    .map(m => ({
      id: m.id,
      chatNodeId: m.chat_node_id,
      role: m.role,
      content: m.content,
      tokens: m.tokens,
      costUsd: m.cost_usd,
      citations: m.citations,
      createdAt: new Date(m.created_at).getTime(),
    }));
}

/**
 * Get all chat nodes in workspace
 */
export async function getChatNodes(workspaceId: string): Promise<ChatNode[]> {
  const { data, error } = await supabase
    .from('chat_nodes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return data.map(cn => ({
    id: cn.id,
    workspaceId: cn.workspace_id,
    blockId: cn.block_id,
    title: cn.title,
    messages: [],
    createdAt: new Date(cn.created_at).getTime(),
    updatedAt: new Date(cn.updated_at).getTime(),
  }));
}
