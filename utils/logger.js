const winston = require('winston');
const path = require('path');

// Configuração de formatos personalizados
const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Configuração para desenvolvimento
const developmentFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
);

// Configuração de transports
const transports = [];

// Console transport (sempre ativo)
transports.push(
    new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? customFormat : developmentFormat,
        level: process.env.LOG_LEVEL || 'info'
    })
);

// File transports para produção
if (process.env.NODE_ENV === 'production') {
    // Log de erros
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );

    // Log combinado
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );

    // Log de acesso
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/access.log'),
            level: 'http',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );
}

// Criar logger principal
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: {
        service: 'restaurante-api',
        version: process.env.npm_package_version || '2.0.0',
        environment: process.env.NODE_ENV || 'development'
    },
    transports,
    // Não sair em caso de erro
    exitOnError: false
});

// Adicionar nível HTTP para logs de acesso
winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    http: 'magenta',
    debug: 'white'
});

// Funções utilitárias para logging
const logRequest = (req, res, responseTime) => {
    logger.http('HTTP Request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('Content-Length'),
        timestamp: new Date().toISOString()
    });
};

const logError = (error, req = null, additionalInfo = {}) => {
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...additionalInfo
    };

    if (req) {
        errorInfo.request = {
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            body: req.body,
            params: req.params,
            query: req.query
        };
    }

    logger.error('Application Error', errorInfo);
};

const logDatabaseOperation = (operation, table, duration, success = true, additionalInfo = {}) => {
    logger.info('Database Operation', {
        operation,
        table,
        duration: `${duration}ms`,
        success,
        ...additionalInfo
    });
};

const logPerformance = (operation, duration, additionalInfo = {}) => {
    const level = duration > 1000 ? 'warn' : 'info';
    logger[level]('Performance Metric', {
        operation,
        duration: `${duration}ms`,
        ...additionalInfo
    });
};

const logSecurity = (event, req, additionalInfo = {}) => {
    logger.warn('Security Event', {
        event,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
        ...additionalInfo
    });
};

// Middleware para capturar logs de requisições
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Capturar quando a resposta termina
    res.on('finish', () => {
        const duration = Date.now() - start;
        logRequest(req, res, duration);
    });
    
    next();
};

// Middleware para capturar erros
const errorLogger = (error, req, res, next) => {
    logError(error, req);
    next(error);
};

module.exports = {
    logger,
    logRequest,
    logError,
    logDatabaseOperation,
    logPerformance,
    logSecurity,
    requestLogger,
    errorLogger
};

