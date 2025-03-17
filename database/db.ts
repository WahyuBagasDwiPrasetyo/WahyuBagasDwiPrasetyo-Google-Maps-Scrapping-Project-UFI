import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // Sesuai dengan konfigurasi MariaDB kamu
  database: "google_maps_scraper",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
