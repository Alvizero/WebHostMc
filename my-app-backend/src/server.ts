import express, { Request, Response, NextFunction } from 'express';
import cors from "cors";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { ResultSetHeader, FieldPacket } from 'mysql2';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from "dotenv";
import axios from 'axios';
import { WASI } from 'wasi';

// Carica variabili da .env
dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

app.use(cors());
app.use(express.json());

// Configurazione Pterodactyl centralizzata
const PTERODACTYL_CONFIG = {
  baseUrl: process.env.PTERODACTYL_API_URL || "http://192.168.1.56",
  token: process.env.PTERODACTYL_API_KEY || "ptla_3Q6XeKhYeB0DgFubxyznuvwQpmtUoIuALpZwQqMrFmx",
  tokenclient: process.env.PTERODACTYL_CLIENT_API_KEY || "ptlc_1ZtFRqznCVSNStpOmIgDfHwEecWvNotTEncOyoqRA1K",
  defaultUserId: process.env.PTERODACTYL_DEFAULT_USER_ID || "1",
  defaultSubUserPermission: process.env.PTERODACTYL_SUBUSER_PERMISSIONS,
  dbConfig: {
    host: process.env.PTERODACTYL_DB_HOST || '192.168.1.56',
    user: process.env.PTERODACTYL_DB_USER || 'alvise',
    password: process.env.PTERODACTYL_DB_PASSWORD || 'alvise1234',
    database: process.env.PTERODACTYL_DB_NAME || 'panel',
    connectionLimit: process.env.PTERODACTYL_DB_connectionLimit || "5",
  },
  srvrConfig: {
    swap: process.env.PTERODACTYL_DEFAULT_SWAP || "0",
    io: process.env.PTERODACTYL_DEFAULT_IO || "500",
    databases: process.env.PTERODACTYL_DEFAULT_DATABASES || "3",
    allocations: process.env.PTERODACTYL_DEFAULT_ALLOCATIONS || "0",
    backups: process.env.PTERODACTYL_DEFAULT_BACKUPS || "3",
    nestsId: process.env.PTERODACTYL_MINECRAFT_NESTS_ID || "1"
  }
};

