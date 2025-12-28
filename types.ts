
export type Role = 'user' | 'assistant';

export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  sources?: Source[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastModified: Date;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  prompt: string;
}
