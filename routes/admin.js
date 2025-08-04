/**
 * Rotas Administrativas
 * Endpoints protegidos para gerenciamento do cardápio
 * Versão 2.0 - Com autenticação JWT
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminControllerPrisma');
const { authenticateToken, authorizeRole, adminRateLimit } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Aplicar rate limiting específico para rotas administrativas
router.use(adminRateLimit);

// Aplicar middleware de autenticação a todas as rotas administrativas
router.use(authenticateToken);

// Middleware para log de acesso administrativo
router.use((req, res, next) => {
    logger.info('Acesso administrativo', {
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

/**
 * GET /api/admin/pratos
 * Endpoint restrito para obter todos os pratos (disponíveis e indisponíveis)
 * Usado pelo painel administrativo
 * Requer: Autenticação JWT + Role admin ou manager
 */
router.get('/pratos', authorizeRole(['admin', 'manager']), adminController.getTodosPratos);

/**
 * GET /api/admin/pratos/:id
 * Endpoint restrito para obter um prato específico por ID
 * Usado para edição e visualização detalhada
 * Requer: Autenticação JWT + Role admin ou manager
 */
router.get('/pratos/:id', authorizeRole(['admin', 'manager']), adminController.getPratoPorId);

/**
 * POST /api/admin/pratos
 * Endpoint restrito para criar um novo prato
 * Body: { nome_prato, descricao, preco, id_categoria, disponivel?, tipo_item? }
 * Requer: Autenticação JWT + Role admin ou manager
 */
router.post('/pratos', authorizeRole(['admin', 'manager']), adminController.criarPrato);

/**
 * PUT /api/admin/pratos/:id
 * Endpoint restrito para atualizar um prato existente
 * Body: { nome_prato?, descricao?, preco?, id_categoria?, disponivel? }
 * Requer: Autenticação JWT + Role admin ou manager
 */
router.put('/pratos/:id', authorizeRole(['admin', 'manager']), adminController.atualizarPrato);

/**
 * PATCH /api/admin/pratos/:id/disponibilidade
 * Endpoint restrito para alterar apenas a disponibilidade de um prato
 * Body: { disponivel: boolean }
 * Requer: Autenticação JWT + Role admin ou manager
 */
router.patch('/pratos/:id/disponibilidade', authorizeRole(['admin', 'manager']), adminController.alterarDisponibilidade);

/**
 * GET /api/admin/categorias
 * Endpoint restrito para obter todas as categorias
 * Usado em formulários para seleção de categoria
 * Requer: Autenticação JWT + Role admin ou manager
 */
router.get('/categorias', authorizeRole(['admin', 'manager']), adminController.getCategorias);

/**
 * Rota de teste para verificar autenticação
 * GET /api/admin/test-auth
 * Requer: Autenticação JWT + Role admin ou manager
 */
router.get('/test-auth', authorizeRole(['admin', 'manager']), (req, res) => {
    res.json({
        success: true,
        message: 'Autenticação JWT funcionando corretamente!',
        user: req.user,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

