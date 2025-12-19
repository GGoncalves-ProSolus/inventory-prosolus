<div align="center">

  # Inventario PorSolus
  
  **Sistema Inteligente de Gestão e Auditoria de Inventário**

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

  <br />
  
  [Sobre](#-sobre) • [Funcionalidades](#-funcionalidades) • [Layout](#-layout) • [Instalação](#-instalação) • [Tecnologias](#-tecnologias)

</div>

---

##  Sobre

O **InvMaster Pro** é uma solução completa para controle de estoque e auditoria de inventário. Desenvolvido para substituir planilhas manuais e sistemas lentos, ele oferece uma interface ágil focada em produtividade para digitadores e controle total para líderes de setor.

O sistema suporta **milhares de itens** (testado com +25k produtos), controle de acesso por setores (Solda, Pintura, Almoxarifado) e validação automática de contagens.

---

##  Funcionalidades

###  Controle de Acesso & Setorização
- **RBAC (Role-Based Access Control):** Diferenciação entre `Líderes` e `Digitadores`.
- **Visibilidade por Setor:** Digitadores veem apenas seus lançamentos; Líderes têm visão macro do setor.
- **Itens Gerais:** Suporte a um catálogo global visível para toda a empresa.

###  Gestão de Inventário
- **Busca Inteligente:** Pesquisa instantânea por Código, Código de Barras (EAN) ou Descrição.
- **Validação de Contagem:** Sistema de 1ª e 2ª contagem com cálculo automático de divergência.
- **Status Visual:** Indicadores coloridos para itens `INVENTARIADO`, `EM REVISÃO` ou `EM ANDAMENTO`.
- **Prevenção de Erros:** Bloqueio de inputs e validação de tipos de dados.

###  Performance & UX
- **Carregamento Otimizado:** Paginação e virtualização para lidar com grandes volumes de dados.
- **Interface Limpa:** Fundo branco para alto contraste e foco na tarefa.
- **Atalhos:** Navegação otimizada por teclado (Tab, Enter) para agilidade na digitação.

---

##  Instalação e Configuração

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v16 ou superior)
- [PostgreSQL](https://www.postgresql.org/)

### 1. Configuração do Banco de Dados
Crie um banco de dados no PostgreSQL chamado `inventory_db`. As tabelas serão criadas automaticamente pelo script de setup.

### 2. Backend (Servidor)
```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Configure o arquivo .env (Crie um arquivo .env baseado nas suas credenciais do Postgres)
# DB_USER=postgres
# DB_PASSWORD=suasenha
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=inventory_db

# Execute a criação das tabelas
node setup.js

# Inicie o servidor
node index.js
