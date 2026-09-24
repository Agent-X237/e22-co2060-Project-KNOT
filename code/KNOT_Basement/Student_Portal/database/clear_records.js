const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'new_password',
  database: process.env.DB_NAME || 'knot_db'
};

async function clearRecords() {
  let connection;
  try {
    console.log("Connecting to MySQL database knot_db...");
    connection = await mysql.createConnection(dbConfig);
    
    console.log("Clearing all bookings and fault records...");
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('TRUNCATE TABLE bookings;');
    await connection.query('TRUNCATE TABLE faults;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log("Successfully wiped all bookings and fault records!");
  } catch (error) {
    console.error("Clearing records failed: ", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

clearRecords();
