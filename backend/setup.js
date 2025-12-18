const db = require("./db");

async function criarTabelas() {
  try {
    // ... (Tabelas leaders e users continuam iguais) ...
    await db.query(`
      CREATE TABLE IF NOT EXISTS leaders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        sector VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // --- ATUALIZAÇÃO AQUI NA TABELA CATALOG ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS catalog (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,                   -- NOVO: Quem cadastrou
        sector VARCHAR(100),               -- NOVO: De qual setor é
        codigo VARCHAR(50) NOT NULL,       -- Removi o UNIQUE global, pois setores diferentes podem ter códigos iguais? 
                                           -- Se o código for único na empresa toda, mantenha UNIQUE. 
                                           -- Vou assumir que o código é único globalmente por enquanto.
        descricao VARCHAR(255) NOT NULL,
        tipo VARCHAR(50),
        unidade VARCHAR(20),
        cod_barras VARCHAR(100)
      );
    `);

    // Adiciona as colunas novas caso a tabela já exista
    await db.query(`ALTER TABLE catalog ADD COLUMN IF NOT EXISTS user_id INTEGER;`);
    await db.query(`ALTER TABLE catalog ADD COLUMN IF NOT EXISTS sector VARCHAR(100);`);

    // ... (Tabela inventory_items continua igual) ...
    await db.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        sector VARCHAR(100),
        codigo VARCHAR(50),
        descricao VARCHAR(255),
        tipo VARCHAR(50),
        unidade_sistema VARCHAR(20),
        cod_barras VARCHAR(100),
        digitador_nome VARCHAR(255),
        lider_equipe VARCHAR(255),
        armazem VARCHAR(100),
        codigo_etiqueta VARCHAR(100),
        unidade_contagem VARCHAR(20),
        usou_balanca BOOLEAN DEFAULT FALSE,
        contagens NUMERIC(15, 3),
        diferenca NUMERIC(15, 3),
        status VARCHAR(50),
        proxima_acao VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Banco de dados atualizado! Catálogo agora tem dono e setor. 🛡️");
  } catch (erro) {
    console.error("Erro ao atualizar tabelas:", erro);
  } finally {
    process.exit();
  }
}

criarTabelas();