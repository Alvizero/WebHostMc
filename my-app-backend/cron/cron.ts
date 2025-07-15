import cron from 'node-cron';
import { syncServerNames } from './pterodactylSync';

cron.schedule('*/5 * * * *', async () => {
  console.log('🕒 Esecuzione cron job: controllo nomi server...');
  await syncServerNames();
});