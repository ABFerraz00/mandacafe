/**
 * Rotas Administrativas
 * Endpoints protegidos para gerenciamento do cardápio
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminControllerPrisma');
const { verificarAutenticacao, logAcessoAdmin } = require('../middleware/auth');

// Aplicar middleware de autenticação a todas as rotas administrativas
router.use(verificarAutenticacao);
router.use(logAcessoAdmin);

/**
 * GET /api/admin/pratos
 * Endpoint restrito para obter todos os pratos (disponíveis e indisponíveis)
 * Usado pelo painel administrativo
 */
router.get('/pratos', adminController.getTodosPratos);

/**
 * GET /api/admin/pratos/:id
 * Endpoint restrito para obter um prato específico por ID
 * Usado para edição e visualização detalhada
 */
router.get('/pratos/:id', adminController.getPratoPorId);

/**
 * POST /api/admin/pratos
 * Endpoint restrito para criar um novo prato
 * Body: { nome_prato, descricao, preco, id_categoria, disponivel?, tipo_item? }
 */
router.post('/pratos', adminController.criarPrato);

/**
 * PUT /api/admin/pratos/:id
 * Endpoint restrito para atualizar um prato existente
 * Body: { nome_prato?, descricao?, preco?, id_categoria?, disponivel? }
 */
router.put('/pratos/:id', adminController.atualizarPrato);

/**
 * PATCH /api/admin/pratos/:id/disponibilidade
 * Endpoint restrito para alterar apenas a disponibilidade de um prato
 * Body: { disponivel: boolean }
 */
router.patch('/pratos/:id/disponibilidade', adminController.alterarDisponibilidade);

/**
 * GET /api/admin/categorias
 * Endpoint restrito para obter todas as categorias
 * Usado em formulários para seleção de categoria
 */
router.get('/categorias', adminController.getCategorias);

/**
 * Rota de teste para verificar autenticação
 * GET /api/admin/test-auth
 */
router.get('/test-auth', (req, res) => {
    res.json({
        message: 'Autenticação funcionando corretamente!',
        usuario: req.usuario,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

