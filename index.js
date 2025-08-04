/**
 * Servidor Express.js para o Módulo de Gerenciamento de Cardápio
 * Plataforma de Gerenciamento de Restaurante
 * Versão 2.0 - PostgreSQL + Prisma + Monitoramento
 * Atualizado: 2025-08-04 - Sistema completo de logs e métricas
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

// Importar sistema de logs e monitoramento
const { logger, requestLogger, errorLogger } = require('./utils/logger');
const { 
    metricsCollector, 
    securityMonitor, 
    errorMetrics, 
    getMetrics, 
    getHealthStatus 
} = require('./middleware/monitoring');

// Importar database para health check
const database = require('./models/prismaDatabase');

// Criar instância do Express
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela
    message: {
        error: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middlewares de segurança e otimização
app.use(helmet());
app.use(compression());
app.use(limiter);

// Middlewares de monitoramento (antes de outros middlewares)
app.use(metricsCollector);
app.use(securityMonitor);
app.use(requestLogger);

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

// Rota de health check simples para load balancers (Railway)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint de métricas (protegido em produção)
app.get('/api/metrics', async (req, res) => {
    try {
        const metrics = getMetrics();
        res.json({
            status: 'OK',
            metrics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao obter métricas', { error: error.message });
        res.status(500).json({
            status: 'ERROR',
            message: 'Erro ao obter métricas',
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint de health check avançado
app.get('/api/health', async (req, res) => {
    try {
        const health = await getHealthStatus();
        const statusCode = health.status === 'OK' ? 200 : 
                          health.status === 'WARNING' ? 200 : 503;
        
        res.status(statusCode).json(health);
    } catch (error) {
        logger.error('Erro no health check avançado', { error: error.message });
        res.status(503).json({
            status: 'ERROR',
            message: 'Erro no health check',
            timestamp: new Date().toISOString()
        });
    }
});

// Importar e usar rotas após configurar middlewares
try {
    const cardapioRoutes = require('./routes/cardapio');
    const adminRoutes = require('./routes/admin');
    const authRoutes = require('./routes/auth');
    
    app.use('/api', cardapioRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/auth', authRoutes);
    
    logger.info('Rotas carregadas com sucesso', {
        routes: ['cardapio', 'admin', 'auth']
    });
} catch (error) {
    logger.error('Erro ao carregar rotas', { error: error.message });
}

// Middleware para tratamento de rotas não encontradas
app.use('*', (req, res) => {
    logger.warn('Endpoint não encontrado', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    res.status(404).json({
        error: 'Endpoint não encontrado',
        message: `A rota ${req.originalUrl} não existe nesta API`,
        version: '2.0.0-postgresql'
    });
});

// Middleware global para tratamento de erros (deve ser o último)
app.use(errorMetrics);
app.use(errorLogger);
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    res.status(statusCode).json({
        error: statusCode === 500 ? 'Erro interno do servidor' : err.message,
        message: statusCode === 500 ? 'Ocorreu um erro inesperado no servidor' : err.message,
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Função para graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Iniciando graceful shutdown...');
    try {
        await database.disconnect();
        logger.info('Banco de dados desconectado');
        process.exit(0);
    } catch (error) {
        logger.error('Erro durante shutdown', { error: error.message });
        process.exit(1);
    }
};

// Handlers para sinais de shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handler para erros não capturados
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    gracefulShutdown();
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    logger.info('Servidor iniciado', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0-postgresql',
        database: 'PostgreSQL via Prisma',
        monitoring: 'Winston + Métricas ativas'
    });
    
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📋 API disponível em: http://localhost:${PORT}/api`);
    console.log(`🔧 Painel admin disponível em: http://localhost:${PORT}/api/admin`);
    console.log(`📊 Métricas disponíveis em: http://localhost:${PORT}/api/metrics`);
    console.log(`🏥 Health check em: http://localhost:${PORT}/api/health`);
    console.log(`💾 Banco: PostgreSQL via Prisma`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 Logs: Winston (console + arquivos em produção)`);
});

module.exports = app;

