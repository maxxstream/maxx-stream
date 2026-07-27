const path = require('path');
const fs = require('fs');
const modulePath = path.join(__dirname, '..', 'backend', 'node_modules');
const initSqlJs = require(path.join(modulePath, 'sql.js'));

const DB_PATH = path.join(__dirname, '..', 'data', 'maxxstream.db');

async function main() {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  const fakes = db.exec(`SELECT id, name, email FROM clientes WHERE email IN ('marcos.r@gmail.com','juliana.s@hotmail.com','carlos.a@outlook.com','roberto.f@gmail.com')`);
  if (fakes[0]?.values?.length) {
    console.log(`Removendo ${fakes[0].values.length} clientes falsos...`);
    db.run(`DELETE FROM clientes WHERE email IN ('marcos.r@gmail.com','juliana.s@hotmail.com','carlos.a@outlook.com','roberto.f@gmail.com')`);
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    console.log('Clientes falsos removidos com sucesso!');
  } else {
    console.log('Nenhum cliente falso encontrado.');
  }

  const restantes = db.exec(`SELECT id, name, email FROM clientes`);
  console.log(`\nClientes restantes (${restantes[0]?.values?.length || 0}):`);
  if (restantes[0]?.values) {
    restantes[0].values.forEach(r => console.log(`   ${r[0]} - ${r[1]} (${r[2]})`));
  }
}

main().catch(console.error);
