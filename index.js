/**
 * Servidor Express.js para o Módulo de Gerenciamento de Cardápio
 * Plataforma de Gerenciamento de Restaurante
 * Versão 2.0 - PostgreSQL + Prisma
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');

// Importar database para health check
const database = require('./models/prismaDatabase');

// Criar instância do Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança e logging
app.use(helmet());
app.use(morgan('combined'));

// Configurar CORS para permitir acesso de qualquer origem
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Middlewares para parsing do corpo das requisições
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rota de status da API com health check do banco
app.get('/api/status', async (req, res) => {
    try {
        const dbHealth = await database.healthCheck();
        res.json({
            status: 'OK',
            message: 'API do Módulo de Gerenciamento de Cardápio está funcionando',
            version: '2.0.0-postgresql',
            database: dbHealth,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Erro no health check:', error);
        res.status(503).json({
            status: 'ERROR',
            message: 'Problema na conexão com o banco de dados',
            timestamp: new Date().toISOString(),
            error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection failed'
        });
    }
});

// Rota de health check simples para load balancers
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Importar e usar rotas após configurar middlewares
try {
    const cardapioRoutes = require('./routes/cardapio');
    const adminRoutes = require('./routes/admin');
    
    app.use('/api', cardapioRoutes);
    app.use('/api/admin', adminRoutes);
    
    console.log('✅ Rotas carregadas com sucesso');
} catch (error) {
    console.error('❌ Erro ao carregar rotas:', error);
}

// Middleware para tratamento de rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        message: `A rota ${req.originalUrl} não existe nesta API`,
        version: '2.0.0-postgresql'
    });
});

// Middleware global para tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro na aplicação:', err.stack);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado no servidor',
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Função para graceful shutdown
const gracefulShutdown = async () => {
    console.log('🔄 Iniciando graceful shutdown...');
    try {
        await database.disconnect();
        console.log('✅ Banco de dados desconectado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro durante shutdown:', error);
        process.exit(1);
    }
};

// Handlers para sinais de shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📋 API disponível em: http://localhost:${PORT}/api`);
    console.log(`🔧 Painel admin disponível em: http://localhost:${PORT}/api/admin`);
    console.log(`💾 Banco: PostgreSQL via Prisma`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

