const { logger, logPerformance, logSecurity } = require('../utils/logger');

// Métricas em memória (em produção, usar Redis ou banco)
const metrics = {
    requests: {
        total: 0,
        byMethod: {},
        byStatus: {},
        byEndpoint: {}
    },
    performance: {
        averageResponseTime: 0,
        slowRequests: 0,
        fastRequests: 0
    },
    errors: {
        total: 0,
        byType: {},
        last24h: []
    },
    database: {
        queries: 0,
        averageQueryTime: 0,
        slowQueries: 0
    },
    security: {
        suspiciousRequests: 0,
        blockedIPs: new Set(),
        rateLimitHits: 0
    }
};

// Middleware para coletar métricas
const metricsCollector = (req, res, next) => {
    const startTime = Date.now();
    
    // Incrementar contador de requisições
    metrics.requests.total++;
    metrics.requests.byMethod[req.method] = (metrics.requests.byMethod[req.method] || 0) + 1;
    
    // Rastrear endpoint
    const endpoint = req.route ? req.route.path : req.path;
    metrics.requests.byEndpoint[endpoint] = (metrics.requests.byEndpoint[endpoint] || 0) + 1;
    
    // Capturar métricas quando a resposta termina
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        // Métricas de status
        metrics.requests.byStatus[res.statusCode] = (metrics.requests.byStatus[res.statusCode] || 0) + 1;
        
        // Métricas de performance
        updatePerformanceMetrics(responseTime);
        
        // Log de performance para requisições lentas
        if (responseTime > 1000) {
            logPerformance('Slow Request', responseTime, {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode
            });
        }
    });
    
    next();
};

// Atualizar métricas de performance
const updatePerformanceMetrics = (responseTime) => {
    // Calcular média móvel simples
    const currentAvg = metrics.performance.averageResponseTime;
    const totalRequests = metrics.requests.total;
    metrics.performance.averageResponseTime = 
        (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
    
    // Categorizar requisições
    if (responseTime > 1000) {
        metrics.performance.slowRequests++;
    } else {
        metrics.performance.fastRequests++;
    }
};

// Middleware de segurança básica
const securityMonitor = (req, res, next) => {
    const ip = req.ip;
    const userAgent = req.get('User-Agent') || '';
    
    // Detectar tentativas suspeitas
    const suspiciousPatterns = [
        /sql/i,
        /union/i,
        /select/i,
        /drop/i,
        /delete/i,
        /script/i,
        /<script/i,
        /javascript:/i,
        /eval\(/i,
        /expression\(/i
    ];
    
    const requestString = `${req.url} ${req.body ? JSON.stringify(req.body) : ''}`;
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));
    
    if (isSuspicious) {
        metrics.security.suspiciousRequests++;
        logSecurity('Suspicious Request Pattern', req, {
            pattern: 'SQL Injection or XSS attempt',
            requestString: requestString.substring(0, 200)
        });
    }
    
    // Detectar user agents suspeitos
    const suspiciousUserAgents = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i
    ];
    
    const isSuspiciousUA = suspiciousUserAgents.some(pattern => pattern.test(userAgent));
    if (isSuspiciousUA && !userAgent.includes('Google') && !userAgent.includes('Bing')) {
        logSecurity('Suspicious User Agent', req, {
            userAgent,
            type: 'Potential Bot or Scraper'
        });
    }
    
    next();
};

// Middleware para capturar erros e atualizar métricas
const errorMetrics = (error, req, res, next) => {
    metrics.errors.total++;
    
    // Categorizar por tipo de erro
    const errorType = error.name || 'UnknownError';
    metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;
    
    // Manter histórico das últimas 24h
    const errorEntry = {
        timestamp: new Date(),
        type: errorType,
        message: error.message,
        url: req.url,
        method: req.method,
        ip: req.ip
    };
    
    metrics.errors.last24h.push(errorEntry);
    
    // Limpar erros antigos (mais de 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    metrics.errors.last24h = metrics.errors.last24h.filter(
        err => err.timestamp > oneDayAgo
    );
    
    next(error);
};

// Função para obter métricas atuais
const getMetrics = () => {
    return {
        ...metrics,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
    };
};

// Função para resetar métricas
const resetMetrics = () => {
    metrics.requests = {
        total: 0,
        byMethod: {},
        byStatus: {},
        byEndpoint: {}
    };
    metrics.performance = {
        averageResponseTime: 0,
        slowRequests: 0,
        fastRequests: 0
    };
    metrics.errors = {
        total: 0,
        byType: {},
        last24h: []
    };
    metrics.database = {
        queries: 0,
        averageQueryTime: 0,
        slowQueries: 0
    };
    metrics.security = {
        suspiciousRequests: 0,
        blockedIPs: new Set(),
        rateLimitHits: 0
    };
    
    logger.info('Metrics Reset', { timestamp: new Date().toISOString() });
};

// Função para registrar operação de banco
const recordDatabaseOperation = (operation, duration) => {
    metrics.database.queries++;
    
    // Calcular média móvel
    const currentAvg = metrics.database.averageQueryTime;
    const totalQueries = metrics.database.queries;
    metrics.database.averageQueryTime = 
        (currentAvg * (totalQueries - 1) + duration) / totalQueries;
    
    // Contar queries lentas
    if (duration > 500) {
        metrics.database.slowQueries++;
    }
};

// Health check avançado
const getHealthStatus = async () => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '2.0.0',
        environment: process.env.NODE_ENV || 'development'
    };
    
    // Verificar métricas críticas
    const criticalIssues = [];
    
    // Performance
    if (metrics.performance.averageResponseTime > 2000) {
        criticalIssues.push('High average response time');
    }
    
    // Erros
    const errorRate = metrics.errors.total / Math.max(metrics.requests.total, 1);
    if (errorRate > 0.05) { // Mais de 5% de erro
        criticalIssues.push('High error rate');
    }
    
    // Memória
    const memUsage = process.memoryUsage();
    const memUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
    if (memUsagePercent > 0.9) {
        criticalIssues.push('High memory usage');
    }
    
    if (criticalIssues.length > 0) {
        health.status = 'WARNING';
        health.issues = criticalIssues;
    }
    
    health.metrics = {
        requests: metrics.requests.total,
        averageResponseTime: Math.round(metrics.performance.averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        memoryUsage: Math.round(memUsagePercent * 100),
        databaseQueries: metrics.database.queries
    };
    
    return health;
};

module.exports = {
    metricsCollector,
    securityMonitor,
    errorMetrics,
    getMetrics,
    resetMetrics,
    recordDatabaseOperation,
    getHealthStatus
};

