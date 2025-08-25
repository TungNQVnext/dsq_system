// Main API services export
export { apiClient } from './client';
export { AuthService } from '../auth/authService';
export { UserService } from './userService';
export { CallNumberService } from './callNumberService';
export { PrintingService } from './printingService';

// Re-export for convenience
export const api = {
  auth: AuthService,
  users: UserService,
  callNumbers: CallNumberService,
  printing: PrintingService,
};
