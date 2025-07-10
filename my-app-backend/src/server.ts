import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Carica variabili da .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

    // ✅ Login riuscito
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
    // Controllo email
    const [emailCheck] = await pool.query("SELECT id FROM utenti WHERE email = ?", [email]);
    if ((emailCheck as any[]).length > 0) {
      return res.status(409).json({ error: "Email già registrata" });
    }

    // Controllo username
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

app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});
