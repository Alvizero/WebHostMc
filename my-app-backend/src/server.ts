import express, { Request, Response, NextFunction } from 'express';
import cors from "cors";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { ResultSetHeader, FieldPacket } from 'mysql2';
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

interface MyJwtPayload extends JwtPayload {
  id: number;
  ruolo: string;
  email: string;
}

app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});

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
    const [rows] = await pool.query(`
      SELECT 
        v.id,
        v.tipo_id,
        v.versione,
        v.ultima_versione,
        v.popolare,
        e.nome AS tipo_nome
      FROM versioni_server v
      JOIN versioni_server_egg e ON v.tipo_id = e.id
    `);
    res.json(rows);
  } catch (error) {
    console.error("Errore durante la query versioni_server2:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

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
        s.uuidShort,
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

app.get('/api/admin/servers/:serverId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);

    const [rows] = await pool.query(`
      SELECT 
        s.id, s.nome, s.tipo, s.proprietario_email, s.data_acquisto, 
        s.data_scadenza, s.n_rinnovi, s.stato, s.pterodactyl_id, n_backup
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
    const { nome, tipo, proprietario_email, data_acquisto, data_scadenza, stato, n_rinnovi, n_backup } = req.body || {};

    // Prima recupera il pterodactyl_id dal database
    const [serverRows] = await pool.query('SELECT pterodactyl_id FROM server WHERE id = ?', [serverId]);
    const serverData = serverRows as any[];

    if (serverData.length === 0) {
      return res.status(404).json({ success: false, message: 'Server non trovato' });
    }

    const pterodactylId = serverData[0].pterodactyl_id;

    // Recupera le specifiche del tipo di server
    const [tipoRows] = await pool.query('SELECT cpu_cores, ram_gb, storage_gb FROM tipi_server WHERE nome = ?', [tipo]);
    const tipoData = tipoRows as any[];

    if (tipoData.length === 0) {
      return res.status(400).json({ success: false, message: 'Tipo di server non valido' });
    }

    const { cpu_cores, ram_gb, storage_gb } = tipoData[0];

    // Aggiorna il database
    await pool.query(`
      UPDATE server 
      SET nome = ?, tipo = ?, proprietario_email = ?, data_acquisto = ?, 
          data_scadenza = ?, stato = ?, n_rinnovi = ?, n_backup = ?
      WHERE id = ?
    `, [nome, tipo, proprietario_email, data_acquisto, data_scadenza, stato, n_rinnovi, n_backup, serverId]);

    // Recupera il server aggiornato
    const [rows] = await pool.query('SELECT * FROM server WHERE id = ?', [serverId]);
    const updatedServer = (rows as any[])[0];

    // Aggiorna Pterodactyl SOLO se esiste pterodactyl_id
    if (pterodactylId) {
      try {
        await updatePterodactylServerResources(pterodactylId, nome, cpu_cores, ram_gb, storage_gb, stato, n_backup);
        await updatePterodactylServerExpiration(pterodactylId, data_scadenza);

        console.log(`✅ Server ${pterodactylId} aggiornato completamente su Pterodactyl`);
        console.log(`📊 Nome: ${nome}, Tipo: ${tipo}, CPU: ${cpu_cores}, RAM: ${ram_gb}GB, DISK: ${storage_gb}GB, Stato: ${stato}`);
        if (data_scadenza) {
          console.log(`📅 Data scadenza: ${data_scadenza}`);
        }
      } catch (pterodactylError: any) {
        console.error('❌ Errore aggiornamento Pterodactyl (non bloccante):', pterodactylError.message);
        // L'errore non blocca l'operazione, il database è comunque aggiornato
      }
    } else {
      console.log('⚠️ Server non ha pterodactyl_id, skip aggiornamento Pterodactyl');
    }

    res.json({
      success: true,
      server: updatedServer,
      resources: {
        cpu: cpu_cores,
        ram: ram_gb,
        storage: storage_gb
      }
    });

  } catch (error) {
    console.error('Errore aggiornamento server:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del server' });
  }
});

app.delete('/api/admin/servers/:serverId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);

    // 1) Recupera il pterodactyl_id dal DB (assumendo che tu lo abbia salvato)
    const [rows] = await pool.query('SELECT pterodactyl_id FROM server WHERE id = ?', [serverId]);
    if (!rows || (rows as any[]).length === 0) {
      return res.status(404).json({ success: false, message: 'Server non trovato' });
    }
    const pteroServerId = (rows as any[])[0].pterodactyl_id;
    if (!pteroServerId) {
      return res.status(400).json({ success: false, message: 'ID Pterodactyl non configurato per questo server' });
    }

    // 2) Chiamata DELETE alle API di Pterodactyl per eliminare il server remoto
    await axios.delete(`http://192.168.1.56/api/application/servers/${pteroServerId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ptla_3Q6XeKhYeB0DgFubxyznuvwQpmtUoIuALpZwQqMrFmx'  // <-- metti qui la tua API key valida
      }
      // Non serve il cookie pterodactyl_session per questa API se usi API key
    });

    // 3) Cancella il server dal DB locale
    await pool.query('DELETE FROM server WHERE id = ?', [serverId]);

    res.json({ success: true, message: 'Server eliminato con successo, sia localmente che su Pterodactyl' });
  } catch (error: any) {
    console.error('Errore eliminazione server:', error.response?.data || error.message || error);
    res.status(500).json({ success: false, message: 'Errore nell\'eliminazione del server', error: error.response?.data || error.message });
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

const updatePterodactylServerExpiration = async (pterodactylId: number, dataScadenza?: string | null) => {
  try {
    // Connessione al DB Pterodactyl
    const pterodactylPool = mysql.createPool({
      host: '192.168.1.56',
      user: 'alvise',
      password: 'alvise1234',
      database: 'panel',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Se data nulla o vuota, imposta exp_date a NULL
    if (!dataScadenza || dataScadenza.trim() === '') {
      await pterodactylPool.query(
        'UPDATE servers SET exp_date = NULL WHERE id = ?',
        [pterodactylId]
      );
      console.log(`🗓️ Nessuna data fornita → exp_date settato a NULL per server ${pterodactylId}`);
      await pterodactylPool.end();
      return;
    }

    // Controlla se la data è valida
    const parsedDate = new Date(dataScadenza);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`❌ Data scadenza non valida: ${dataScadenza}`);
    }

    // Formatta la data in YYYY-MM-DD
    const formattedDate = parsedDate.toISOString().split('T')[0];

    // Verifica se già è impostata la stessa data
    const [existingRows] = await pterodactylPool.query(
      'SELECT exp_date FROM servers WHERE id = ?',
      [pterodactylId]
    );

    const currentExpDate = (existingRows as any[])[0]?.exp_date;
    const currentFormatted = currentExpDate
      ? new Date(currentExpDate).toISOString().split('T')[0]
      : null;

    if (currentFormatted === formattedDate) {
      console.log(`🟡 Data scadenza già aggiornata: ${formattedDate}`);
      await pterodactylPool.end();
      return;
    }

    // Aggiorna la data di scadenza
    await pterodactylPool.query(
      'UPDATE servers SET exp_date = ? WHERE id = ?',
      [formattedDate, pterodactylId]
    );

    console.log(`✅ Data scadenza aggiornata nel DB Pterodactyl: ${formattedDate}`);
    await pterodactylPool.end();
  } catch (error: any) {
    console.error('❌ Errore aggiornamento exp_date:', error.message);
    throw error;
  }
};

const updatePterodactylServerResources = async (pterodactylId: number, nome: string, cpu: number, ram: number, disk: number, stato: string, n_backup: number) => {
  try {
    console.log(`🔄 Aggiornamento risorse server Pterodactyl ID: ${pterodactylId}`);

    const token = process.env.PTERODACTYL_TOKEN || 'ptla_3Q6XeKhYeB0DgFubxyznuvwQpmtUoIuALpZwQqMrFmx';

    // Recupera le informazioni del server per ottenere l'allocation corretta
    const serverInfoResponse = await axios.get(`http://192.168.1.56/api/application/servers/${pterodactylId}?include=allocations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pterodactyl.v1+json'
      }
    });

    console.log('📋 Risposta server info:', {
      id: serverInfoResponse.data.attributes?.id,
      name: serverInfoResponse.data.attributes?.name,
      suspended: serverInfoResponse.data.attributes?.suspended,
      hasAllocations: !!serverInfoResponse.data.attributes?.relationships?.allocations
    });

    const serverInfo = serverInfoResponse.data.attributes;

    // Trova l'allocation corretta
    let allocationId;
    if (serverInfo?.relationships?.allocations?.data?.length > 0) {
      allocationId = serverInfo.relationships.allocations.data[0].attributes.id;
      console.log(`📍 Trovata allocation ID: ${allocationId}`);
    } else {
      try {
        const allocationsResponse = await axios.get(`http://192.168.1.56/api/application/servers/${pterodactylId}/allocations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.pterodactyl.v1+json'
          }
        });

        if (allocationsResponse.data.data && allocationsResponse.data.data.length > 0) {
          allocationId = allocationsResponse.data.data[0].attributes.id;
          console.log(`📍 Trovata allocation ID (separata): ${allocationId}`);
        }
      } catch (allocError: any) {
        console.error('❌ Errore recupero allocazioni:', allocError.message);
      }
    }

    if (!allocationId) {
      console.error('❌ Impossibile trovare allocation ID valido');
      throw new Error('Nessuna allocazione trovata per il server');
    }

    // Recupera i limiti esistenti dal server
    const existingLimits = serverInfo?.limits || {};
    const existingFeatureLimits = serverInfo?.feature_limits || {};

    console.log('📊 Limiti esistenti:', {
      limits: existingLimits,
      feature_limits: existingFeatureLimits
    });

    // 1. Aggiorna il nome del server
    try {
      const originalUserId = serverInfoResponse.data.attributes.user;

      await axios.patch(`http://192.168.1.56/api/application/servers/${pterodactylId}/details`, {
        name: nome,
        user: originalUserId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.pterodactyl.v1+json'
        }
      });
      console.log(`✅ Nome server ${pterodactylId} aggiornato su Pterodactyl`);
    } catch (nameError: any) {
      console.error('❌ Errore aggiornamento nome:', nameError.message);
    }

    // 2. Determina lo stato di sospensione
    const shouldBeSuspended = stato === 'sospeso' || stato === 'scaduto';
    const isCurrentlySuspended = serverInfo?.suspended || false;

    console.log(`🔄 Stato server: ${stato} -> Sospeso: ${shouldBeSuspended}, Attualmente sospeso: ${isCurrentlySuspended}`);

    // 3. Gestisci la sospensione/riattivazione PRIMA di aggiornare le risorse
    if (shouldBeSuspended && !isCurrentlySuspended) {
      // Sospendi il server
      try {
        await axios.post(`http://192.168.1.56/api/application/servers/${pterodactylId}/suspend`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.pterodactyl.v1+json'
          }
        });
        console.log(`✅ Server ${pterodactylId} sospeso`);
      } catch (suspendError: any) {
        console.error('❌ Errore sospensione server:', suspendError.message);
        console.error('Response:', suspendError.response?.data);
      }
    } else if (!shouldBeSuspended && isCurrentlySuspended) {
      // Riattiva il server
      try {
        await axios.post(`http://192.168.1.56/api/application/servers/${pterodactylId}/unsuspend`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.pterodactyl.v1+json'
          }
        });
        console.log(`✅ Server ${pterodactylId} riattivato`);
      } catch (unsuspendError: any) {
        console.error('❌ Errore riattivazione server:', unsuspendError.message);
        console.error('Response:', unsuspendError.response?.data);
      }
    }

    // 4. Aggiorna le risorse del server (senza modificare lo stato di sospensione)
    const buildPayload = {
      allocation: allocationId,
      memory: ram * 1024,
      swap: existingLimits.swap || 0,
      disk: disk * 1024,
      io: existingLimits.io || 500,
      cpu: cpu * 100,
      threads: existingLimits.threads || null,
      feature_limits: {
        databases: existingFeatureLimits.databases || 5,
        allocations: existingFeatureLimits.allocations || 5,
        backups: n_backup
      }
    };

    console.log('📦 Payload build:', buildPayload);

    const buildResponse = await axios.patch(`http://192.168.1.56/api/application/servers/${pterodactylId}/build`, buildPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pterodactyl.v1+json'
      }
    });

    console.log(`✅ Risorse server ${pterodactylId} aggiornate su Pterodactyl`);
    console.log('📊 Nuove risorse:', `CPU: ${cpu} core(s), RAM: ${ram}GB, DISK: ${disk}GB`)

  } catch (error: any) {
    console.error('❌ Errore aggiornamento risorse Pterodactyl:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    throw error;
  }
};

