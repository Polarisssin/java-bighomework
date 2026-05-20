"use strict";

const mysql = require("mysql2/promise");

let pool;

function getConfig() {
  return {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || "172.17.0.6",
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQL_USER || "root",
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "",
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "health-app-env-3g73ck72bcb11c66",
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4",
    dateStrings: true,
    connectTimeout: 10000,
  };
}

async function getPool() {
  if (!pool) pool = mysql.createPool(getConfig());
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await (await getPool()).execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function ping() {
  await query("SELECT 1");
  return true;
}

/** 多步写操作事务（入住、调床等） */
async function withTransaction(fn) {
  const conn = await (await getPool()).getConnection();
  try {
    await conn.beginTransaction();
    const txQuery = async (sql, params = []) => {
      const [rows] = await conn.execute(sql, params);
      return rows;
    };
    const txQueryOne = async (sql, params = []) => {
      const rows = await txQuery(sql, params);
      return rows[0] || null;
    };
    const result = await fn({ query: txQuery, queryOne: txQueryOne });
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = { getPool, query, queryOne, ping, getConfig, withTransaction };
