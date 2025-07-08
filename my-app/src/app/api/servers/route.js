import { NextResponse } from 'next/server';
import { getUserServers, createServer } from '../../../lib/server-utils';
import { verifyToken } from '../../../lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
    }

    const servers = await getUserServers(decoded.email);
    return NextResponse.json(servers);
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
    const { nome_server, piano_id, versione_minecraft, max_giocatori } = body;
    
    // Calcola data scadenza (1 mese da oggi)
    const dataScadenza = new Date();
    dataScadenza.setMonth(dataScadenza.getMonth() + 1);
    
    const serverId = await createServer({
      nome_server,
      piano_id,
      proprietario_email: decoded.email,
      data_scadenza: dataScadenza.toISOString().split('T')[0],
      versione_minecraft,
      max_giocatori
    });

    return NextResponse.json({ 
      message: 'Server creato con successo',
      serverId 
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}