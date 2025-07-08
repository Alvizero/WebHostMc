import { NextResponse } from 'next/server';
import { renewServer } from '../../../../../lib/server-utils';
import { createTransaction } from '../../../../../lib/transaction-utils';
import { verifyToken } from '../../../../../lib/auth';
import pool from '../../../../../lib/db';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const token = request.cookies.get('auth-token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica che il server appartenga all'utente
    const [rows] = await pool.execute(
      'SELECT s.*, p.prezzo_mensile FROM servers s JOIN piani_hosting p ON s.piano_id = p.id WHERE s.id = ? AND s.proprietario_email = ?',
      [id, decoded.email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Server non trovato' }, { status: 404 });
    }

    const server = rows[0];

    // Crea transazione
    const transactionId = await createTransaction({
      user_email: decoded.email,
      server_id: id,
      tipo: 'rinnovo',
      importo: server.prezzo_mensile,
      metodo_pagamento: 'paypal',
      transaction_id: `renewal_${Date.now()}`
    });

    // Rinnova server
    await renewServer(id);

    return NextResponse.json({ 
      message: 'Server rinnovato con successo',
      transactionId 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}