/*app.post("/api/servers", async (req, res) => {
  try {
    const {
      nome,
      tipo,
      proprietario_email,
      data_acquisto,
      data_scadenza,
      n_rinnovi,
      stato,
      allocation_id,
      docker_image,
      versione_egg,
      versione_server,  // Cambia da vanilla_version a versione_server
      n_backup
    } = req.body;

    console.log("Tutti i dati ricevuti:", req.body);

    // Recupera le specifiche del tipo di server dal database
    const [tipoRows] = await pool.query('SELECT cpu_cores, ram_gb, storage_gb FROM tipi_server WHERE nome = ?', [tipo]);
    const tipoData = tipoRows as any[];

    if (tipoData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tipo di server non valido'
      });
    }

    const { cpu_cores, ram_gb, storage_gb } = tipoData[0];

    console.log(`📊 Specifiche server tipo "${tipo}":`, {
      cpu_cores,
      ram_gb,
      storage_gb
    });

    // Configurazione per la chiamata all'API Pterodactyl
    const pterodactylConfig = {
      url: "http://192.168.1.56/api/application/servers",
      token: "ptla_3Q6XeKhYeB0DgFubxyznuvwQpmtUoIuALpZwQqMrFmx",
      headers: {
        "Authorization": "Bearer ptla_3Q6XeKhYeB0DgFubxyznuvwQpmtUoIuALpZwQqMrFmx",
        "Content-Type": "application/json",
        "Accept": "application/vnd.pterodactyl.v1+json"
      }
    };

    // Payload per Pterodactyl - usa i valori dal frontend
    const pterodactylPayload = {
      name: nome,
      user: process.env.PTERODACTYL_DEFAULT_USER_ID,
      egg: 4,
      docker_image: docker_image, // Ora viene dal frontend
      startup: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}",
      environment: {
        SERVER_JARFILE: "server.jar",
        VANILLA_VERSION: versione_server || "latset" // Usa versione_server invece di vanilla_version
      },
      limits: {
        memory: ram_gb * 1024,
        swap: 0,
        disk: storage_gb * 1024,
        io: 500,
        cpu: cpu_cores * 100
      },
      feature_limits: {
        databases: 0,
        allocations: 0,
        backups: n_backup
      },
      allocation: {
        default: allocation_id
      }
    };

    console.log("🚀 Payload inviato a Pterodactyl:", JSON.stringify(pterodactylPayload, null, 2));

    // Prima inserisci nel database locale
    const [result] = await pool.query(
      "INSERT INTO server (nome, tipo, proprietario_email, data_acquisto, data_scadenza, n_rinnovi, stato) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nome, tipo, proprietario_email, data_acquisto, data_scadenza, n_rinnovi, stato]
    ) as [ResultSetHeader, FieldPacket[]];

    // Poi crea il server in Pterodactyl
    const pterodactylResponse = await fetch(pterodactylConfig.url, {
      method: 'POST',
      headers: pterodactylConfig.headers,
      body: JSON.stringify(pterodactylPayload)
    });

    if (!pterodactylResponse.ok) {
      const errorData = await pterodactylResponse.text();
      console.error("Errore Pterodactyl:", errorData);
      throw new Error(`Errore Pterodactyl: ${pterodactylResponse.status}`);
    }


    const pterodactylData = await pterodactylResponse.json();
    console.log("Server creato in Pterodactyl:", pterodactylData);

    // Opzionale: aggiorna il database con l'ID del server Pterodactyl e l'identifier
    if (pterodactylData.attributes && pterodactylData.attributes.id) {
      await pool.query(
        "UPDATE server SET pterodactyl_id = ?, uuidShort = ? WHERE id = ?",
        [pterodactylData.attributes.id, pterodactylData.attributes.identifier, result.insertId]
      );
    }

    if (pterodactylResponse.ok) {
      await updatePterodactylServerExpiration(pterodactylData.attributes.id, data_scadenza);
    }

    res.status(201).json({
      id: result.insertId,
      pterodactyl_id: pterodactylData.attributes?.id,
      uuidShort: pterodactylData.attributes?.identifier,
      ...req.body
    });

  } catch (error) {
    console.error("Errore creazione server:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});*/


