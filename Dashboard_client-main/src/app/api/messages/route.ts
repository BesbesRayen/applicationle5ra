import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();

    // Fetch all messages ordered by newest first
    const [messages] = await connection.query(
      'SELECT id, name, email, subject, message, status, created_at FROM messages ORDER BY created_at DESC LIMIT 100'
    ) as any;

    return NextResponse.json(
      {
        success: true,
        count: (messages as any[]).length,
        messages: messages,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Fetch messages error:', errorMessage);

    if (errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
          messages: [],
          degraded: true,
          message: 'Database connection failed, returning empty messages list',
        },
        { status: 200 }
      );
    }

    if (errorMessage.includes("messages\" doesn't exist") || errorMessage.includes('Unknown table')) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
          messages: [],
          degraded: true,
          message: 'Messages table not found, returning empty list',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: 0,
        messages: [],
        degraded: true,
        message: 'Unable to load messages, try again later',
      },
      { status: 200 }
    );
  } finally {
    if (connection) await connection.release();
  }
}
