// Script para corrigir planos no banco existente
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'maxxstream.db');

async function fix() {
  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_PATH)) {
    console.log('❌ Banco não encontrado em:', DB_PATH);
    process.exit(1);
  }

  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  // Ver planos atuais
  const antes = db.exec(`SELECT id, name, price FROM planos`);
  console.log('\n📋 Planos ANTES:');
  if (antes.length && antes[0].values) {
    antes[0].values.forEach(row => console.log(`  ID ${row[0]} | ${row[1]} | R$ ${row[2]}`));
  }

  // Atualizar Mensal para R$21
  db.run(`UPDATE planos SET price = 21, description = '40% OFF — Melhor custo-benefício' WHERE name = 'Mensal'`);

  // Remover Trimestral
  db.run(`DELETE FROM planos WHERE name = 'Trimestral'`);

  // Ver planos depois
  const depois = db.exec(`SELECT id, name, price FROM planos`);
  console.log('\n✅ Planos DEPOIS:');
  if (depois.length && depois[0].values) {
    depois[0].values.forEach(row => console.log(`  ID ${row[0]} | ${row[1]} | R$ ${row[2]}`));
  }

  // Salvar banco
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  console.log('\n💾 Banco salvo com sucesso!\n');
}

fix().catch(e => { console.error('Erro:', e); process.exit(1); });
