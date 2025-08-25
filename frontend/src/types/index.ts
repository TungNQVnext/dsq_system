// Type definitions for the application

/**
 * User related types
 */
export interface User {
  username: string;
  role: 'admin' | 'staff';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  role: string;
}

export interface UserCreate {
  username: string;
  password: string;
  role: 'admin' | 'staff';
}

export interface UserUpdate {
  password?: string;
  role?: 'admin' | 'staff';
}

/**
 * Call Number related types
 */
export interface CallNumber {
  id: number;
  number: string;
  prefix: string;
  status: string;
  counter?: string;
  service_type?: string;
  created_date?: string;
  updated_date?: string;
}

export interface CallRequest {
  prefix: string;
  services: string[];
}

export interface TicketInfo {
  number: string;
  prefix: string;
  service_type: string;
  services: string[];
  timestamp: string;
  formatted_date: string;
  created_date: string;
  status: string;
}

/**
 * Printing related types
 */
export interface PrinterStatus {
  success: boolean;
  available: boolean;
  printers_info?: string;
  error?: string;
}

export interface PrintRequest {
  content: string;
  printer_name?: string;
}

/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

/**
 * Websocket message types
 */
export interface WebSocketMessage {
  type: string;
  data?: any;
}

export interface CallNumberUpdate {
  type: 'call_number_updated';
  data: {
    id: number;
    number: string;
    prefix: string;
    nationality: string;
    status: string;
    service_type?: string;
    created_date?: string;
    updated_date?: string;
  };
}