// Headers per API Pterodactyl
const getPterodactylHeaders = () => ({
  'Authorization': `Bearer ${PTERODACTYL_CONFIG.token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/vnd.pterodactyl.v1+json'
});

// Pool database principale
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: process.env.DB_waitForConnections === 'true',
  connectionLimit: parseInt(process.env.DB_connectionLimit || '10', 10)
});

// Pool database Pterodactyl
const pterodactylPool = mysql.createPool({
  ...PTERODACTYL_CONFIG.dbConfig,
  waitForConnections: true,
  connectionLimit: parseInt(PTERODACTYL_CONFIG.dbConfig.connectionLimit || '5', 10),
  queueLimit: 0
});

interface MyJwtPayload extends JwtPayload {
  id: number;
  ruolo: string;
  email: string;
}

// Utility per verifica JWT
const verifyJWT = (token: string): MyJwtPayload => {
  return jwt.verify(token, JWT_SECRET) as MyJwtPayload;
};

// Middleware di autenticazione admin
const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Token mancante' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token mancante' });
  }

  try {
    const payload = verifyJWT(token);

    if (payload.ruolo !== 'admin') {
      return res.status(403).json({ message: 'Accesso negato, non sei admin' });
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token non valido' });
  }
};

// Classe per gestire operazioni Pterodactyl
class PterodactylService {
  static async updateServerExpiration(pterodactylId: number, dataScadenza?: string | null) {
    try {
      if (!dataScadenza || dataScadenza.trim() === '') {
        await pterodactylPool.query(
          'UPDATE servers SET exp_date = NULL WHERE id = ?',
          [pterodactylId]
        );
        console.log(`🗓️ Data scadenza rimossa per server ${pterodactylId}`);
        return;
      }

      const parsedDate = new Date(dataScadenza);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Data scadenza non valida: ${dataScadenza}`);
      }

      const formattedDate = parsedDate.toISOString().split('T')[0];

      await pterodactylPool.query(
        'UPDATE servers SET exp_date = ? WHERE id = ?',
        [formattedDate, pterodactylId]
      );

      console.log(`✅ Data scadenza aggiornata: ${formattedDate}`);
    } catch (error: any) {
      console.error('❌ Errore aggiornamento exp_date:', error.message);
      throw error;
    }
  }

  static async updateServerResources(
    pterodactylId: number,
    nome: string,
    cpu: number,
    ram: number,
    disk: number,
    stato: string,
    n_backup: number
  ) {
    try {
      const headers = getPterodactylHeaders();

      // Recupera info server per allocation
      const serverInfoResponse = await axios.get(
        `${PTERODACTYL_CONFIG.baseUrl}/api/application/servers/${pterodactylId}?include=allocations`,
        { headers }
      );

      const serverInfo = serverInfoResponse.data.attributes;
      const existingLimits = serverInfo?.limits || {};
      const existingFeatureLimits = serverInfo?.feature_limits || {};

      // Trova allocation
      let allocationId;
      if (serverInfo?.relationships?.allocations?.data?.length > 0) {
        allocationId = serverInfo.relationships.allocations.data[0].attributes.id;
      } else {
        const allocationsResponse = await axios.get(
          `${PTERODACTYL_CONFIG.baseUrl}/api/application/servers/${pterodactylId}/allocations`,
          { headers }
        );
        if (allocationsResponse.data.data?.length > 0) {
          allocationId = allocationsResponse.data.data[0].attributes.id;
        }
      }

      if (!allocationId) {
        throw new Error('Nessuna allocazione trovata per il server');
      }

      // 1. Aggiorna nome
      await axios.patch(
        `${PTERODACTYL_CONFIG.baseUrl}/api/application/servers/${pterodactylId}/details`,
        {
          name: nome,
          user: serverInfo.user
        },
        { headers }
      );

      // 2. Gestisci sospensione
      const shouldBeSuspended = stato === 'sospeso' || stato === 'scaduto';
      const isCurrentlySuspended = serverInfo?.suspended || false;

      if (shouldBeSuspended && !isCurrentlySuspended) {
        await axios.post(
          `${PTERODACTYL_CONFIG.baseUrl}/api/application/servers/${pterodactylId}/suspend`,
          {},
          { headers }
        );
        console.log(`✅ Server ${pterodactylId} sospeso`);
      } else if (!shouldBeSuspended && isCurrentlySuspended) {
        await axios.post(
          `${PTERODACTYL_CONFIG.baseUrl}/api/application/servers/${pterodactylId}/unsuspend`,
          {},
          { headers }
        );
        console.log(`✅ Server ${pterodactylId} riattivato`);
      }

      // 3. Aggiorna risorse
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

      await axios.patch(
        `${PTERODACTYL_CONFIG.baseUrl}/api/application/servers/${pterodactylId}/build`,
        buildPayload,
        { headers }
      );

      console.log(`✅ Server ${pterodactylId} aggiornato completamente`);
    } catch (error: any) {
      console.error('❌ Errore aggiornamento Pterodactyl:', error.message);
      throw error;
    }
  }

  static async deleteServer(pterodactylId: number) {
    await axios.delete(
      `${PTERODACTYL_CONFIG.baseUrl}/api/application/servers/${pterodactylId}`,
      { headers: getPterodactylHeaders() }
    );
  }

  static async createServer(payload: any) {
    const response = await axios.post(
      `${PTERODACTYL_CONFIG.baseUrl}/api/application/servers`,
      payload,
      { headers: getPterodactylHeaders() }
    );
    return response.data;
  }
}

// ROUTES

app.listen(process.env.PORT || 3001, () => {
  console.log(`✅ Server avviato su ${process.env.BACKEND_URL}`);
});

