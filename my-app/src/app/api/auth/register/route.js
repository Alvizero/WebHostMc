import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, cognome, username, email, password, telefono } = body;

    // Verifica se l'utente esiste già
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ message: 'Email già registrata' }, { status: 400 });
    }

    // Crea nuovo utente
    const userId = await createUser({
      nome,
      cognome,
      username,
      email,
      password,
      telefono
    });

    return NextResponse.json({ 
      message: 'Utente registrato con successo',
      userId 
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}