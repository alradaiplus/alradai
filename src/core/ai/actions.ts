import { aiGateway, AIMessage } from '@/src/ai/gateway';
import { buildRAGContext } from './rag';

export type AIActionType = 'summarize' | 'extend' | 'critique' | 'link' | 'generate_children';

export interface AIAction {
  type: AIActionType;
  label: string;
  description: string;
  icon: string;
}

export const AI_ACTIONS: AIAction[] = [
  {
    type: 'summarize',
    label: 'Summarize',
    description: 'Create a concise summary of this block',
    icon: '📋',
  },
  {
    type: 'extend',
    label: 'Extend',
    description: 'Add more details and context',
    icon: '📝',
  },
  {
    type: 'critique',
    label: 'Critique',
    description: 'Analyze and provide feedback',
    icon: '🔍',
  },
  {
    type: 'link',
    label: 'Find Links',
    description: 'Suggest related blocks',
    icon: '🔗',
  },
  {
    type: 'generate_children',
    label: 'Generate Children',
    description: 'Create sub-points or related ideas',
    icon: '🌳',
  },
];

/**
 * Execute AI action on a block
 */
export async function executeAIAction(
  actionType: AIActionType,
  workspaceId: string,
  blockContent: string,
  blockTitle: string
): Promise<string> {
  const { context, citations } = await buildRAGContext(workspaceId, blockTitle);

  const prompts: Record<AIActionType, string> = {
    summarize: `Summarize the following block in 2-3 sentences:\n\n${blockContent}\n\nContext:\n${context}`,
    extend: `Expand on the following block with additional details and insights:\n\n${blockContent}\n\nContext:\n${context}`,
    critique: `Provide constructive feedback and analysis of:\n\n${blockContent}\n\nContext:\n${context}`,
    link: `Suggest 3-5 related blocks or topics that connect to:\n\n${blockContent}\n\nContext:\n${context}`,
    generate_children: `Generate 3-5 sub-points or related ideas for:\n\n${blockContent}\n\nContext:\n${context}`,
  };

  const messages: AIMessage[] = [
    {
      role: 'user',
      content: prompts[actionType],
    },
  ];

  const result = await aiGateway.complete({
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
    maxTokens: 1000,
  });

  return result.content;
}

/**
 * Stream AI action result
 */
export async function* streamAIAction(
  actionType: AIActionType,
  workspaceId: string,
  blockContent: string,
  blockTitle: string
): AsyncGenerator<string> {
  const { context } = await buildRAGContext(workspaceId, blockTitle);

  const prompts: Record<AIActionType, string> = {
    summarize: `Summarize the following block in 2-3 sentences:\n\n${blockContent}\n\nContext:\n${context}`,
    extend: `Expand on the following block with additional details and insights:\n\n${blockContent}\n\nContext:\n${context}`,
    critique: `Provide constructive feedback and analysis of:\n\n${blockContent}\n\nContext:\n${context}`,
    link: `Suggest 3-5 related blocks or topics that connect to:\n\n${blockContent}\n\nContext:\n${context}`,
    generate_children: `Generate 3-5 sub-points or related ideas for:\n\n${blockContent}\n\nContext:\n${context}`,
  };

  const messages: AIMessage[] = [
    {
      role: 'user',
      content: prompts[actionType],
    },
  ];

  for await (const chunk of aiGateway.completeStream({
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
    maxTokens: 1000,
  })) {
    yield chunk;
  }
}
