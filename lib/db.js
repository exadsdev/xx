// lib/db.js
import mysql from "mysql2/promise";

let pool;

// รองรับทั้ง DATABASE_URL (เช่น mysql://user:pass@host:3306/db)
// หรือจะตั้ง HOST/USER/PASSWORD/DB แยกก็ได้
export function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (url) {
      pool = mysql.createPool(url);
    } else {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        waitForConnections: true,
        connectionLimit: 5,
      });
    }
    console.log("[DB] pool created");
  }
  return pool;
}

export async function ensureUsersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NULL,
      image TEXT NULL,
      provider VARCHAR(50) NULL,
      provider_account_id VARCHAR(255) NULL,
      last_login_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_email (email),
      KEY idx_provider_account (provider, provider_account_id)
    )
  `;
  const p = getPool();
  await p.execute(sql);
  console.log("[DB] users table ensured");
}

export async function upsertUser({ email, name, image, provider, providerAccountId, lastLoginAt }) {
  if (!email) return;
  await ensureUsersTable();
  const sql = `
    INSERT INTO users (email, name, image, provider, provider_account_id, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      image = VALUES(image),
      provider = VALUES(provider),
      provider_account_id = VALUES(provider_account_id),
      last_login_at = VALUES(last_login_at),
      updated_at = CURRENT_TIMESTAMP
  `;
  const params = [
    email,
    name || null,
    image || null,
    provider || null,
    providerAccountId || null,
    lastLoginAt || new Date(),
  ];
  const p = getPool();
  await p.execute(sql, params);
  console.log("[DB] upsert ok:", email);
}

// ตัวช่วยทดสอบการเชื่อม
export async function ping() {
  const p = getPool();
  const [rows] = await p.query("SELECT 1 AS ok");
  return rows?.[0]?.ok === 1;
}
