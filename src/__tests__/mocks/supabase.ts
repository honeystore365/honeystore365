import { jest } from '@jest/globals'

// Mock Supabase client
export const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  delete: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  neq: jest.fn(() => mockSupabaseClient),
  gt: jest.fn(() => mockSupabaseClient),
  gte: jest.fn(() => mockSupabaseClient),
  lt: jest.fn(() => mockSupabaseClient),
  lte: jest.fn(() => mockSupabaseClient),
  like: jest.fn(() => mockSupabaseClient),
  ilike: jest.fn(() => mockSupabaseClient),
  is: jest.fn(() => mockSupabaseClient),
  in: jest.fn(() => mockSupabaseClient),
  contains: jest.fn(() => mockSupabaseClient),
  containedBy: jest.fn(() => mockSupabaseClient),
  rangeGt: jest.fn(() => mockSupabaseClient),
  rangeGte: jest.fn(() => mockSupabaseClient),
  rangeLt: jest.fn(() => mockSupabaseClient),
  rangeLte: jest.fn(() => mockSupabaseClient),
  rangeAdjacent: jest.fn(() => mockSupabaseClient),
  overlaps: jest.fn(() => mockSupabaseClient),
  textSearch: jest.fn(() => mockSupabaseClient),
  match: jest.fn(() => mockSupabaseClient),
  not: jest.fn(() => mockSupabaseClient),
  or: jest.fn(() => mockSupabaseClient),
  filter: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  abortSignal: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() => mockSupabaseClient),
  maybeSingle: jest.fn(() => mockSupabaseClient),
  csv: jest.fn(() => mockSupabaseClient),
  geojson: jest.fn(() => mockSupabaseClient),
  explain: jest.fn(() => mockSupabaseClient),
  rollback: jest.fn(() => mockSupabaseClient),
  returns: jest.fn(() => mockSupabaseClient),
  then: jest.fn(),
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
}

// Mock successful responses
export const mockSuccessResponse = <T>(data: T) => ({
  data,
  error: null,
  status: 200,
  statusText: 'OK',
})

// Mock error responses
export const mockErrorResponse = (message: string, code?: string) => ({
  data: null,
  error: {
    message,
    code: code || 'UNKNOWN_ERROR',
    details: null,
    hint: null,
  },
  status: 400,
  statusText: 'Bad Request',
})

// Mock auth responses
export const mockAuthUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    firstName: 'Test',
    lastName: 'User',
  },
  app_metadata: {
    role: 'customer',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockAuthSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockAuthUser,
}

// Reset all mocks
export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset()
    }
  })
  
  if (mockSupabaseClient.auth.getSession.mockReset) {
    mockSupabaseClient.auth.getSession.mockReset()
  }
  if (mockSupabaseClient.auth.getUser.mockReset) {
    mockSupabaseClient.auth.getUser.mockReset()
  }
}

// Mock the Supabase client creation
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))