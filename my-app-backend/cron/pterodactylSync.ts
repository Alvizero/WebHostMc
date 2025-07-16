import axios from 'axios';
import cron from 'node-cron';
import mysql from 'mysql2/promise';
import db from '../src/db'; // tua connessione DB locale
import chalk from 'chalk';

const PANEL_URL = 'http://192.168.1.56';
const API_KEY = 'ptla_3Q6XeKhYeB0DgFubxyznuvwQpmtUoIuALpZwQqMrFmx';

async function main() {
  const pteroDb = await mysql.createConnection({
    host: '192.168.1.56',
    user: 'alvise',
    password: 'alvise1234',
    database: 'panel',
    dateStrings: true,
  });

  const syncServerData = async (): Promise<void> => {
    console.log(chalk.blue(`[${new Date().toISOString()}] 🕒 Esecuzione cron job: sincronizzazione server...`));
    try {
      const [localServers]: any[] = await db.query(`
        SELECT id, nome, data_scadenza, pterodactyl_id, n_backup 
        FROM server 
        WHERE pterodactyl_id IS NOT NULL
      `);

      const response = await axios.get(`${PANEL_URL}/api/application/servers`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'Application/vnd.pterodactyl.v1+json',
        }
      });

      const remoteServers = response.data.data;

      let updateCount = 0;

      for (const local of localServers) {
        const remote = remoteServers.find((r: any) => r.attributes.id.toString() === local.pterodactyl_id);
        if (!remote) continue;

        const updates: { field: string; oldValue: any; newValue: any }[] = [];

        // 🔁 Nome
        const remoteName = remote.attributes.name;
        if (remoteName !== local.nome) {
          updates.push({ field: 'nome', oldValue: local.nome, newValue: remoteName });
        }

        // 🔁 Data scadenza
        const [rows] = await pteroDb.query('SELECT exp_date FROM servers WHERE id = ?', [local.pterodactyl_id]);
        if (Array.isArray(rows) && rows.length > 0) {
          const scadenzaRaw = (rows[0] as any).exp_date as string;
          const newScadenza = scadenzaRaw?.slice(0, 10) ?? null;

          let localScadenza: string | null = null;
          if (local.data_scadenza instanceof Date) {
            localScadenza = local.data_scadenza.toISOString().slice(0, 10);
          } else if (typeof local.data_scadenza === 'string') {
            localScadenza = local.data_scadenza.slice(0, 10);
          }

          if (newScadenza && newScadenza !== localScadenza) {
            updates.push({ field: 'data_scadenza', oldValue: localScadenza, newValue: newScadenza });
          }
        }

        // ✅ n_backup ← feature_limits.backups
        const remoteBackupLimit = remote.attributes.feature_limits?.backups;
        if (typeof remoteBackupLimit === 'number' && local.n_backup !== remoteBackupLimit) {
          updates.push({ field: 'n_backup', oldValue: local.n_backup, newValue: remoteBackupLimit });
        }

        // 🔄 Applica aggiornamenti
        if (updates.length > 0) {
          const fields = updates.map(u => `${u.field} = ?`).join(', ');
          const values = updates.map(u => u.newValue);
          values.push(local.id);

          await db.query(`UPDATE server SET ${fields} WHERE id = ?`, values);

          for (const update of updates) {
            console.log(chalk.yellow(
              `[${new Date().toISOString()}] 🔁 Server ID ${local.id}: campo "${update.field}" aggiornato: "${update.oldValue}" → "${update.newValue}"`
            ));
          }
          updateCount++;
        }
      }

      console.log(chalk.green(`[${new Date().toISOString()}] ✅ Sincronizzazione completata. Server aggiornati: ${updateCount}`));
    } catch (err) {
      console.error(chalk.red(`[${new Date().toISOString()}] ❌ Errore nella sincronizzazione:`), err);
    }
  };

  // Esegui ogni 5 minuti
  cron.schedule('*/5 * * * *', syncServerData);

  // Esegui subito all'avvio
  await syncServerData();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
