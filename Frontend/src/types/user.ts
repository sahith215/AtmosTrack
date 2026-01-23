export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  lastLogin?: string;
}
