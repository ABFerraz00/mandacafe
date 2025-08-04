# Sistema de Gerenciamento de Restaurante - Backend

Backend Node.js para sistema de gerenciamento de cardápio de restaurante, migrado de arquivos JSON para PostgreSQL com Prisma ORM.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **Prisma** - ORM moderno para Node.js
- **Neon** - PostgreSQL serverless (produção)

## 📋 Funcionalidades

### API Pública
- ✅ Visualização do cardápio público
- ✅ Filtro por categorias
- ✅ Busca de pratos individuais
- ✅ Apenas pratos disponíveis

### API Administrativa
- ✅ CRUD completo de pratos
- ✅ Controle de disponibilidade
- ✅ Gerenciamento de categorias
- ✅ Estatísticas do cardápio

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn
- Conta no Neon (PostgreSQL online)

### 1. Clone e Instale
```bash
git clone <seu-repositorio>
cd restaurante-backend-postgresql
npm install
```

### 2. Configure o Banco de Dados
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com sua string de conexão do Neon
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

### 3. Execute as Migrações
```bash
# Gerar cliente Prisma
npm run build

# Aplicar migrações
npm run db:deploy

# Popular com dados iniciais
npm run db:seed
```

### 4. Inicie o Servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm run prod:start
```

## 📡 Endpoints da API

### Públicos
- `GET /api/status` - Status da API e banco
- `GET /api/cardapio` - Cardápio completo
- `GET /api/cardapio/categorias` - Categorias disponíveis
- `GET /api/cardapio/categoria/:nome` - Pratos por categoria
- `GET /api/cardapio/prato/:id` - Detalhes de um prato

### Administrativos (Requer Autenticação)
- `GET /api/admin/pratos` - Todos os pratos
- `POST /api/admin/pratos` - Criar prato
- `PUT /api/admin/pratos/:id` - Atualizar prato
- `PATCH /api/admin/pratos/:id/disponibilidade` - Alterar disponibilidade
- `GET /api/admin/categorias` - Todas as categorias

## 🐳 Docker

### Desenvolvimento Local
```bash
# Subir PostgreSQL local + aplicação
npm run docker:dev

# Parar containers
npm run docker:down
```

### Build para Produção
```bash
npm run docker:build
npm run docker:run
```

## 🚀 Deploy

### Railway
1. Conecte seu repositório
2. Configure a variável `DATABASE_URL`
3. Deploy automático

### Render
1. Use o arquivo `render.yaml`
2. Configure PostgreSQL addon
3. Deploy automático

### Heroku
```bash
# Adicione PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Configure variáveis
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

## 🗄️ Estrutura do Banco

### Tabela: categorias
- `id_categoria` (PK) - ID único
- `nome_categoria` - Nome da categoria
- `ordem_exibicao` - Ordem de exibição

### Tabela: pratos
- `id_prato` (PK) - ID único
- `codigo_prato` - Código único (PRATO001, etc.)
- `nome_prato` - Nome do prato
- `descricao` - Descrição detalhada
- `preco` - Preço (Decimal)
- `disponivel` - Disponibilidade (Boolean)
- `id_categoria` (FK) - Referência à categoria
- `tipo_item` - Tipo do item
- `created_at` - Data de criação
- `updated_at` - Data de atualização

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor
npm run db:studio        # Abrir Prisma Studio

# Banco de dados
npm run db:migrate       # Criar nova migração
npm run db:deploy        # Aplicar migrações
npm run db:seed          # Popular dados iniciais
npm run db:reset         # Reset completo

# Produção
npm run build            # Gerar cliente Prisma
npm run prod:setup       # Setup completo para produção
npm run prod:start       # Iniciar em produção

# Docker
npm run docker:dev       # Ambiente completo local
npm run docker:build     # Build da imagem
npm run docker:run       # Executar container
```

## 📊 Monitoramento

### Health Checks
- `/health` - Health check simples
- `/api/status` - Status detalhado com banco

### Logs
- Logs estruturados com Morgan
- Queries SQL visíveis em desenvolvimento
- Graceful shutdown implementado

## 🔒 Segurança

- Helmet.js para headers de segurança
- CORS configurável por ambiente
- Validação de entrada em todos endpoints
- Tratamento de erros sem exposição de dados

## 🧪 Testes

```bash
# Executar testes (quando implementados)
npm test

# Testar endpoints manualmente
curl http://localhost:3000/api/status
curl http://localhost:3000/api/cardapio
```

## 📝 Migração do JSON

Este projeto foi migrado de um sistema baseado em arquivos JSON para PostgreSQL:

### Antes (JSON)
- Dados em `data/categorias.json` e `data/pratos.json`
- Operações síncronas com fs-extra
- Sem relacionamentos formais

### Depois (PostgreSQL + Prisma)
- Banco relacional com constraints
- Operações assíncronas otimizadas
- Relacionamentos com foreign keys
- Migrations versionadas
- Type safety com Prisma

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique os logs da aplicação
2. Teste a conexão com o banco via `/api/status`
3. Consulte a documentação do Prisma
4. Abra uma issue no repositório

