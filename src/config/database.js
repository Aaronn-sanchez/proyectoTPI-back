const mysql2 = require('mysql2/promise')
const { DB_HOST, DB_USER, DB_NAME, DB_PASS } = process.env;

const db = mysql2.createPool({
  host: DB_HOST,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASS,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

module.exports = db;