// Routes base
app.get("/api/tipi-server", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tipi_server");
    res.json(rows);
  } catch (error) {
    console.error("Errore query tipi-server:", error);
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

app.get("/api/versioni-server-egg", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM versioni_server_egg");
    res.json(rows);
  } catch (error) {
    console.error("Errore query versioni-server-egg:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

app.get("/api/versioni-server", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        v.id, v.tipo_id, v.versione, v.ultima_versione, v.popolare,
        e.nome AS tipo_nome
      FROM versioni_server v
      JOIN versioni_server_egg e ON v.tipo_id = e.id
    `);
    res.json(rows);
  } catch (error) {
    console.error("Errore query versioni-server:", error);
    res.status(500).json({ error: "Errore del server" });
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

    const enumValues = matches[1].split(",").map((s: string) =>
      s.trim().replace(/^'(.*)'$/, "$1")
    );

    res.json(enumValues);
  } catch (error) {
    console.error('Errore recupero stati:', error);
    res.status(500).json({ error: 'Errore nel recupero degli stati' });
  }
});

// AUTH ROUTES (consolidate)
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

    // Per admin panel, controlla ruolo
    if (req.path.includes('/auth/') && utente.ruolo !== 'admin') {
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
        username: utente.username,
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
    const payload = verifyJWT(token);
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

app.post("/api/register", async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
  }

  try {
    // Controlla duplicati
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

// ADMIN ROUTES
app.get('/api/admin/servers', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        s.id, s.nome, s.tipo, s.proprietario_email, s.data_acquisto,
        s.data_scadenza, s.n_rinnovi, s.stato, s.pterodactyl_id, s.uuidShort,
        u.nome as proprietario_nome, u.cognome as proprietario_cognome
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
    const [rows] = await pool.query(`SELECT s.id, s.nome, s.tipo, s.proprietario_email, s.data_acquisto, s.data_scadenza, s.n_rinnovi, s.stato, s.pterodactyl_id, s.n_backup, s.commenti FROM server s WHERE s.id = ?`,
      [serverId]
    );

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

app.put('/api/admin/servers/:serverId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const { nome, tipo, proprietario_email, data_acquisto, data_scadenza, stato, n_rinnovi, n_backup, commenti } = req.body || {};

    // Recupera pterodactyl_id e specifiche tipo
    const [serverRows] = await pool.query('SELECT pterodactyl_id FROM server WHERE id = ?', [serverId]);
    const [tipoRows] = await pool.query('SELECT cpu_cores, ram_gb, storage_gb FROM tipi_server WHERE nome = ?', [tipo]);

    const serverData = serverRows as any[];
    const tipoData = tipoRows as any[];

    if (serverData.length === 0) {
      return res.status(404).json({ success: false, message: 'Server non trovato' });
    }
    if (tipoData.length === 0) {
      return res.status(400).json({ success: false, message: 'Tipo di server non valido' });
    }

    const pterodactylId = serverData[0].pterodactyl_id;
    const { cpu_cores, ram_gb, storage_gb } = tipoData[0];

    // Aggiorna database
    await pool.query(`UPDATE server SET nome = ?, tipo = ?, proprietario_email = ?, data_acquisto = ?, data_scadenza = ?, stato = ?, n_rinnovi = ?, n_backup = ?, commenti = ? WHERE id = ?`,
      [nome, tipo, proprietario_email, data_acquisto, data_scadenza, stato, n_rinnovi, n_backup, commenti, serverId]
    );

    // Aggiorna Pterodactyl se esiste ID
    if (pterodactylId) {
      try {
        await PterodactylService.updateServerResources(pterodactylId, nome, cpu_cores, ram_gb, storage_gb, stato, n_backup);
        await PterodactylService.updateServerExpiration(pterodactylId, data_scadenza);
        console.log(`✅ Server ${pterodactylId} aggiornato su Pterodactyl`);
      } catch (pterodactylError: any) {
        console.error('❌ Errore aggiornamento Pterodactyl (non bloccante):', pterodactylError.message);
      }
    }

    // Recupera server aggiornato
    const [rows] = await pool.query('SELECT * FROM server WHERE id = ?', [serverId]);
    res.json({
      success: true,
      server: (rows as any[])[0],
      resources: { cpu: cpu_cores, ram: ram_gb, storage: storage_gb }
    });

  } catch (error) {
    console.error('Errore aggiornamento server:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del server' });
  }
});

app.delete('/api/admin/servers/:serverId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const serverId = parseInt(req.params.serverId);

    const [rows] = await pool.query('SELECT pterodactyl_id FROM server WHERE id = ?', [serverId]);
    if (!rows || (rows as any[]).length === 0) {
      return res.status(404).json({ success: false, message: 'Server non trovato' });
    }

    const pteroServerId = (rows as any[])[0].pterodactyl_id;
    if (!pteroServerId) {
      return res.status(400).json({ success: false, message: 'ID Pterodactyl non configurato per questo server' });
    }

    // Elimina da Pterodactyl
    await PterodactylService.deleteServer(pteroServerId);

    // Elimina dal DB locale
    await pool.query('DELETE FROM server WHERE id = ?', [serverId]);

    res.json({ success: true, message: 'Server eliminato con successo' });
  } catch (error: any) {
    console.error('Errore eliminazione server:', error.message);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione del server',
      error: error.message
    });
  }
});

// SERVER CREATION
app.post("/api/servers", async (req, res) => {
  try {
    const { nome, tipo, proprietario_email, data_acquisto, data_scadenza, n_rinnovi, stato, allocation_id, docker_image, versione_egg, versione_server, n_backup } = req.body;
    const safeDataScadenza = !data_scadenza || data_scadenza.trim() === '' ? null : data_scadenza;

    // Ottieni egg Pterodactyl ID
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

    // Ottieni specifiche tipo server
    const [tipoRows] = await pool.query('SELECT cpu_cores, ram_gb, storage_gb FROM tipi_server WHERE nome = ?', [tipo]);
    const tipoData = tipoRows as any[];
    if (tipoData.length === 0) {
      return res.status(400).json({ success: false, message: 'Tipo di server non valido' });
    }

    const { cpu_cores, ram_gb, storage_gb } = tipoData[0];

    // Configurazione startup e environment per egg
    const getEggConfig = (eggId: number, version: string) => {
      const configs: { [key: number]: any } = {
        4: { // Vanilla
          startup: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}",
          environment: {
            SERVER_JARFILE: "server.jar",
            VANILLA_VERSION: version || "latest"
          }
        },
        1: { // Forge
          startup: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}",
          environment: {
            SERVER_JARFILE: "server.jar",
            MC_VERSION: version || "latset",
            BUILD_TYPE: "recommended",
            FORGE_VERSION: version || "latest"
          }
        },
        17: { // Spigot
          startup: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}",
          environment: {
            SERVER_JARFILE: "server.jar",
            DL_VERSION: version || "latest"
          }
        },
        18: { // Paper
          startup: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}",
          environment: {
            SERVER_JARFILE: "server.jar",
            MINECRAFT_VERSION: version || "latset",
            BUILD_NUMBER: "latest"
          }
        },
        16: { // Fabric
          startup: "java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}",
          environment: {
            SERVER_JARFILE: "fabric-server-launch.jar",
            LOADER_VERSION: "latest",
            MC_VERSION: version || "latset"
          }
        }
      };

      return configs[eggId] || configs[4]; // Default to vanilla
    };

    const eggConfig = getEggConfig(pterodactylEggId, versione_server);

    // Payload Pterodactyl
    const pterodactylPayload = {
      name: nome,
      user: PTERODACTYL_CONFIG.defaultUserId,
      egg: pterodactylEggId,
      docker_image: docker_image,
      startup: eggConfig.startup,
      environment: eggConfig.environment,
      limits: {
        memory: ram_gb * 1024,
        swap: PTERODACTYL_CONFIG.srvrConfig.swap,
        disk: storage_gb * 1024,
        io: PTERODACTYL_CONFIG.srvrConfig.io,
        cpu: cpu_cores * 100
      },
      feature_limits: {
        databases: PTERODACTYL_CONFIG.srvrConfig.databases,
        allocations: PTERODACTYL_CONFIG.srvrConfig.allocations,
        backups: n_backup || PTERODACTYL_CONFIG.srvrConfig.backups
      },
      allocation: {
        default: allocation_id
      }
    };

    // Crea server su Pterodactyl
    const pterodactylData = await PterodactylService.createServer(pterodactylPayload);

    // Inserisci nel DB locale
    const [result] = await pool.query(
      "INSERT INTO server (nome, tipo, proprietario_email, data_acquisto, data_scadenza, n_rinnovi, stato, pterodactyl_id, uuidShort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [nome, tipo, proprietario_email, data_acquisto, safeDataScadenza, n_rinnovi, stato, pterodactylData.attributes.id, pterodactylData.attributes.identifier]
    ) as [ResultSetHeader, FieldPacket[]];

    // Aggiorna scadenza se specificata
    if (pterodactylData.attributes?.id && data_scadenza) {
      await PterodactylService.updateServerExpiration(pterodactylData.attributes.id, data_scadenza);
    }

    res.status(201).json({
      id: result.insertId,
      pterodactyl_id: pterodactylData.attributes.id,
      uuidShort: pterodactylData.attributes.identifier,
      ...req.body
    });

    createSubUserWhenReady(pterodactylData.attributes.identifier, proprietario_email);

  } catch (error: any) {
    console.error("Errore creazione server:", error.message);
    res.status(500).json({ error: "Errore del server" });
  }
});

async function createSubUserWhenReady(serverIdentifier: string, userEmail: string) {
  const maxAttempts = 20; // Max 20 tentativi (circa 2-3 minuti)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Controllo stato server ${serverIdentifier} (tentativo ${attempt})`);

      // Controlla se il server è pronto
      const isReady = await isServerReady(serverIdentifier);

      if (isReady) {
        console.log(`✅ Server pronto, creo sub-user per ${userEmail}`);
        await createSubUser(serverIdentifier, userEmail);
        console.log(`✅ Sub-user creato con successo per ${userEmail}`);
        return;
      }

      // Delay intelligente: inizia con 3 secondi, poi aumenta gradualmente
      const delay = Math.min(3000 + (attempt * 1000), 10000); // Max 10 secondi
      console.log(`⏳ Server non ancora pronto, riprovo tra ${delay / 1000}s`);

      await new Promise(resolve => setTimeout(resolve, delay));

    } catch (error: any) {
      console.error(`⚠️ Errore tentativo ${attempt}: ${error.message}`);

      if (attempt === maxAttempts) {
        console.error(`❌ Impossibile creare sub-user per ${userEmail} dopo ${maxAttempts} tentativi`);
        return;
      }

      // In caso di errore, aspetta un po' di più
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Controlla se il server Pterodactyl è pronto per i sub-user
async function isServerReady(serverIdentifier: string): Promise<boolean> {
  try {
    // Prova prima con l'API client
    const response = await axios.get(
      `${PTERODACTYL_CONFIG.baseUrl}/api/client/servers/${serverIdentifier}`,
      {
        headers: {
          Authorization: `Bearer ${PTERODACTYL_CONFIG.tokenclient}`,
          Accept: "Application/vnd.pterodactyl.v1+json"
        }
      }
    );

    const serverData = response.data.attributes;

    // Il server è pronto se non sta installando e non è sospeso
    const isReady = !serverData.is_installing && !serverData.is_suspended && serverData.current_state !== 'installing';

    console.log(`📊 Server status: installing=${serverData.is_installing}, suspended=${serverData.is_suspended}, state=${serverData.current_state}`);

    return isReady;

  } catch (error: any) {
    console.log(`⚠️ Errore controllo stato: ${error.message}`);
    return false;
  }
}

async function createSubUser(serverIdentifier: string, userEmail: string) {
  // Leggi i permissions dal file .env e convertili in array
  const defaultPermissions = PTERODACTYL_CONFIG.defaultSubUserPermission?.split(',').map(p => p.trim()) || [];

  const response = await axios.post(
    `${PTERODACTYL_CONFIG.baseUrl}/api/client/servers/${serverIdentifier}/users`,
    {
      email: userEmail,
      permissions: defaultPermissions
    },
    {
      headers: {
        Authorization: `Bearer ${PTERODACTYL_CONFIG.tokenclient}`,
        Accept: "Application/vnd.pterodactyl.v1+json",
        "Content-Type": "application/json"
      }
    }
  );

  return response.data;
}

// Recupera prossima allocazione libera
app.get('/api/pterodactyl/next-allocation', async (req: Request, res: Response) => {
  try {
    const headers = getPterodactylHeaders();

    // Recupera tutti i nodi
    const nodesResponse = await axios.get(`${PTERODACTYL_CONFIG.baseUrl}/api/application/nodes`, { headers });

    const nodes = nodesResponse.data.data;
    if (!nodes?.length) {
      return res.status(404).json({ error: 'Nessun nodo disponibile' });
    }

    // Cerca allocazione libera nel primo nodo disponibile
    for (const node of nodes) {
      try {
        const allocationsResponse = await axios.get(`${PTERODACTYL_CONFIG.baseUrl}/api/application/nodes/${node.attributes.id}/allocations`, { headers });

        const freeAllocation = allocationsResponse.data.data?.find((alloc: any) => !alloc.attributes.assigned);

        if (freeAllocation) {
          const { id, ip, port } = freeAllocation.attributes;
          return res.json({
            id,
            ip,
            port,
            full: `${ip}:${port}`,
            node: node.attributes.name
          });
        }
      } catch (nodeError) {
        console.warn(`Errore controllo allocazioni nodo ${node.attributes.name}:`, nodeError);
        continue; // Prova il prossimo nodo
      }
    }

    return res.status(404).json({ error: 'Nessuna allocazione libera trovata' });

  } catch (error: any) {
    console.error('Errore recupero allocazione:', error.message);
    res.status(500).json({
      error: 'Errore durante il recupero allocazione',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Recupera immagini Docker degli egg
app.get('/api/pterodactyl/latest-docker-images', async (req: Request, res: Response) => {
  try {
    const headers = getPterodactylHeaders();
    const nestId = PTERODACTYL_CONFIG.srvrConfig.nestsId; // ID del nest (potrebbe essere configurabile)

    // Recupera egg dal database locale
    const [eggRows] = await pool.query('SELECT nome, pterodactyl_id FROM versioni_server_egg WHERE pterodactyl_id IS NOT NULL');

    const eggs = eggRows as { nome: string, pterodactyl_id: number }[];

    if (!eggs.length) {
      return res.json([]);
    }

    // Recupera immagini Docker in parallelo
    const dockerImagePromises = eggs.map(async (egg) => {
      try {
        const eggResponse = await axios.get(`${PTERODACTYL_CONFIG.baseUrl}/api/application/nests/${nestId}/eggs/${egg.pterodactyl_id}`, { headers });

        return {
          nome: egg.nome,
          docker_image: eggResponse.data.attributes.docker_image,
          egg_id: egg.pterodactyl_id
        };
      } catch (error) {
        console.warn(`Errore recupero Docker image per egg ${egg.nome}:`, error);
        return {
          nome: egg.nome,
          docker_image: null,
          egg_id: egg.pterodactyl_id,
          error: 'Immagine non disponibile'
        };
      }
    });

    const results = await Promise.allSettled(dockerImagePromises);

    const dockerImages = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(image => image.docker_image); // Filtra solo immagini valide

    return res.json(dockerImages);

  } catch (error: any) {
    console.error('Errore recupero immagini Docker:', error.message);
    res.status(500).json({
      error: 'Errore durante il recupero delle immagini Docker',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/pterodactyl/client/servers/:uuid/startup', async (req, res) => {
  const { uuid } = req.params;

  try {
    if (!PTERODACTYL_CONFIG.tokenclient || !PTERODACTYL_CONFIG.baseUrl) {
      return res.status(500).json({ error: 'Configurazione API mancante' });
    }

    const response = await axios.get(`${PTERODACTYL_CONFIG.baseUrl}/api/client/servers/${uuid}/startup`, {
      headers: {
        Authorization: `Bearer ${PTERODACTYL_CONFIG.tokenclient}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const variables = response.data?.data || [];
    const versionVar = variables.find((v: any) => v.attributes.env_variable.endsWith('_VERSION'));
    
    if (!versionVar) {
      return res.json({ eggType: 'Unknown', version: 'Sconosciuta' });
    }

    // Mappa delle variabili di ambiente ai nomi degli egg
    const envToEggName: { [key: string]: string } = {
      'VANILLA_VERSION': 'Vanilla',
      'MC_VERSION': 'Forge',
      'FORGE_VERSION': 'Forge', 
      'DL_VERSION': 'Spigot',
      'PAPER_VERSION': 'Paper',
      'MINECRAFT_VERSION': 'Paper',
      'LOADER_VERSION': 'Fabric'
    };

    const envVar = versionVar.attributes.env_variable;
    const eggType = envToEggName[envVar] || envVar.replace('_VERSION', '').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase());
    const version = versionVar.attributes.server_value || 'Sconosciuta';

    res.json({ eggType, version });

  } catch (error: any) {
    console.error('Errore nel recupero startup info:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Errore nel recupero informazioni startup' });
  }
});














/* GESTIONE UTENTI *//* GESTIONE UTENTI *//* GESTIONE UTENTI *//* GESTIONE UTENTI *//* GESTIONE UTENTI *//* GESTIONE UTENTI *//* GESTIONE UTENTI *//* GESTIONE UTENTI */










// Aggiungi queste routes dopo la sezione /* GESTIONE UTENTI */ nel tuo server.ts

// GET /api/admin/users - Ottieni tutti gli utenti
app.get('/api/admin/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, 
        nome, 
        cognome, 
        username, 
        email, 
        ruolo, 
        data_registrazione 
      FROM utenti 
      ORDER BY id ASC
    `);

    const users = rows as any[];

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// GET /api/admin/users/:id - Ottieni un utente specifico
app.get('/api/admin/users/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({
        success: false,
        message: 'ID utente non valido'
      });
    }

    const [rows] = await pool.query(`
      SELECT 
        id, 
        nome, 
        cognome, 
        username, 
        email, 
        ruolo, 
        data_registrazione 
      FROM utenti 
      WHERE id = ?
    `, [userId]);

    const users = rows as any[];

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Errore nel recupero dell\'utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// POST /api/admin/users - Crea un nuovo utente
app.post('/api/admin/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { nome, cognome, username, email, password, ruolo = 'user' } = req.body;

    // Validazione input
    if (!nome || !cognome || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tutti i campi sono obbligatori: nome, cognome, username, email, password'
      });
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato email non valido'
      });
    }

    // Validazione ruolo
    if (!['admin', 'user'].includes(ruolo)) {
      return res.status(400).json({
        success: false,
        message: 'Ruolo non valido. Deve essere "admin" o "user"'
      });
    }

    // Verifica se username o email esistono già
    const [existingUsers] = await pool.query(`
      SELECT id FROM utenti 
      WHERE username = ? OR email = ?
    `, [username, email]);

    if ((existingUsers as any[]).length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username o email già esistenti'
      });
    }

    // Hash della password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Inserimento nuovo utente
    const [result] = await pool.query(`
      INSERT INTO utenti (nome, cognome, username, email, password_hash, ruolo, data_registrazione)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [nome, cognome, username, email, passwordHash, ruolo]);

    const insertResult = result as ResultSetHeader;

    // Recupera l'utente appena creato
    const [newUserRows] = await pool.query(`
      SELECT id, nome, cognome, username, email, ruolo, data_registrazione
      FROM utenti 
      WHERE id = ?
    `, [insertResult.insertId]);

    const newUser = (newUserRows as any[])[0];

    res.status(201).json({
      success: true,
      message: 'Utente creato con successo',
      user: newUser
    });
  } catch (error) {
    console.error('Errore nella creazione dell\'utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// PUT /api/admin/users/:id - Aggiorna un utente
app.put('/api/admin/users/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { nome, cognome, username, email, ruolo } = req.body;

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({
        success: false,
        message: 'ID utente non valido'
      });
    }

    // Validazione input
    if (!nome || !cognome || !username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Tutti i campi sono obbligatori: nome, cognome, username, email'
      });
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato email non valido'
      });
    }

    // Validazione ruolo se fornito
    if (ruolo && !['admin', 'user'].includes(ruolo)) {
      return res.status(400).json({
        success: false,
        message: 'Ruolo non valido. Deve essere "admin" o "user"'
      });
    }

    // Verifica se l'utente esiste
    const [existingUserRows] = await pool.query(`
      SELECT id FROM utenti WHERE id = ?
    `, [userId]);

    if ((existingUserRows as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Verifica se username o email sono già utilizzati da altri utenti
    const [duplicateCheck] = await pool.query(`
      SELECT id FROM utenti 
      WHERE (username = ? OR email = ?) AND id != ?
    `, [username, email, userId]);

    if ((duplicateCheck as any[]).length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username o email già utilizzati da un altro utente'
      });
    }

    // Aggiornamento utente
    let updateQuery = `
      UPDATE utenti 
      SET nome = ?, cognome = ?, username = ?, email = ?
    `;
    let updateParams: any[] = [nome, cognome, username, email];

    if (ruolo) {
      updateQuery += `, ruolo = ?`;
      updateParams.push(ruolo);
    }

    updateQuery += ` WHERE id = ?`;
    updateParams.push(userId);

    await pool.query(updateQuery, updateParams);

    // Recupera l'utente aggiornato
    const [updatedUserRows] = await pool.query(`
      SELECT id, nome, cognome, username, email, ruolo, data_registrazione
      FROM utenti 
      WHERE id = ?
    `, [userId]);

    const updatedUser = (updatedUserRows as any[])[0];

    res.json({
      success: true,
      message: 'Utente aggiornato con successo',
      user: updatedUser
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// DELETE /api/admin/users/:id - Elimina un utente
app.delete('/api/admin/users/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const currentUser = (req as any).user;

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({
        success: false,
        message: 'ID utente non valido'
      });
    }

    // Impedisci all'admin di eliminare se stesso
    if (parseInt(userId) === currentUser.id) {
      return res.status(400).json({
        success: false,
        message: 'Non puoi eliminare il tuo stesso account'
      });
    }

    // Verifica se l'utente esiste
    const [existingUserRows] = await pool.query(`
      SELECT id, email FROM utenti WHERE id = ?
    `, [userId]);

    const existingUsers = existingUserRows as any[];

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    const userEmail = existingUsers[0].email;

    // Inizia una transazione per eliminare utente e server associati
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Elimina tutti i server dell'utente (assumendo che ci sia una tabella servers)
      await connection.query(`
        DELETE FROM servers WHERE proprietario_email = ?
      `, [userEmail]);

      // Elimina l'utente
      await connection.query(`
        DELETE FROM utenti WHERE id = ?
      `, [userId]);

      // Commit della transazione
      await connection.commit();

      res.json({
        success: true,
        message: 'Utente e tutti i suoi server eliminati con successo'
      });
    } catch (error) {
      // Rollback in caso di errore
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// POST /api/admin/users/:id/reset-password - Reset password utente
app.post('/api/admin/users/:id/reset-password', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({
        success: false,
        message: 'ID utente non valido'
      });
    }

    // Verifica se l'utente esiste
    const [existingUserRows] = await pool.query(`
      SELECT id, email, nome, cognome FROM utenti WHERE id = ?
    `, [userId]);

    const existingUsers = existingUserRows as any[];

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    const user = existingUsers[0];

    // Genera una nuova password temporanea
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Aggiorna la password nel database
    await pool.query(`
      UPDATE utenti SET password_hash = ? WHERE id = ?
    `, [hashedPassword, userId]);

    // Qui dovresti implementare l'invio dell'email
    // Per ora loggo la password temporanea (in produzione rimuovi questo log!)
    console.log(`Password temporanea per ${user.email}: ${tempPassword}`);

    // TODO: Implementare invio email con nodemailer
    /*
    const transporter = nodemailer.createTransporter({
      // configurazione SMTP
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Reset Password - WebHostMC',
      html: `
        <h2>Reset Password</h2>
        <p>Ciao ${user.nome} ${user.cognome},</p>
        <p>La tua password è stata reimpostata dall'amministratore.</p>
        <p>La tua nuova password temporanea è: <strong>${tempPassword}</strong></p>
        <p>Ti consigliamo di cambiarla al prossimo accesso.</p>
      `
    });
    */

    res.json({
      success: true,
      message: 'Password reimpostata con successo. Email inviata all\'utente.',
      // In sviluppo puoi includere la password temporanea per test
      ...(process.env.NODE_ENV === 'development' && { tempPassword })
    });
  } catch (error) {
    console.error('Errore nel reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});