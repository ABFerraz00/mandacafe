/**
 * Controller para o Cardápio Público - Versão Prisma
 * Gerencia as operações relacionadas ao cardápio visível aos clientes
 * Migrado de arquivos JSON para PostgreSQL via Prisma
 */

const database = require('../models/prismaDatabase');

/**
 * GET /api/cardapio
 * Retorna o cardápio público com apenas pratos disponíveis
 * Agrupados por categoria e ordenados por ordem_exibicao
 */
const getCardapioPublico = async (req, res) => {
    try {
        console.log('Buscando cardápio público...');
        
        const cardapio = await database.getPratosDisponiveis();
        
        // Converter preços Decimal para number para compatibilidade
        const cardapioFormatado = cardapio.map(categoria => ({
            ...categoria,
            pratos: categoria.pratos.map(prato => ({
                ...prato,
                preco: parseFloat(prato.preco)
            }))
        }));
        
        // Adicionar metadados úteis
        const response = {
            cardapio: cardapioFormatado,
            metadata: {
                total_categorias: cardapioFormatado.length,
                total_pratos: cardapioFormatado.reduce((total, categoria) => total + categoria.pratos.length, 0),
                ultima_atualizacao: new Date().toISOString(),
                versao_api: '2.0.0-prisma'
            }
        };
        
        console.log(`Cardápio retornado: ${response.metadata.total_categorias} categorias, ${response.metadata.total_pratos} pratos`);
        
        res.json(response);
        
    } catch (error) {
        console.error('Erro ao buscar cardápio público:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar o cardápio no momento',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
            message: 'Não foi possível carregar as categorias',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        
        // Converter preços para number
        const pratosFormatados = categoria.pratos.map(prato => ({
            ...prato,
            preco: parseFloat(prato.preco)
        }));
        
        res.json({
            categoria: categoria.categoria,
            pratos: pratosFormatados,
            total_pratos: pratosFormatados.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar pratos por categoria:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar os pratos da categoria',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * GET /api/cardapio/prato/:id
 * Retorna detalhes de um prato específico (apenas se disponível)
 */
const getPratoPublico = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Buscando prato público ID: ${id}`);
        
        const prato = await database.getPratoById(id);
        
        if (!prato) {
            return res.status(404).json({
                error: 'Prato não encontrado',
                message: `Prato com ID ${id} não foi encontrado`
            });
        }
        
        if (!prato.disponivel) {
            return res.status(404).json({
                error: 'Prato indisponível',
                message: 'Este prato não está disponível no momento'
            });
        }
        
        const pratoFormatado = {
            ...prato,
            preco: parseFloat(prato.preco),
            nome_categoria: prato.categoria ? prato.categoria.nome_categoria : undefined
        };
        
        res.json(pratoFormatado);
        
    } catch (error) {
        console.error('Erro ao buscar prato público:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar o prato',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getCardapioPublico,
    getCategoriasDisponiveis,
    getPratosPorCategoria,
    getPratoPublico
};

