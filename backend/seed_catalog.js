const db = require("./db");

async function popularCatalogo() {
    console.log("🌱 Iniciando a população do Catálogo...");

    // 1. Lista de produtos "Reais" para teste fácil
    const produtosReais = [
        { codigo: "1001", descricao: "PARAFUSO SEXTAVADO 1/2 POL", tipo: "FERRAGEM", unidade: "UN", cod_barras: "7890001001" },
        { codigo: "1002", descricao: "BUCHA DE NYLON 8MM", tipo: "FERRAGEM", unidade: "PCT", cod_barras: "7890001002" },
        { codigo: "1003", descricao: "MARTELO CARPINTEIRO", tipo: "FERRAMENTA", unidade: "UN", cod_barras: "7890001003" },
        { codigo: "1004", descricao: "FURADEIRA DE IMPACTO 500W", tipo: "ELETRICO", unidade: "UN", cod_barras: "7890001004" },
        { codigo: "1005", descricao: "CIMENTO VOTORAN 50KG", tipo: "MATERIAL", unidade: "SC", cod_barras: "7890001005" },
        { codigo: "1006", descricao: "TINTA ACRILICA BRANCA 18L", tipo: "PINTURA", unidade: "LT", cod_barras: "7890001006" },
        { codigo: "1007", descricao: "DISCO DE CORTE 4.5 POL", tipo: "ABRASIVO", unidade: "CX", cod_barras: "7890001007" },
        { codigo: "1008", descricao: "LUVA DE PROTECAO MALHA", tipo: "EPI", unidade: "PAR", cod_barras: "7890001008" },
        { codigo: "1009", descricao: "CABO FLEXIVEL 2.5MM", tipo: "ELETRICO", unidade: "MT", cod_barras: "7890001009" },
        { codigo: "1010", descricao: "LAMPADA LED 9W BIVOLT", tipo: "ILUMINACAO", unidade: "UN", cod_barras: "7890001010" }
    ];

    try {
        // Inserindo os produtos reais
        for (const prod of produtosReais) {
            await db.query(`
        INSERT INTO catalog (codigo, descricao, tipo, unidade, cod_barras)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (codigo) DO NOTHING;
      `, [prod.codigo, prod.descricao, prod.tipo, prod.unidade, prod.cod_barras]);
        }
        console.log(`Inseridos ${produtosReais.length} produtos reais.`);

        // 2. Loop para criar VOLUME (Ex: 500 produtos genéricos)
        // Isso é útil para testar se o sistema aguenta muitos dados
        const quantidadeExtra = 500;

        for (let i = 1; i <= quantidadeExtra; i++) {
            const codigoGerado = `PROD-${i.toString().padStart(4, '0')}`; // Gera PROD-0001, PROD-0002...
            const descGerada = `ITEM GENERICO DE TESTE N.${i}`;

            await db.query(`
        INSERT INTO catalog (codigo, descricao, tipo, unidade, cod_barras)
        VALUES ($1, $2, 'GERAL', 'UN', NULL)
        ON CONFLICT (codigo) DO NOTHING;
      `, [codigoGerado, descGerada]);
        }

        console.log(`Inseridos mais ${quantidadeExtra} produtos genéricos.`);
        console.log("Catálogo populado com sucesso!");

    } catch (error) {
        console.error("Erro ao popular catálogo:", error);
    } finally {
        process.exit();
    }
}

popularCatalogo();