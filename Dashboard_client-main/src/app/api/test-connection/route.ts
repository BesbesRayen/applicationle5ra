import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query('SELECT NOW() as timestamp') as any;

    return NextResponse.json(
      {
        success: true,
        message: 'Database connection successful',
        timestamp: (result as any[])[0].timestamp,
        connection: {
          type: 'MySQL',
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || '3306',
          database: process.env.DB_NAME || 'nextjs_db',
          user: process.env.DB_USER || 'root',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: message,
        hint: 'Make sure XAMPP MySQL is running on port 3306. Check .env.local settings.',
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.release();
  }
}
