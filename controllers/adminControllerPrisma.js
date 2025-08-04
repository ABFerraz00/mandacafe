/**
 * Controller para Operações Administrativas - Versão Prisma
 * Gerencia CRUD de pratos e operações restritas do sistema
 * Migrado de arquivos JSON para PostgreSQL via Prisma
 */

const database = require('../models/prismaDatabase');

/**
 * GET /api/admin/pratos
 * Retorna todos os pratos (disponíveis e indisponíveis) para o painel administrativo
 */
const getTodosPratos = async (req, res) => {
    try {
        console.log(`Acesso admin: buscando todos os pratos`);
        
        const pratos = await database.getPratos();
        const categorias = await database.getCategorias();
        
        // Com Prisma, os dados já vêm enriquecidos com categoria
        const pratosEnriquecidos = pratos.map(prato => ({
            ...prato,
            nome_categoria: prato.categoria ? prato.categoria.nome_categoria : 'Categoria não encontrada',
            // Converter Decimal para number para compatibilidade
            preco: parseFloat(prato.preco)
        }));
        
        // Estatísticas para o painel
        const estatisticas = {
            total_pratos: pratos.length,
            pratos_disponiveis: pratos.filter(p => p.disponivel).length,
            pratos_indisponiveis: pratos.filter(p => !p.disponivel).length,
            categorias_ativas: categorias.length
        };
        
        res.json({
            pratos: pratosEnriquecidos,
            estatisticas: estatisticas
        });
        
    } catch (error) {
        console.error('Erro ao buscar todos os pratos:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar os pratos',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * GET /api/admin/pratos/:id
 * Retorna um prato específico por ID
 */
const getPratoPorId = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Acesso admin: buscando prato ID ${id}`);
        
        const prato = await database.getPratoById(id);
        
        if (!prato) {
            return res.status(404).json({
                error: 'Prato não encontrado',
                message: `Não foi encontrado prato com ID ${id}`
            });
        }
        
        const pratoCompleto = {
            ...prato,
            nome_categoria: prato.categoria ? prato.categoria.nome_categoria : 'Categoria não encontrada',
            preco: parseFloat(prato.preco)
        };
        
        res.json(pratoCompleto);
        
    } catch (error) {
        console.error('Erro ao buscar prato por ID:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível carregar o prato',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * POST /api/admin/pratos
 * Cria um novo prato
 */
const criarPrato = async (req, res) => {
    try {
        console.log(`Acesso admin: criando novo prato`);
        
        const { nome_prato, descricao, preco, id_categoria, disponivel, tipo_item } = req.body;
        
        // Validações básicas
        if (!nome_prato || !descricao || !preco || !id_categoria) {
            return res.status(400).json({
                error: 'Dados inválidos',
                message: 'Os campos nome_prato, descricao, preco e id_categoria são obrigatórios'
            });
        }
        
        // Verificar se a categoria existe
        const categoria = await database.getCategoriaById(id_categoria);
        if (!categoria) {
            return res.status(400).json({
                error: 'Categoria inválida',
                message: `Categoria com ID ${id_categoria} não encontrada`
            });
        }
        
        // Validar preço
        const precoNumerico = parseFloat(preco);
        if (isNaN(precoNumerico) || precoNumerico < 0) {
            return res.status(400).json({
                error: 'Preço inválido',
                message: 'O preço deve ser um número positivo'
            });
        }
        
        const dadosPrato = {
            nome_prato: nome_prato.trim(),
            descricao: descricao.trim(),
            preco: precoNumerico,
            id_categoria: parseInt(id_categoria),
            disponivel: disponivel !== undefined ? Boolean(disponivel) : true,
            tipo_item: tipo_item || 'Cardápio'
        };
        
        const novoPrato = await database.createPrato(dadosPrato);
        
        console.log(`Prato criado: ${novoPrato.codigo_prato} - ${novoPrato.nome_prato}`);
        
        res.status(201).json({
            message: 'Prato criado com sucesso',
            prato: {
                ...novoPrato,
                preco: parseFloat(novoPrato.preco),
                nome_categoria: novoPrato.categoria ? novoPrato.categoria.nome_categoria : undefined
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar prato:', error);
        
        // Tratar erro de código duplicado
        if (error.code === 'P2002' && error.meta?.target?.includes('codigo_prato')) {
            return res.status(400).json({
                error: 'Código duplicado',
                message: 'Já existe um prato com este código'
            });
        }
        
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível criar o prato',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * PUT /api/admin/pratos/:id
 * Atualiza um prato existente
 */
const atualizarPrato = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Acesso admin: atualizando prato ID ${id}`);
        
        // Verificar se o prato existe
        const pratoExistente = await database.getPratoById(id);
        if (!pratoExistente) {
            return res.status(404).json({
                error: 'Prato não encontrado',
                message: `Não foi encontrado prato com ID ${id}`
            });
        }
        
        const { nome_prato, descricao, preco, id_categoria, disponivel } = req.body;
        const dadosAtualizacao = {};
        
        // Validar e preparar dados para atualização
        if (nome_prato !== undefined) {
            if (!nome_prato.trim()) {
                return res.status(400).json({
                    error: 'Nome inválido',
                    message: 'O nome do prato não pode estar vazio'
                });
            }
            dadosAtualizacao.nome_prato = nome_prato.trim();
        }
        
        if (descricao !== undefined) {
            dadosAtualizacao.descricao = descricao.trim();
        }
        
        if (preco !== undefined) {
            const precoNumerico = parseFloat(preco);
            if (isNaN(precoNumerico) || precoNumerico < 0) {
                return res.status(400).json({
                    error: 'Preço inválido',
                    message: 'O preço deve ser um número positivo'
                });
            }
            dadosAtualizacao.preco = precoNumerico;
        }
        
        if (id_categoria !== undefined) {
            const categoria = await database.getCategoriaById(id_categoria);
            if (!categoria) {
                return res.status(400).json({
                    error: 'Categoria inválida',
                    message: `Categoria com ID ${id_categoria} não encontrada`
                });
            }
            dadosAtualizacao.id_categoria = parseInt(id_categoria);
        }
        
        if (disponivel !== undefined) {
            dadosAtualizacao.disponivel = Boolean(disponivel);
        }
        
        const pratoAtualizado = await database.updatePrato(id, dadosAtualizacao);
        
        console.log(`Prato atualizado: ${pratoAtualizado.codigo_prato} - ${pratoAtualizado.nome_prato}`);
        
        res.json({
            message: 'Prato atualizado com sucesso',
            prato: {
                ...pratoAtualizado,
                preco: parseFloat(pratoAtualizado.preco),
                nome_categoria: pratoAtualizado.categoria ? pratoAtualizado.categoria.nome_categoria : undefined
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar prato:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível atualizar o prato',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * PATCH /api/admin/pratos/:id/disponibilidade
 * Altera apenas o status de disponibilidade de um prato
 */
const alterarDisponibilidade = async (req, res) => {
    try {
        const id = req.params.id;
        const { disponivel } = req.body;
        
        console.log(`Acesso admin: alterando disponibilidade do prato ID ${id} para ${disponivel}`);
        
        // Validar parâmetro disponivel
        if (disponivel === undefined || typeof disponivel !== 'boolean') {
            return res.status(400).json({
                error: 'Parâmetro inválido',
                message: 'O campo "disponivel" é obrigatório e deve ser true ou false'
            });
        }
        
        // Verificar se o prato existe
        const pratoExistente = await database.getPratoById(id);
        if (!pratoExistente) {
            return res.status(404).json({
                error: 'Prato não encontrado',
                message: `Não foi encontrado prato com ID ${id}`
            });
        }
        
        const pratoAtualizado = await database.updateDisponibilidadePrato(id, disponivel);
        
        const status = disponivel ? 'disponível' : 'indisponível';
        console.log(`Prato ${pratoAtualizado.codigo_prato} agora está ${status}`);
        
        res.json({
            message: `Prato marcado como ${status} com sucesso`,
            prato: {
                ...pratoAtualizado,
                preco: parseFloat(pratoAtualizado.preco),
                nome_categoria: pratoAtualizado.categoria ? pratoAtualizado.categoria.nome_categoria : undefined
            }
        });
        
    } catch (error) {
        console.error('Erro ao alterar disponibilidade:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível alterar a disponibilidade do prato',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * GET /api/admin/categorias
 * Retorna todas as categorias para uso em formulários administrativos
 */
const getCategorias = async (req, res) => {
    try {
        console.log(`Acesso admin: buscando categorias`);
        
        const categorias = await database.getCategorias();
        
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

module.exports = {
    getTodosPratos,
    getPratoPorId,
    criarPrato,
    atualizarPrato,
    alterarDisponibilidade,
    getCategorias
};

