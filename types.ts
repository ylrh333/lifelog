export enum MediaType {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE'
}

export type Language = 'zh' | 'en';

export interface UserProfile {
  name: string;
  avatar: string; // URL or base64
  language: Language;
}

export type ModelCapability = 'text' | 'image' | 'audio' | 'video';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapability[];
  description: string;
}

export interface UserModelConfig {
  modelId: string;
  apiKey: string;
  baseUrl?: string; // For compatible APIs like DeepSeek/OpenAI
}

export interface AIAnalysis {
  mood: string;
  summary: string;
  tags: string[];
  color: string;
  analyzedByModel?: string;
}

export interface Memory {
  id: string;
  createdAt: number;
  content: string; // User's text note
  mediaType: MediaType;
  mediaBlob?: Blob;
  mediaUrl?: string;
  aiAnalysis?: AIAnalysis;
  location?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  group: string; // based on mood or tag
  val: number; // relevance score
}

export interface GraphLink {
  source: string;
  target: string;
  reason: string; // Why are they connected?
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SupabaseConfig {
  url: string;
  key: string;
}

export interface StorageService {
  saveMemory(memory: Memory): Promise<void>;
  getMemories(): Promise<Memory[]>;
  deleteMemory(id: string): Promise<void>;
}