import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request) {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM piani_hosting 
      WHERE attivo = TRUE 
      ORDER BY prezzo_mensile ASC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}