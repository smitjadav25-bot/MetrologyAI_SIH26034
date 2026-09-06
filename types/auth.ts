export type UserRole = 'ADMIN' | 'INSPECTOR';

export interface InspectorUser {
  id: string;
  officerId: string;
  name: string;
  email: string;
  passwordHash: string;
  designation: string;
  jurisdiction: string;
  role: UserRole;
  createdAt: string;
}

export type SafeInspector = Omit<InspectorUser, 'passwordHash'>;

export interface AuthSessionPayload {
  inspectorId: string;
  officerId: string;
  email: string;
  name: string;
  designation: string;
  jurisdiction: string;
  role: UserRole;
  exp?: number;
  iat?: number;
}

export interface RegisterInspectorInput {
  name: string;
  officerId: string;
  designation: string;
  jurisdiction: string;
  email: string;
  password: string;
}

export interface LoginInput {
  identifier: string; // email or officerId
  password: string;
}
