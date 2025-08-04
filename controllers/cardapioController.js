/**
 * Controller para o Cardápio Público
 * Gerencia as operações relacionadas ao cardápio visível aos clientes
 */

const database = require('../models/database');

/**
 * GET /api/cardapio
 * Retorna o cardápio público com apenas pratos disponíveis
 * Agrupados por categoria e ordenados por ordem_exibicao
 */
const getCardapioPublico = async (req, res) => {
    try {
        console.log('Buscando cardápio público...');
        
        const cardapio = await database.getPratosDisponiveis();
        
        // Adicionar metadados úteis
        const response = {
            cardapio: cardapio,
            metadata: {
                total_categorias: cardapio.length,
                total_pratos: cardapio.reduce((total, categoria) => total + categoria.pratos.length, 0),
                ultima_atualizacao: new Date().toISOString()
            }
        };
        
        console.log(`Cardápio retornado: ${response.metadata.total_categorias} categorias, ${response.metadata.total_pratos} pratos`);
        
        res.json(response);
        
    } catch (error) {
        console.error('Erro ao buscar cardápio público:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar o cardápio no momento'
        });
    }
};

/**
 * GET /api/cardapio/categorias
 * Retorna apenas as categorias disponíveis (que possuem pratos disponíveis)
 */
const getCategoriasDisponiveis = async (req, res) => {
    try {
        console.log('Buscando categorias com pratos disponíveis...');
        
        const cardapio = await database.getPratosDisponiveis();
        const categorias = cardapio.map(item => ({
            nome_categoria: item.categoria,
            ordem_exibicao: item.ordem_exibicao,
            total_pratos: item.pratos.length
        }));
        
        res.json({
            categorias: categorias,
            total: categorias.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar as categorias'
        });
    }
};

/**
 * GET /api/cardapio/categoria/:nome
 * Retorna pratos disponíveis de uma categoria específica
 */
const getPratosPorCategoria = async (req, res) => {
    try {
        const nomeCategoria = req.params.nome;
        console.log(`Buscando pratos da categoria: ${nomeCategoria}`);
        
        const cardapio = await database.getPratosDisponiveis();
        const categoria = cardapio.find(cat => 
            cat.categoria.toLowerCase() === nomeCategoria.toLowerCase()
        );
        
        if (!categoria) {
            return res.status(404).json({
                error: 'Categoria não encontrada',
                message: `A categoria '${nomeCategoria}' não foi encontrada ou não possui pratos disponíveis`
            });
        }
        
        res.json({
            categoria: categoria.categoria,
            pratos: categoria.pratos,
            total_pratos: categoria.pratos.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar pratos por categoria:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar os pratos da categoria'
        });
    }
};

module.exports = {
    getCardapioPublico,
    getCategoriasDisponiveis,
    getPratosPorCategoria
};