app.post("/api/servers", async (req, res) => {
  try {
    const {
      nome,
      tipo,
      proprietario_email,
      data_acquisto,
      data_scadenza,
      n_rinnovi,
      stato,
      allocation_id,
      docker_image,
      versione_egg,
      versione_server,
      n_backup
    } = req.body;

    // Ottieni l'ID Pterodactyl dell'egg selezionato dal database
    const [eggRows] = await pool.query(
      'SELECT pterodactyl_id FROM versioni_server_egg WHERE id = ?',
      [versione_egg]
    );
    if ((eggRows as any[]).length === 0) {
      return res.status(400).json({ success: false, message: 'Egg non trovato nel database' });
    }
    const pterodactylEggId = (eggRows as any[])[0].pterodactyl_id;
    if (!pterodactylEggId) {
      return res.status(400).json({ success: false, message: 'Tipo di egg non supportato' });
    }

    // Recupera le specifiche del tipo di server dal database
    const [tipoRows] = await pool.query('SELECT cpu_cores, ram_gb, storage_gb FROM tipi_server WHERE nome = ?', [tipo]);
    const tipoData = tipoRows as any[];
    if (tipoData.length === 0) {
      return res.status(400).json({ success: false, message: 'Tipo di server non valido' });
    }
    const { cpu_cores, ram_gb, storage_gb } = tipoData[0];

    // Configurazione startup e environment basata sul tipo di egg
    let startup = "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}";
    let environment: { [key: string]: any } = {
      SERVER_JARFILE: "server.jar",
      VANILLA_VERSION: versione_server || "latest"
    };
    switch (pterodactylEggId) {
      case 4:
        environment = { SERVER_JARFILE: "server.jar", VANILLA_VERSION: versione_server || "latest" };
        break;
      case 1:
        environment = {
          SERVER_JARFILE: "server.jar",
          MC_VERSION: versione_server || "1.21.7",
          BUILD_TYPE: "recommended",
          FORGE_VERSION: versione_server || "latest"
        };
        break;
      case 17:
        environment = { SERVER_JARFILE: "server.jar", DL_VERSION: versione_server || "latest" };
        break;
      case 18:
        environment = { SERVER_JARFILE: "server.jar", PAPER_VERSION: versione_server || "1.21.7", BUILD_NUMBER: "latest" };
        break;
      case 16:
        startup = "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}";
        environment = {
          SERVER_JARFILE: "fabric-server-launch.jar",
          LOADER_VERSION: "latest",
          MC_VERSION: versione_server || "1.21.7"
        };
        break;
      default:
        console.log(`⚠️ Configurazione di default per egg ID: ${pterodactylEggId}`);
        break;
    }

    // Payload per Pterodactyl
    const pterodactylPayload = {
      name: nome,
      user: process.env.PTERODACTYL_DEFAULT_USER_ID,
      egg: pterodactylEggId,
      docker_image: docker_image,
      startup: startup,
      environment: environment,
      limits: {
        memory: ram_gb * 1024,
        swap: 0,
        disk: storage_gb * 1024,
        io: 500,
        cpu: cpu_cores * 100
      },
      feature_limits: {
        databases: 0,
        allocations: 0,
        backups: n_backup
      },
      allocation: {
        default: allocation_id
      }
    };

    // Chiamata API a Pterodactyl (creazione server)
    const pterodactylResponse = await fetch(
      `${process.env.PTERODACTYL_API_URL || "http://192.168.1.56"}/api/application/servers`,
      {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${process.env.PTERODACTYL_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.pterodactyl.v1+json"
        },
        body: JSON.stringify(pterodactylPayload)
      }
    );

    if (!pterodactylResponse.ok) {
      const errorData = await pterodactylResponse.text();
      console.error("Errore Pterodactyl:", errorData);
      return res.status(500).json({ error: `Errore creazione server su Pterodactyl: ${pterodactylResponse.status}` });
    }

    const pterodactylData = await pterodactylResponse.json();

    // Se siamo qui, la creazione su Pterodactyl è andata a buon fine,
    // quindi inseriamo il server nel DB locale

    const [result] = await pool.query(
      "INSERT INTO server (nome, tipo, proprietario_email, data_acquisto, data_scadenza, n_rinnovi, stato, pterodactyl_id, uuidShort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nome,
        tipo,
        proprietario_email,
        data_acquisto,
        data_scadenza,
        n_rinnovi,
        stato,
        pterodactylData.attributes.id,
        pterodactylData.attributes.identifier
      ]
    ) as [ResultSetHeader, FieldPacket[]];

    // Opzionale: aggiorna scadenza su Pterodactyl, se gestisci
    if (pterodactylData.attributes?.id) {
      await updatePterodactylServerExpiration(pterodactylData.attributes.id, data_scadenza);
    }

    res.status(201).json({
      id: result.insertId,
      pterodactyl_id: pterodactylData.attributes.id,
      uuidShort: pterodactylData.attributes.identifier,
      ...req.body
    });

  } catch (error) {
    console.error("Errore creazione server:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});


app.get('/api/pterodactyl/next-allocation', async (req: Request, res: Response) => {
  try {
    const token = process.env.PTERODACTYL_API_KEY;
    const baseUrl = process.env.PTERODACTYL_API_URL;

    const response = await axios.get(`${baseUrl}/api/application/nodes`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.pterodactyl.v1+json'
      }
    });

    const nodes = response.data.data;

    for (const node of nodes) {
      const nodeId = node.attributes.id;

      const allocationsRes = await axios.get(`${baseUrl}/api/application/nodes/${nodeId}/allocations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.pterodactyl.v1+json'
        }
      });

      const freeAlloc = allocationsRes.data.data.find((alloc: any) => !alloc.attributes.assigned);

      if (freeAlloc) {
        return res.json({
          id: freeAlloc.attributes.id, // 👈 AGGIUNTO QUESTO!
          ip: freeAlloc.attributes.ip,
          port: freeAlloc.attributes.port,
          full: `${freeAlloc.attributes.ip}:${freeAlloc.attributes.port}`,
          node: node.attributes.name
        });
      }
    }

    return res.status(404).json({ error: 'Nessuna allocazione libera trovata.' });
  } catch (error: any) {
    console.error('Errore recupero allocazione:', error.message);
    res.status(500).json({ error: 'Errore durante il recupero allocazione.' });
  }
});


app.get('/api/pterodactyl/latest-docker-images', async (req: Request, res: Response) => {
  try {
    const token = process.env.PTERODACTYL_API_KEY!;
    const baseUrl = process.env.PTERODACTYL_API_URL!;
    const nestId = 1; // Supponendo che tutti gli egg siano nel nest 1

    // Connessione al database per leggere gli egg
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!
    });

    const [rows] = await connection.execute('SELECT nome, pterodactyl_id FROM versioni_server_egg');
    const eggList = rows as { nome: string, pterodactyl_id: number }[];

    const results: { nome: string, docker_image: string }[] = [];

    // Per ogni egg, recupera l'ultima immagine docker
    for (const egg of eggList) {
      const eggResponse = await axios.get(`${baseUrl}/api/application/nests/${nestId}/eggs/${egg.pterodactyl_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.pterodactyl.v1+json'
        }
      });

      const dockerImage = eggResponse.data.attributes.docker_image;
      results.push({
        nome: egg.nome,
        docker_image: dockerImage
      });
    }

    await connection.end();
    return res.json(results);
  } catch (error: any) {
    console.error('Errore durante il recupero delle immagini Docker:', error.message);
    return res.status(500).json({ error: 'Errore durante il recupero delle immagini Docker.' });
  }
});