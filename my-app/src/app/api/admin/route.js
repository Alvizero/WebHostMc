import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import pool from '../../../../lib/db';

export async function GET(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica se l'utente è admin
    const [userRows] = await pool.execute(
      'SELECT ruolo FROM users WHERE email = ?',
      [decoded.email]
    );

    if (userRows.length === 0 || userRows[0].ruolo !== 'admin') {
      return NextResponse.json({ message: 'Accesso negato' }, { status: 403 });
    }

    const [rows] = await pool.execute(`
      SELECT u.id, u.nome, u.cognome, u.username, u.email, u.data_registrazione, 
             u.ultimo_login, u.stato, u.ruolo, COUNT(s.id) as server_count
      FROM users u
      LEFT JOIN servers s ON u.email = s.proprietario_email
      GROUP BY u.id
      ORDER BY u.data_registrazione DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}