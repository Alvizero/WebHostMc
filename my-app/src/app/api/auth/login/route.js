import { NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, generateToken } from '../../../../lib/auth';
import pool from '../../../../lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Trova l'utente
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ message: 'Credenziali non valide' }, { status: 401 });
    }

    // Verifica password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: 'Credenziali non valide' }, { status: 401 });
    }

    // Genera token
    const token = generateToken({ email: user.email, id: user.id });

    // Aggiorna ultimo login
    await pool.execute(
      'UPDATE users SET ultimo_login = CURRENT_TIMESTAMP WHERE email = ?',
      [email]
    );

    // Crea response con cookie
    const response = NextResponse.json({ 
      message: 'Login effettuato con successo',
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        ruolo: user.ruolo
      }
    });

    // Imposta cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400 // 24 ore
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}