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
    const [rows] = await pool.query("SELECT * FROM versioni_server");
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
    const { nome, tipo, proprietario_email, data_acquisto, data_scadenza, stato, n_rinnovi } = req.body || {};

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
          data_scadenza = ?, stato = ?, n_rinnovi = ? 
      WHERE id = ?
    `, [nome, tipo, proprietario_email, data_acquisto, data_scadenza, stato, n_rinnovi, serverId]);

    // Recupera il server aggiornato
    const [rows] = await pool.query('SELECT * FROM server WHERE id = ?', [serverId]);
    const updatedServer = (rows as any[])[0];

    // Aggiorna Pterodactyl SOLO se esiste pterodactyl_id
    if (pterodactylId) {
      try {
        //await updatePterodactylServerResources(pterodactylId, nome, cpu_cores, ram_gb, storage_gb, "attivo", data_scadenza);
        await updatePterodactylServerResources(pterodactylId, nome, cpu_cores, ram_gb, storage_gb, stato);
     //   await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondi
     //   await updatePterodactylServerExpiration(pterodactylId, data_scadenza);


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

const updatePterodactylServerExpiration = async (pterodactylId: number, dataScadenza: string) => {
  try {
    if (!dataScadenza) {
      console.error('❌ Data scadenza non fornita');
      return;
    }

    console.log(`📅 Data scadenza ricevuta: ${dataScadenza}`);

    // Controllo se la data è valida
    const isValidDate = (dateString: string) => {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    };

    if (!isValidDate(dataScadenza)) {
      console.error('❌ Data scadenza non valida:', dataScadenza);
      throw new Error(`Data scadenza non valida: ${dataScadenza}`);
    }

    // Converti la data nel formato corretto per MySQL (YYYY-MM-DD)
    let formattedDate: string;

    if (dataScadenza.includes('T')) {
      // Se la data è in formato ISO (2029-02-07T22:00:00.000Z)
      formattedDate = dataScadenza.split('T')[0];
    } else if (dataScadenza.includes('/')) {
      // Se la data è in formato DD/MM/YYYY
      const parts = dataScadenza.split('/');
      if (parts.length !== 3) {
        throw new Error(`Formato data non valido: ${dataScadenza}`);
      }
      formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    } else {
      // Assumiamo che sia già in formato YYYY-MM-DD
      formattedDate = dataScadenza;
    }

    console.log(`📅 Data originale: ${dataScadenza}`);
    console.log(`📅 Data formattata per MySQL: ${formattedDate}`);

    // Validazione finale del formato della data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      throw new Error(`Formato data finale non valido: ${formattedDate}`);
    }

    console.log(`📅 Aggiornamento data scadenza server Pterodactyl ID: ${pterodactylId}`);

    // Connessione diretta al database di Pterodactyl
    const pterodactylPool = mysql.createPool({
      host: '192.168.1.56',
      user: 'alvise',
      password: 'alvise1234',
      database: 'panel',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    try {
      // Aggiorna direttamente il database con la data formattata
      const [result] = await pterodactylPool.query(
        'UPDATE servers SET exp_date = ? WHERE id = ?', 
        [formattedDate, pterodactylId]
      );

      // Verifica se l'aggiornamento ha avuto successo
      if (result && typeof result === 'object' && 'affectedRows' in result) {
        if (result.affectedRows === 0) {
          console.warn(`⚠️ Nessun server trovato con ID: ${pterodactylId}`);
        } else {
          console.log(`✅ Data scadenza aggiornata nel database Pterodactyl: ${formattedDate}`);
        }
      }

    } finally {
      // Chiudi sempre la connessione nel blocco finally
      await pterodactylPool.end();
    }

  } catch (error: any) {
    console.error('❌ Errore aggiornamento data scadenza DB:', error.message);
    throw error;
  }
};

const updatePterodactylServerResources = async (pterodactylId: number, nome: string, cpu: number, ram: number, disk: number, stato: string) => {
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
        backups: existingFeatureLimits.backups || 2
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
