import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type AIProvider = 'openai' | 'anthropic' | 'openrouter';
export type AIModel = 'gpt-4o' | 'gpt-4-turbo' | 'claude-opus-4' | 'claude-sonnet-4';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AICompletionOptions {
  model: AIModel;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
}

export interface AICompletionResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
}

// Token pricing (as of 2026)
const PRICING: Record<AIModel, { input: number; output: number }> = {
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'claude-opus-4': { input: 0.015, output: 0.045 },
  'claude-sonnet-4': { input: 0.003, output: 0.015 },
};

class AIGateway {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  private getProviderFromModel(model: AIModel): AIProvider {
    if (model.startsWith('gpt')) return 'openai';
    if (model.startsWith('claude')) return 'anthropic';
    return 'openrouter';
  }

  private calculateCost(model: AIModel, promptTokens: number, completionTokens: number): number {
    const pricing = PRICING[model];
    return (promptTokens * pricing.input + completionTokens * pricing.output) / 1000;
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const provider = this.getProviderFromModel(options.model);
    const messages = options.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }, ...options.messages]
      : options.messages;

    if (provider === 'openai') {
      if (!this.openai) throw new Error('OpenAI API key not configured');
      
      const response = await this.openai.chat.completions.create({
        model: options.model === 'gpt-4o' ? 'gpt-4o' : 'gpt-4-turbo-preview',
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const cost = this.calculateCost(options.model, usage.prompt_tokens, usage.completion_tokens);

      return {
        content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        cost,
      };
    }

    if (provider === 'anthropic') {
      if (!this.anthropic) throw new Error('Anthropic API key not configured');

      const response = await this.anthropic.messages.create({
        model: options.model === 'claude-opus-4' ? 'claude-opus-4-1-20250805' : 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens ?? 2000,
        temperature: options.temperature ?? 0.7,
        system: options.systemPrompt,
        messages: messages.filter(m => m.role !== 'system') as Anthropic.MessageParam[],
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const usage = response.usage || { input_tokens: 0, output_tokens: 0 };
      const cost = this.calculateCost(options.model, usage.input_tokens, usage.output_tokens);

      return {
        content,
        usage: {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
        },
        cost,
      };
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  async *completeStream(options: AICompletionOptions): AsyncGenerator<string> {
    const provider = this.getProviderFromModel(options.model);
    const messages = options.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }, ...options.messages]
      : options.messages;

    if (provider === 'openai') {
      if (!this.openai) throw new Error('OpenAI API key not configured');

      const stream = await this.openai.chat.completions.create({
        model: options.model === 'gpt-4o' ? 'gpt-4o' : 'gpt-4-turbo-preview',
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) yield content;
      }
    } else if (provider === 'anthropic') {
      if (!this.anthropic) throw new Error('Anthropic API key not configured');

      const stream = await this.anthropic.messages.stream({
        model: options.model === 'claude-opus-4' ? 'claude-opus-4-1-20250805' : 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens ?? 2000,
        temperature: options.temperature ?? 0.7,
        system: options.systemPrompt,
        messages: messages.filter(m => m.role !== 'system') as Anthropic.MessageParam[],
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}

export const aiGateway = new AIGateway();
