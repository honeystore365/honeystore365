import { db } from './client';
import type { Database } from './client';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];

function generateId(): string {
  return crypto.randomUUID();
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hashPassword(password: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  return Array.from(new Uint8Array(data)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return hashPassword(password) === hash;
}

export interface TursoUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
}

export interface AuthResult {
  user: TursoUser | null;
  session: { token: string; expiresAt: string } | null;
  error: string | null;
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM customers WHERE email = ?',
      args: [email],
    });

    if (!result.rows || result.rows.length === 0) {
      return { user: null, session: null, error: 'Invalid email or password' };
    }

    const customer = result.rows[0] as unknown as CustomerRow;
    const isValid = await verifyPassword(password, customer.password_hash);

    if (!isValid) {
      return { user: null, session: null, error: 'Invalid email or password' };
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const sessionId = generateId();

    await db.execute({
      sql: `INSERT INTO sessions (id, customer_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [sessionId, customer.id, token, expiresAt],
    });

    const roleResult = await db.execute({
      sql: 'SELECT role FROM user_roles WHERE user_id = ?',
      args: [customer.id],
    });
    const role = roleResult.rows?.[0]?.role as string || 'customer';

    return {
      user: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        role,
        phone: customer.phone,
      },
      session: { token, expiresAt },
      error: null,
    };
  } catch (err: any) {
    return { user: null, session: null, error: err.message };
  }
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone?: string
): Promise<AuthResult> {
  try {
    const existing = await db.execute({
      sql: 'SELECT id FROM customers WHERE email = ?',
      args: [email],
    });

    if (existing.rows && existing.rows.length > 0) {
      return { user: null, session: null, error: 'Email already registered' };
    }

    const id = generateId();
    const passwordHash = hashPassword(password);

    await db.execute({
      sql: `INSERT INTO customers (id, email, first_name, last_name, phone, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [id, email, firstName, lastName, phone || null, passwordHash],
    });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const sessionId = generateId();

    await db.execute({
      sql: `INSERT INTO sessions (id, customer_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [sessionId, id, token, expiresAt],
    });

    return {
      user: {
        id,
        email,
        firstName,
        lastName,
        role: 'customer',
        phone: phone || null,
      },
      session: { token, expiresAt },
      error: null,
    };
  } catch (err: any) {
    return { user: null, session: null, error: err.message };
  }
}

export async function validateSession(token: string): Promise<TursoUser | null> {
  try {
    const result = await db.execute({
      sql: `SELECT s.*, c.email, c.first_name, c.last_name, c.phone 
            FROM sessions s 
            JOIN customers c ON s.customer_id = c.id 
            WHERE s.token = ? AND s.expires_at > datetime('now')`,
      args: [token],
    });

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as any;
    const roleResult = await db.execute({
      sql: 'SELECT role FROM user_roles WHERE user_id = ?',
      args: [row.customer_id],
    });
    const role = roleResult.rows?.[0]?.role as string || 'customer';

    return {
      id: row.customer_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role,
      phone: row.phone,
    };
  } catch {
    return null;
  }
}

export async function signOut(token: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM sessions WHERE token = ?',
    args: [token],
  });
}

export async function getCustomerById(id: string): Promise<CustomerRow | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM customers WHERE id = ?',
    args: [id],
  });
  return (result.rows?.[0] as unknown as CustomerRow) || null;
}

export function createPasswordResetCode(customerId: string, code: string): void {
  const id = generateId();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.execute({
    sql: `INSERT INTO password_reset_codes (id, customer_id, code, expires_at, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
    args: [id, customerId, code, expiresAt],
  });
}

export async function verifyResetCode(email: string, code: string): Promise<string | null> {
  const result = await db.execute({
    sql: `SELECT prc.customer_id FROM password_reset_codes prc
          JOIN customers c ON prc.customer_id = c.id
          WHERE c.email = ? AND prc.code = ? AND prc.expires_at > datetime('now')
          ORDER BY prc.created_at DESC LIMIT 1`,
    args: [email, code],
  });
  return (result.rows?.[0]?.customer_id as string) || null;
}

export async function resetPassword(customerId: string, newPassword: string): Promise<void> {
  const hash = hashPassword(newPassword);
  await db.execute({
    sql: 'UPDATE customers SET password_hash = ? WHERE id = ?',
    args: [hash, customerId],
  });
  await db.execute({
    sql: 'DELETE FROM password_reset_codes WHERE customer_id = ?',
    args: [customerId],
  });
}
