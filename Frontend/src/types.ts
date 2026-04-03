export type Role = 'admin' | 'operator' | 'viewer';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  lastLogin?: string;
  needsRoleSelection?: boolean;
};

export type View =
  | 'home'
  | 'dashboard'
  | 'map'
  | 'health'
  | 'export'
  | 'carbon'
  | 'admin'
  | 'rootRitual'
  | 'adminUsers'
  | 'profile'
  | 'provenance'
  | 'exportRecipes'
  | 'fleet';
