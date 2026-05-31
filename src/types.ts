/**
 * Shared Type Definitions for Task Manager App
 */

export type TaskStage = 'Todo' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Server-only representation
  salt: string;         // Server-only representation
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  stage: TaskStage;
  priority: TaskPriority;
  dueDate?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

// Client Safe User
export interface UserDTO {
  id: string;
  username: string;
  createdAt: string;
}

// Responses
export interface AuthResponse {
  user: UserDTO;
  token: string;
}

export interface APIErrorResponse {
  error: string;
}
