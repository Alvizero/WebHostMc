// cron/pterodactylSync.ts
import axios from 'axios';
import cron from 'node-cron';
import db from '../src/db';
import chalk from 'chalk';

const PANEL_URL = 'http://192.168.1.56'; // ✅ Inserisci il tuo URL
const API_KEY = 'ptla_3Q6XeKhYeB0DgFubxyznuvwQpmtUoIuALpZwQqMrFmx'; // ✅ Inserisci la tua API key Application

interface PteroServer {
  attributes: {
    id: number;
    name: string;
  };
}

export const syncServerNames = async (): Promise<void> => {
  const start = new Date();
  console.log(chalk.blue(`[${start.toISOString()}] 🕒 Esecuzione cron job: controllo nomi server...`));

  try {
    // 1. Prendi i server locali
    const [localServers]: any = await db.query('SELECT id, nome, pterodactyl_id FROM server WHERE pterodactyl_id IS NOT NULL');

    // 2. Prendi tutti i server da Pterodactyl
    const response = await axios.get(`${PANEL_URL}/api/application/servers`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'Application/vnd.pterodactyl.v1+json'
      }
    });

    const remoteServers: PteroServer[] = response.data.data;
    let updateCount = 0;

    for (const local of localServers) {
      const remote = remoteServers.find(r => r.attributes.id.toString() === local.pterodactyl_id);
      if (!remote) continue;

      const remoteName = remote.attributes.name;
      if (remoteName !== local.nome) {
        const oldName = local.nome;

        // 3. Aggiorna DB
        await db.query('UPDATE server SET nome = ? WHERE id = ?', [remoteName, local.id]);

        // 4. Inserisci notifica
        const msg = `Il nome del server ID ${local.id} è stato aggiornato: "${oldName}" → "${remoteName}"`;

        console.log(chalk.yellow(
          `[${new Date().toISOString()}] 🔁 Aggiorno server ID ${local.id}: "${oldName}" → "${remoteName}"`
        ));
        console.log(chalk.green(
          `[${new Date().toISOString()}] 🕎 Inserita notifica: ${msg}`
        ));

        updateCount++;
      }
    }

    console.log(chalk.green(`[${new Date().toISOString()}] ✅ Sincronizzazione completata. Server aggiornati: ${updateCount}`));
  } catch (err) {
    console.error(chalk.red(`[${new Date().toISOString()}] ❌ Errore nella sincronizzazione:`), err);
  }
};

// Avvia cron job ogni 5 minuti
cron.schedule('*/5 * * * *', syncServerNames);

// Facoltativo: test manuale da terminale
if (require.main === module) {
  syncServerNames();
}
