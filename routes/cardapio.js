/**
 * Rotas do Cardápio Público
 * Endpoints abertos para acesso público ao cardápio
 */

const express = require('express');
const router = express.Router();
const cardapioController = require('../controllers/cardapioControllerPrisma');

/**
 * GET /api/cardapio
 * Endpoint público para obter o cardápio completo
 * Retorna apenas pratos disponíveis agrupados por categoria
 */
router.get('/cardapio', cardapioController.getCardapioPublico);

/**
 * GET /api/cardapio/categorias
 * Endpoint público para obter apenas as categorias que possuem pratos disponíveis
 */
router.get('/cardapio/categorias', cardapioController.getCategoriasDisponiveis);

/**
 * GET /api/cardapio/categoria/:nome
 * Endpoint público para obter pratos de uma categoria específica
 * Parâmetro: nome da categoria (case-insensitive)
 */
router.get('/cardapio/categoria/:nome', cardapioController.getPratosPorCategoria);

/**
 * GET /api/cardapio/prato/:id
 * Endpoint público para obter detalhes de um prato específico
 * Retorna apenas se o prato estiver disponível
 */
router.get('/cardapio/prato/:id', cardapioController.getPratoPublico);

module.exports = router;

