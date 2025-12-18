const express = require("express");
const cors = require("cors");
const db = require("./db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// --- ROTAS DE AUTENTICAÇÃO ---
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) return res.status(401).json({ message: "Usuário não encontrado" });

        const user = result.rows[0];
        if (password === user.password_hash) {
            delete user.password_hash;
            res.json(user);
        } else {
            res.status(401).json({ message: "Senha incorreta" });
        }
    } catch (err) {
        res.status(500).send("Erro no servidor");
    }
});

app.post("/register", async (req, res) => {
    const { name, email, password, role, sector } = req.body;
    try {
        const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) return res.status(400).json({ message: "E-mail já existe!" });

        const result = await db.query(
            "INSERT INTO users (name, email, password_hash, role, sector) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, sector",
            [name, email, password, role || 'user', sector]
        );

        if (role === 'leader') {
            const leaderCheck = await db.query("SELECT * FROM leaders WHERE name = $1", [name]);
            if (leaderCheck.rows.length === 0) {
                await db.query("INSERT INTO leaders (name) VALUES ($1)", [name]);
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao criar usuário");
    }
});

// --- ROTA DE LÍDERES ---
app.get("/leaders", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM leaders ORDER BY name");
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// --- ROTAS DO CATÁLOGO DE PRODUTOS ---

// 1. Cadastrar Produto (Mantém a lógica caso precise cadastrar manual)
app.post("/catalog", async (req, res) => {
    const { codigo, descricao, tipo, unidade, cod_barras, user_id, sector } = req.body;

    try {
        const check = await db.query("SELECT * FROM catalog WHERE codigo = $1", [codigo]);
        if (check.rows.length > 0) {
            return res.status(400).json({ message: "Este código de produto já existe no sistema!" });
        }

        const result = await db.query(
            "INSERT INTO catalog (codigo, descricao, tipo, unidade, cod_barras, user_id, sector) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [codigo, descricao, tipo, unidade, cod_barras, user_id, sector]
        );

        res.json(result.rows[0]);
        console.log(`Produto cadastrado: ${descricao}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao cadastrar produto");
    }
});

// 2. Buscar Produto (ATUALIZADO: Busca Global Simplificada)
// Removemos o filtro de setor aqui para que todos encontrem os itens importados como 'GERAL'
app.get("/catalog/search", async (req, res) => {
    const { codigo, term } = req.query;

    try {
        let query = "SELECT * FROM catalog WHERE ";
        let values = [];

        if (codigo) {
            // Busca exata pelo código interno
            query += "codigo = $1";
            values = [codigo];
        } else if (term) {
            // Busca flexível: Código Interno OU Código de Barras OU Descrição (busca por texto)
            // O ILIKE permite buscar "Parafuso" escrevendo "parafuso" (ignora maiúsculas)
            query += "(codigo = $1 OR cod_barras = $1 OR descricao ILIKE $2)";
            values = [term, `%${term}%`];
        } else {
            return res.status(400).json({ message: "Faltou parâmetro de busca" });
        }

        const result = await db.query(query, values);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json(null);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// --- ROTAS DO INVENTÁRIO (Mantidas com Segurança de Setor) ---
app.get("/inventory", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "Usuário não identificado" });
    try {
        const userResult = await db.query("SELECT role, sector FROM users WHERE id = $1", [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: "Usuário inválido" });

        const { role, sector } = userResult.rows[0];
        let query = "";
        let params = [];

        // Aqui mantemos a regra: Líder vê o setor, Usuário vê o seu.
        if (role === 'leader' || role === 'admin') {
            if (sector) {
                query = "SELECT * FROM inventory_items WHERE sector = $1 ORDER BY created_at DESC";
                params = [sector];
            } else {
                query = "SELECT * FROM inventory_items WHERE user_id = $1 ORDER BY created_at DESC";
                params = [userId];
            }
        } else {
            query = "SELECT * FROM inventory_items WHERE user_id = $1 ORDER BY created_at DESC";
            params = [userId];
        }
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao listar inventário");
    }
});

app.post("/inventory", async (req, res) => {
    const item = req.body;
    const ultimaContagem = item.contagens.filter(c => c !== '').pop() || 0;
    try {
        const query = `
      INSERT INTO inventory_items (
        user_id, sector,
        codigo, descricao, tipo, unidade_sistema, cod_barras, 
        digitador_nome, lider_equipe, armazem, codigo_etiqueta, 
        unidade_contagem, usou_balanca, contagens, diferenca, 
        status, proxima_acao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
        const values = [
            item.user_id, item.sector,
            item.codigo, item.descricao, item.tipo, item.unidade_sistema, item.cod_barras,
            item.digitador_nome, item.lider_equipe, item.armazem, item.codigo_etiqueta,
            item.unidade_contagem, item.usou_balanca,
            ultimaContagem,
            item.diferenca, item.status, item.proxima_acao
        ];
        const result = await db.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao salvar:", err);
        res.status(500).send("Erro ao salvar item");
    }
});

app.put("/inventory/:id", async (req, res) => {
    const { id } = req.params;
    const item = req.body;
    const ultimaContagem = item.contagens.filter(c => c !== '').pop() || 0;
    try {
        const query = `
      UPDATE inventory_items SET 
        contagens = $1, diferenca = $2, status = $3, proxima_acao = $4, lider_equipe = $5
      WHERE id = $6 RETURNING *
    `;
        const result = await db.query(query, [ultimaContagem, item.diferenca, item.status, item.proxima_acao, item.lider_equipe, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send("Erro ao atualizar");
    }
});

app.delete("/inventory/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM inventory_items WHERE id = $1", [id]);
        res.json({ message: "Deletado" });
    } catch (err) {
        res.status(500).send("Erro ao deletar");
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} com busca Global de Catálogo! 🛡️`);
});