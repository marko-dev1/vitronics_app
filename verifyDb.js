const db = require('./db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('Error verifying database:', err);
    return;
  }
  
  console.log('Database Tables:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
    // Print columns for each table
    db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
      if (!err) {
        console.log(`  Columns:`);
        columns.forEach(col => console.log(`  - ${col.name} (${col.type})`));
      }
    });
  });
});