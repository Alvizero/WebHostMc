import pool from './db';

export async function createTransaction(transactionData) {
  const { user_email, server_id, tipo, importo, metodo_pagamento, transaction_id } = transactionData;
  
  const [result] = await pool.execute(`
    INSERT INTO transazioni (user_email, server_id, tipo, importo, metodo_pagamento, transaction_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [user_email, server_id, tipo, importo, metodo_pagamento, transaction_id]);
  
  return result.insertId;
}

export async function getUserTransactions(userEmail) {
  const [rows] = await pool.execute(`
    SELECT t.*, s.nome_server
    FROM transazioni t
    LEFT JOIN servers s ON t.server_id = s.id
    WHERE t.user_email = ?
    ORDER BY t.data_transazione DESC
  `, [userEmail]);
  
  return rows;
}

export async function updateTransactionStatus(transactionId, status) {
  await pool.execute(
    'UPDATE transazioni SET stato = ? WHERE id = ?',
    [status, transactionId]
  );
}