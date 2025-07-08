import { NextResponse } from 'next/server';
import { verifyToken } from '../../../lib/auth';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
    }

    const [rows] = await pool.execute(`
      SELECT t.*, s.nome_server
      FROM tickets t
      LEFT JOIN servers s ON t.server_id = s.id
      WHERE t.user_email = ?
      ORDER BY t.data_apertura DESC
    `, [decoded.email]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { titolo, descrizione, categoria, priorita, server_id } = body;
    
    const [result] = await pool.execute(`
      INSERT INTO tickets (user_email, server_id, titolo, descrizione, categoria, priorita)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [decoded.email, server_id || null, titolo, descrizione, categoria, priorita]);

    return NextResponse.json({ 
      message: 'Ticket creato con successo',
      ticketId: result.insertId
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }