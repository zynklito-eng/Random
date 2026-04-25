export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export interface User {
  email: string;
  name?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: number;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  subscriptionName: string;
  price: number;
  imageUrl?: string;
  status: 'Available' | 'Sold Out';
  createdAt: number;
  updatedAt: number;
}

export interface Conversation {
  id?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  lastMessage?: string;
}

export interface Message {
  id?: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  createdAt: number;
}
