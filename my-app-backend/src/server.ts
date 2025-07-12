import express, { Request, Response, NextFunction } from 'express';
import cors from "cors";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { RowDataPacket } from 'mysql2';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from "dotenv";
import axios from 'axios';

// Carica variabili da .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

app.use(cors());
app.use(express.json());

// Connessione al database MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Configurazione Pterodactyl
const PTERODACTYL_CONFIG = {
  url: 'http://192.168.1.56',
  apiKey: "ptla_K4yLD5aBsJ7lUH8wp8eAtw651ra55iyqKrb3sdCjRJe"
};

// Servizio Pterodactyl
class PterodactylService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = PTERODACTYL_CONFIG.url;
    this.apiKey = PTERODACTYL_CONFIG.apiKey;
  }

  getAdminClient() {
    return axios.create({
      baseURL: `${this.baseURL}/api/application`,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  async getServers() {
    try {
      const client = this.getAdminClient();
      const response = await client.get('/servers');
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero dei server:', error);
      throw error;
    }
  }

  async getServer(serverId: number) {
    try {
      const client = this.getAdminClient();
      const response = await client.get(`/servers/${serverId}`);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero del server:', error);
      throw error;
    }
  }


  async syncServers() {
    try {
      // Call the getServers method to fetch servers from Pterodactyl
      const serversResponse = await this.getServers() as { data: any[] };

      // Ensure we have the expected data structure
      if (!serversResponse || !serversResponse.data || !Array.isArray(serversResponse.data)) {
        throw new Error('Invalid response format from Pterodactyl API');
      }

      return serversResponse.data.map((server: any) => ({
        pterodactyl_id: server.attributes.id,
        identifier: server.attributes.identifier,
        name: server.attributes.name,
        description: server.attributes.description,
        status: server.attributes.suspended ? 'suspended' : 'active',
        node_id: server.attributes.node,
        allocation_id: server.attributes.allocation,
        nest_id: server.attributes.nest,
        egg_id: server.attributes.egg,
        admin_url: `${this.baseURL}/admin/servers/view/${server.attributes.id}`
      }));
    } catch (error) {
      console.error('Errore nella sincronizzazione:', error);
      throw error;
    }
  }

  getAdminPanelUrl(serverId: number) {
    return `${this.baseURL}/admin/servers/view/${serverId}`;
  }
}

const pterodactylService = new PterodactylService();

// Le tue routes esistenti...
app.get("/api/tipi-server", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tipi_server");
    res.json(rows);
  } catch (error) {
    console.error("Errore durante la query:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

app.get('/api/durate-noleggio', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM durate_noleggio');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero durate noleggio' });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Email e password obbligatorie" });

  try {
    const [rows] = await pool.query("SELECT * FROM utenti WHERE email = ?", [email]);
    const utenti = rows as any[];

    if (utenti.length === 0) return res.status(404).json({ error: "Utente non trovato" });

    const utente = utenti[0];

    const match = await bcrypt.compare(password, utente.password_hash);
    if (!match) return res.status(401).json({ error: "Password errata" });

    res.json({ message: "Login riuscito", username: utente.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore del server" });
  }
});

app.post("/api/register", async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
  }

  try {
    const [emailCheck] = await pool.query("SELECT id FROM utenti WHERE email = ?", [email]);
    if ((emailCheck as any[]).length > 0) {
      return res.status(409).json({ error: "Email già registrata" });
    }

    const [userCheck] = await pool.query("SELECT id FROM utenti WHERE username = ?", [username]);
    if ((userCheck as any[]).length > 0) {
      return res.status(409).json({ error: "Username già in uso" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO utenti (nome, cognome, username, email, password_hash, ruolo, data_registrazione) VALUES (?, ?, ?, ?, ?, 'user', NOW())",
      [name.split(" ")[0], name.split(" ").slice(1).join(" "), username, email, hashedPassword]
    );

    res.status(201).json({ message: "Utente registrato con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore del server" });
  }
});

app.post("/api/check-user", async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await pool.query("SELECT id FROM utenti WHERE email = ?", [email]);
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    res.json({ message: "Utente trovato" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore del server" });
  }
});

app.get("/api/versioni-server-egg", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM versioni_server_egg");
    res.json(rows);
  } catch (error) {
    console.error("Errore durante la query:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

app.get("/api/versioni-server", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM versioni_server");
    res.json(rows);
  } catch (error) {
    console.error("Errore durante la query versioni_server2:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

interface MyJwtPayload extends JwtPayload {
  id: number;
  ruolo: string;
  email: string;
}

// Middleware di autenticazione admin
function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Token mancante' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token mancante' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as MyJwtPayload;

    if (payload.ruolo !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato, non sei admin' });
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    console.error('Errore autenticazione admin:', error);
    return res.status(401).json({ message: 'Token non valido' });
  }
}

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e password obbligatorie' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM utenti WHERE email = ?', [email]);
    const utenti = rows as any[];

    if (utenti.length === 0) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    const utente = utenti[0];

    const match = await bcrypt.compare(password, utente.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    if (utente.ruolo !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato. Solo gli amministratori possono accedere.' });
    }

    const token = jwt.sign(
      {
        id: utente.id,
        email: utente.email,
        ruolo: utente.ruolo
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login riuscito',
      token,
      user: {
        id: utente.id,
        email: utente.email,
        nome: utente.nome,
        cognome: utente.cognome,
        ruolo: utente.ruolo
      }
    });
  } catch (err) {
    console.error('Errore login:', err);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

app.get('/api/auth/verify', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ valid: false, message: 'Token mancante' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ valid: false, message: 'Token mancante' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as MyJwtPayload;

    const [rows] = await pool.query('SELECT * FROM utenti WHERE id = ? AND email = ?', [payload.id, payload.email]);
    const utenti = rows as any[];

    if (utenti.length === 0) {
      return res.status(401).json({ valid: false, message: 'Utente non trovato' });
    }

    const utente = utenti[0];

    if (utente.ruolo !== 'admin') {
      return res.status(403).json({ valid: false, message: 'Non sei più admin' });
    }

    res.json({
      valid: true,
      user: {
        id: utente.id,
        email: utente.email,
        nome: utente.nome,
        cognome: utente.cognome,
        ruolo: utente.ruolo
      }
    });
  } catch (error) {
    console.error('Errore verifica token:', error);
    res.status(401).json({ valid: false, message: 'Token non valido' });
  }
});

// Route per i server con integrazione Pterodactyl
app.get('/api/admin/servers', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        s.id,
        s.nome,
        s.tipo,
        s.proprietario_email,
        s.data_acquisto,
        s.data_scadenza,
        s.n_rinnovi,
        s.stato,
        s.pterodactyl_id,
        s.identifier,
        u.nome as proprietario_nome,
        u.cognome as proprietario_cognome
      FROM server s
      LEFT JOIN utenti u ON s.proprietario_email = u.email
      ORDER BY s.data_acquisto DESC
    `;

    const [rows] = await pool.query(query);

    res.json({
      success: true,
      servers: rows,
      total: (rows as any[]).length
    });
  } catch (error) {
    console.error('Errore recupero server:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei server'
    });
  }
});

// Nuove route per Pterodactyl
app.post('/api/admin/servers/sync-pterodactyl', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const pteroServers = await pterodactylService.syncServers();

    let synced = 0;
    for (const pteroServer of pteroServers) {
      try {
        // Cerca se esiste già un server con questo pterodactyl_id
        const [existing] = await pool.query(
          'SELECT id FROM server WHERE pterodactyl_id = ?',
          [pteroServer.pterodactyl_id]
        );

        if ((existing as any[]).length === 0) {
          // Inserisci nuovo server
          await pool.query(
            `INSERT INTO server (nome, pterodactyl_id, identifier, tipo, stato, data_acquisto) 
             VALUES (?, ?, ?, 'Pterodactyl', ?, NOW())`,
            [pteroServer.name, pteroServer.pterodactyl_id, pteroServer.identifier, pteroServer.status]
          );
          synced++;
        } else {
          // Aggiorna server esistente
          await pool.query(
            'UPDATE server SET nome = ?, identifier = ?, stato = ? WHERE pterodactyl_id = ?',
            [pteroServer.name, pteroServer.identifier, pteroServer.status, pteroServer.pterodactyl_id]
          );
          synced++;
        }
      } catch (error) {
        console.error(`Errore sync server ${pteroServer.pterodactyl_id}:`, error);
      }
    }

    res.json({
      success: true,
      message: 'Server sincronizzati con successo',
      synced: synced,
      total: pteroServers.length
    });
  } catch (error) {
    console.error('Errore sincronizzazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella sincronizzazione',
      error: (error as Error).message
    });
  }
});

app.get('/api/admin/servers/:serverId/pterodactyl-details', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);

    // Trova il server nel database locale
    const [localRows] = await pool.query('SELECT * FROM server WHERE id = ?', [serverId]);
    const localServers = localRows as any[];

    if (localServers.length === 0) {
      return res.status(404).json({ success: false, message: 'Server non trovato' });
    }

    const localServer = localServers[0];

    if (!localServer.pterodactyl_id) {
      return res.status(404).json({
        success: false,
        message: 'Server non collegato a Pterodactyl'
      });
    }

    // Ottieni i dettagli da Pterodactyl
    const pteroServer = await pterodactylService.getServer(localServer.pterodactyl_id);

    res.json({
      success: true,
      local: localServer,
      pterodactyl: (pteroServer as any).attributes,
      admin_panel_url: pterodactylService.getAdminPanelUrl(localServer.pterodactyl_id)
    });
  } catch (error) {
    console.error('Errore dettagli server:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei dettagli',
      error: (error as Error).message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});










app.get('/api/admin/servers/:serverId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);

    const [rows] = await pool.query(`
      SELECT 
        s.id, s.nome, s.tipo, s.proprietario_email, s.data_acquisto, 
        s.data_scadenza, s.n_rinnovi, s.stato, s.pterodactyl_id
      FROM server s 
      WHERE s.id = ?
    `, [serverId]);

    const servers = rows as any[];

    if (servers.length === 0) {
      return res.status(404).json({ success: false, message: 'Server non trovato' });
    }

    res.json({ success: true, server: servers[0] });
  } catch (error) {
    console.error('Errore recupero server:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero del server' });
  }
});

// Endpoint per aggiornare un server
app.put('/api/admin/servers/:serverId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const { nome, tipo, proprietario_email, data_acquisto, data_scadenza, stato, n_rinnovi } = req.body;

    await pool.query(`
      UPDATE server 
      SET nome = ?, tipo = ?, proprietario_email = ?, data_acquisto = ?, 
          data_scadenza = ?, stato = ?, n_rinnovi = ? 
      WHERE id = ?
    `, [nome, tipo, proprietario_email, data_acquisto, data_scadenza, stato, n_rinnovi, serverId]);

    // Recupera il server aggiornato
    const [rows] = await pool.query('SELECT * FROM server WHERE id = ?', [serverId]);

    res.json({ success: true, server: (rows as any[])[0] });
  } catch (error) {
    console.error('Errore aggiornamento server:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del server' });
  }
});

// Endpoint per eliminare un server
app.delete('/api/admin/servers/:serverId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);

    await pool.query('DELETE FROM server WHERE id = ?', [serverId]);

    res.json({ success: true, message: 'Server eliminato con successo' });
  } catch (error) {
    console.error('Errore eliminazione server:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'eliminazione del server' });
  }
});

// Endpoint per sospendere/riattivare un server
app.post('/api/admin/servers/:serverId/toggle-suspend', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const { sospeso } = req.body;

    // Valida il parametro
    if (typeof sospeso !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Il parametro sospeso deve essere un booleano'
      });
    }

    // Aggiorna il server nel database
    await pool.query(`
      UPDATE server 
      SET sospeso = ? 
      WHERE id = ?
    `, [sospeso, serverId]);

    // Verifica che il server esista
    const [rows] = await pool.query('SELECT * FROM server WHERE id = ?', [serverId]);
    const servers = rows as any[];

    if (servers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Server non trovato'
      });
    }

    // Opzionalmente, se il server ha un pterodactyl_id, 
    // puoi anche sospenderlo/riattivarlo su Pterodactyl
    const server = servers[0];
    if (server.pterodactyl_id) {
      try {
        // Qui potresti aggiungere la logica per sospendere/riattivare su Pterodactyl
        // const pteroClient = pterodactylService.getAdminClient();
        // await pteroClient.post(`/servers/${server.pterodactyl_id}/suspend`);
        console.log(`Server ${serverId} ${sospeso ? 'sospeso' : 'riattivato'} anche su Pterodactyl`);
      } catch (pteroError) {
        console.error('Errore nella gestione Pterodactyl:', pteroError);
        // Non bloccare la richiesta se Pterodactyl fallisce
      }
    }

    res.json({
      success: true,
      message: `Server ${sospeso ? 'sospeso' : 'riattivato'} con successo`,
      server: servers[0]
    });
  } catch (error) {
    console.error('Errore toggle suspend server:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella modifica dello stato del server'
    });
  }
});

app.get('/api/server/stati', async (req, res) => {
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM server LIKE 'stato'");
    if (!columns || (columns as any[]).length === 0) {
      return res.status(404).json({ error: 'Colonna stato non trovata' });
    }
    
    const typeStr = (columns as any)[0].Type; 
    const regex = /^enum\((.*)\)$/;
    const matches = typeStr.match(regex);

    if (!matches || matches.length < 2) {
      return res.status(500).json({ error: 'Formato ENUM non valido' });
    }

    const enumsRaw = matches[1]; 

    const enumValues = enumsRaw.split(",").map((s: string) => s.trim().replace(/^'(.*)'$/, "$1"));

    res.json(enumValues);
  } catch (error) {
    console.error('Errore nel recupero degli stati:', error);
    res.status(500).json({ error: 'Errore nel recupero degli stati' });
  }
});