const express = require('express');
const { body, validationResult } = require('express-validator');
const { 
    authenticateUser, 
    authenticateToken, 
    authorizeRole,
    authRateLimit,
    getCurrentUser,
    listUsers
} = require('../middleware/auth');
const { logger, logSecurity } = require('../utils/logger');

const router = express.Router();

// Validações para login
const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('Username é obrigatório')
        .isLength({ min: 3 })
        .withMessage('Username deve ter pelo menos 3 caracteres'),
    body('password')
        .notEmpty()
        .withMessage('Senha é obrigatória')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres')
];

// POST /api/auth/login - Fazer login
router.post('/login', authRateLimit, loginValidation, async (req, res) => {
    try {
        // Verificar erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logSecurity('Tentativa de login com dados inválidos', req, {
                errors: errors.array()
            });
            
            return res.status(400).json({
                error: 'Dados inválidos',
                message: 'Verifique os dados fornecidos',
                details: errors.array()
            });
        }
        
        const { username, password } = req.body;
        
        logger.info('Tentativa de login', {
            username,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        // Autenticar usuário
        const authResult = await authenticateUser(username, password);
        
        logger.info('Login realizado com sucesso', {
            userId: authResult.user.id,
            username: authResult.user.username,
            role: authResult.user.role,
            ip: req.ip
        });
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: authResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logSecurity('Falha no login', req, {
            username: req.body.username,
            error: error.message
        });
        
        res.status(401).json({
            error: 'Falha na autenticação',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/auth/me - Obter informações do usuário atual
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = getCurrentUser(req);
        
        res.json({
            success: true,
            message: 'Informações do usuário',
            data: {
                user,
                loginTime: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erro ao obter informações do usuário', {
            error: error.message,
            userId: req.user?.id
        });
        
        res.status(500).json({
            error: 'Erro interno',
            message: 'Não foi possível obter informações do usuário',
            timestamp: new Date().toISOString()
        });
    }
});

// POST /api/auth/logout - Fazer logout (invalidar token)
router.post('/logout', authenticateToken, (req, res) => {
    try {
        logger.info('Logout realizado', {
            userId: req.user.id,
            username: req.user.username,
            ip: req.ip
        });
        
        // Em uma implementação real, você adicionaria o token a uma blacklist
        // Por simplicidade, apenas retornamos sucesso
        
        res.json({
            success: true,
            message: 'Logout realizado com sucesso',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erro no logout', {
            error: error.message,
            userId: req.user?.id
        });
        
        res.status(500).json({
            error: 'Erro interno',
            message: 'Não foi possível realizar logout',
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/auth/users - Listar usuários (apenas admins)
router.get('/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
    try {
        const users = listUsers();
        
        logger.info('Lista de usuários solicitada', {
            requestedBy: req.user.id,
            username: req.user.username,
            ip: req.ip
        });
        
        res.json({
            success: true,
            message: 'Lista de usuários',
            data: {
                users,
                total: users.length
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erro ao listar usuários', {
            error: error.message,
            requestedBy: req.user?.id
        });
        
        res.status(500).json({
            error: 'Erro interno',
            message: 'Não foi possível listar usuários',
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/auth/status - Status da autenticação
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema de autenticação ativo',
        data: {
            jwtEnabled: true,
            rateLimitEnabled: true,
            rolesSupported: ['admin', 'manager'],
            tokenExpiration: '24h'
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

