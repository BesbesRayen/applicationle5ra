import { NextResponse } from 'next/server';
import pool from '@/lib/db.js';

export async function POST(request: Request) {
  let connection;
  try {
    const { name, email, subject, message } = await request.json();

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { message: 'Tous les champs sont obligatoires.' },
        { status: 400 }
      );
    }

    // Get connection from pool
    connection = await pool.getConnection();

    // Insert message into database
    const [result] = await connection.execute(
      'INSERT INTO messages (name, email, subject, message, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, subject, message, 'unread']
    ) as any;

    console.log('✅ New contact form submission saved:', { id: (result as any).insertId, name, email, subject });

    return NextResponse.json(
      {
        success: true,
        message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
        messageId: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Contact form error:', errorMessage);

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connect')) {
      return NextResponse.json(
        { message: 'Erreur de connexion à la base de données.' },
        { status: 500 }
      );
    }

    if (errorMessage.includes('messages" doesn\'t exist')) {
      return NextResponse.json(
        { message: 'Erreur: Table messages non trouvée. Exécutez d\'abord le fichier CREATE_MESSAGES_TABLE.sql' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.release();
  }
}
