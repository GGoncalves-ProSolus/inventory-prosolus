
import React from 'react';
import { Database, Server, Code, FileCode, Terminal } from 'lucide-react';

const ArchitectureDocs: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Instalação do Banco de Dados (PostgreSQL)</h1>
        <p className="text-gray-500 mt-2 text-lg">
          Copie os scripts abaixo para criar a estrutura no seu servidor PostgreSQL.
        </p>
      </div>

      <div className="grid gap-8">

        {/* SQL Schema Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-primary border-b border-primary-700 flex items-center gap-3">
            <Database className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">1. Script SQL de Criação (schema.sql)</h2>
          </div>
          <div className="p-0">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 text-xs text-gray-500 font-mono">
              Execute este script no seu cliente PostgreSQL (pgAdmin, DBeaver, PSQL)
            </div>
            <pre className="bg-slate-900 text-slate-50 p-6 overflow-x-auto text-sm font-mono leading-relaxed">
              {`-- 1. Tabela de Usuários (Login)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL, -- Usado como Login
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Líderes de Equipe (Para Autocomplete)
CREATE TABLE leaders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO leaders (name) VALUES 
('Antônio'), ('Carlos'), ('Daniel'), ('Diego'), 
('Fabiana'), ('Gabriel'), ('João'), ('Joyce'), 
('Lycon'), ('Marinalva'), ('Mayara'), ('Paulo'), 
('Pedro'), ('Sidmar');

-- 3. Catálogo Mestre de Produtos (Importado do ERP)
CREATE TABLE catalog (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    tipo VARCHAR(10),
    unidade VARCHAR(10),
    cod_barras VARCHAR(50)
);

CREATE INDEX idx_catalog_cod_barras ON catalog(cod_barras);
CREATE INDEX idx_catalog_descricao ON catalog(descricao);

-- 4. Tabela de Inventário (Contagens)
CREATE TYPE inventory_status AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'INVENTARIADO', 'REVISAO');

CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    
    -- Dados do Sistema (Snapshot do catálogo no momento da contagem)
    codigo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    tipo VARCHAR(10),
    unidade_sistema VARCHAR(10),
    cod_barras VARCHAR(50),
    
    -- Dados Operacionais da Contagem
    digitador_nome VARCHAR(100),
    lider_equipe VARCHAR(100),
    armazem VARCHAR(10),       -- Ex: 01, 02, 04...
    codigo_etiqueta VARCHAR(50), -- Número da Ficha
    unidade_contagem VARCHAR(10),
    usou_balanca BOOLEAN DEFAULT FALSE,
    
    -- Armazenamento das Múltiplas Contagens
    -- Usamos JSONB para flexibilidade (array [10, 10.5, ...])
    contagens JSONB DEFAULT '[]'::jsonb,
    
    -- Campos calculados para performance
    diferenca DOUBLE PRECISION DEFAULT 0,
    status inventory_status DEFAULT 'PENDENTE',
    proxima_acao VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_codigo ON inventory_items(codigo);
CREATE INDEX idx_inventory_etiqueta ON inventory_items(codigo_etiqueta);
CREATE INDEX idx_inventory_status ON inventory_items(status);
`}
            </pre>
          </div>
        </section>

        {/* Python Model Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-accent border-b border-accent-600 flex items-center gap-3">
            <Code className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">2. Backend Python (SQLAlchemy + Pydantic)</h2>
          </div>
          <div className="p-0">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 text-xs text-gray-500 font-mono">
              Atualize seu `models.py` e `schemas.py` para suportar JSONB
            </div>
            <pre className="bg-slate-900 text-slate-50 p-6 overflow-x-auto text-sm font-mono leading-relaxed">
              {`from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), index=True, nullable=False)
    descricao = Column(Text, nullable=False)
    tipo = Column(String(10))
    unidade_sistema = Column(String(10))
    cod_barras = Column(String(50), index=True)
    
    digitador_nome = Column(String(100))
    lider_equipe = Column(String(100))
    armazem = Column(String(10))
    codigo_etiqueta = Column(String(50), index=True)
    unidade_contagem = Column(String(10))
    usou_balanca = Column(Boolean, default=False)
    
    # Campo JSON para armazenar array de contagens: [100, 102, 102, ...]
    contagens = Column(JSON, default=[])
    
    diferenca = Column(Float, default=0)
    status = Column(String(20), default="PENDENTE")
    proxima_acao = Column(String(255))
    
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Exemplo de Lógica de Rota (FastAPI) ---

@app.post("/items/contagem")
def salvar_contagem(item: ItemSchema, db: Session = Depends(get_db)):
    # Lógica simplificada de decisão
    contagens = [c for c in item.contagens if c is not None]
    
    if len(contagens) >= 2:
        ultimo = contagens[-1]
        penultimo = contagens[-2]
        diff = abs(ultimo - penultimo)
        tolerance = 0.0025 if item.usou_balanca else 0.0001
        
        if diff <= tolerance:
            status = "INVENTARIADO"
            acao = "Concluído"
        else:
            status = "REVISAO"
            acao = f"Realizar {len(contagens) + 1}ª Contagem"
    else:
        status = "EM_ANDAMENTO"
        acao = "Aguardando 2ª Contagem"

    # Salvar no banco
    db_item = InventoryItem(**item.dict(), status=status, proxima_acao=acao)
    # ... commit ...
`}
            </pre>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ArchitectureDocs;
