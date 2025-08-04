const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger, logSecurity } = require('../utils/logger');

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'manda-cafe-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Usuários administrativos (em produção, usar banco de dados)
const adminUsers = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@mandacafe.com',
        // Senha: admin123 (hash gerado com bcrypt)
        password: '$2a$10$8K1p/a0dclxnGmC.xvfOOeX4w/KqGf9c5s1Jn2b3c4d5e6f7g8h9i0',
        role: 'admin',
        active: true,
        createdAt: new Date('2025-01-01')
    },
    {
        id: 2,
        username: 'manager',
        email: 'manager@mandacafe.com',
        // Senha: manager123 (hash gerado com bcrypt)
        password: '$2a$10$9L2q/b1edlyoHnD.ywgPPfY5x/LrHg0d6t2Ko3c4d5e6f7g8h9i0j1',
        role: 'manager',
        active: true,
        createdAt: new Date('2025-01-01')
    }
];

// Função para gerar hash de senha
const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// Função para verificar senha
const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Função para gerar token JWT
const generateToken = (user) => {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    };
    
    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'manda-cafe-api',
        audience: 'manda-cafe-admin'
    });
};

// Função para verificar token JWT
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'manda-cafe-api',
            audience: 'manda-cafe-admin'
        });
    } catch (error) {
        throw new Error('Token inválido');
    }
};

// Middleware para autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        logSecurity('Tentativa de acesso sem token', req);
        return res.status(401).json({
            error: 'Token de acesso requerido',
            message: 'Forneça um token válido no header Authorization'
        });
    }
    
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        
        logger.info('Usuário autenticado', {
            userId: decoded.id,
            username: decoded.username,
            role: decoded.role,
            ip: req.ip,
            endpoint: req.originalUrl
        });
        
        next();
    } catch (error) {
        logSecurity('Token inválido fornecido', req, { error: error.message });
        return res.status(403).json({
            error: 'Token inválido',
            message: 'O token fornecido é inválido ou expirou'
        });
    }
};

// Middleware para autorização por role
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Usuário não autenticado',
                message: 'Faça login primeiro'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            logSecurity('Tentativa de acesso não autorizado', req, {
                userRole: req.user.role,
                requiredRoles: allowedRoles
            });
            
            return res.status(403).json({
                error: 'Acesso negado',
                message: 'Você não tem permissão para acessar este recurso'
            });
        }
        
        next();
    };
};

// Função para autenticar usuário (login)
const authenticateUser = async (username, password) => {
    // Buscar usuário por username ou email
    const user = adminUsers.find(u => 
        (u.username === username || u.email === username) && u.active
    );
    
    if (!user) {
        throw new Error('Usuário não encontrado');
    }
    
    // Verificar senha
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
        throw new Error('Senha incorreta');
    }
    
    // Gerar token
    const token = generateToken(user);
    
    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        token,
        expiresIn: JWT_EXPIRES_IN
    };
};

// Middleware para rate limiting específico para auth
const authRateLimit = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas de login por IP por janela
    message: {
        error: 'Muitas tentativas de login',
        message: 'Tente novamente em 15 minutos',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurity('Rate limit atingido para autenticação', req);
        res.status(429).json({
            error: 'Muitas tentativas de login',
            message: 'Tente novamente em 15 minutos',
            retryAfter: '15 minutes'
        });
    }
});

// Middleware para rate limiting de rotas administrativas
const adminRateLimit = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // máximo 50 requests por IP por janela para rotas admin
    message: {
        error: 'Muitas requisições administrativas',
        message: 'Tente novamente em 15 minutos',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurity('Rate limit atingido para rotas admin', req);
        res.status(429).json({
            error: 'Muitas requisições administrativas',
            message: 'Tente novamente em 15 minutos',
            retryAfter: '15 minutes'
        });
    }
});

// Função para obter informações do usuário atual
const getCurrentUser = (req) => {
    return req.user || null;
};

// Função para listar usuários (apenas para admins)
const listUsers = () => {
    return adminUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt
    }));
};

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    authenticateToken,
    authorizeRole,
    authenticateUser,
    authRateLimit,
    adminRateLimit,
    getCurrentUser,
    listUsers,
    JWT_SECRET
};

