/**
 * Modelo de Banco de Dados usando Prisma ORM
 * Substitui a implementação baseada em arquivos JSON
 */

const { PrismaClient } = require('@prisma/client');

class PrismaDatabase {
    constructor() {
        this.prisma = new PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });
        
        // Conectar ao banco na inicialização
        this.connect();
    }

    /**
     * Conecta ao banco de dados
     */
    async connect() {
        try {
            await this.prisma.$connect();
            console.log('✅ Conectado ao banco PostgreSQL via Prisma');
        } catch (error) {
            console.error('❌ Erro ao conectar ao banco:', error);
            throw error;
        }
    }

    /**
     * Desconecta do banco de dados
     */
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            console.log('✅ Desconectado do banco PostgreSQL');
        } catch (error) {
            console.error('❌ Erro ao desconectar do banco:', error);
        }
    }

    /**
     * Busca todas as categorias ordenadas por ordem_exibicao
     */
    async getCategorias() {
        try {
            const categorias = await this.prisma.categoria.findMany({
                orderBy: {
                    ordem_exibicao: 'asc'
                }
            });
            return categorias;
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            throw error;
        }
    }

    /**
     * Busca categoria por ID
     */
    async getCategoriaById(id) {
        try {
            const categoria = await this.prisma.categoria.findUnique({
                where: {
                    id_categoria: parseInt(id)
                }
            });
            return categoria;
        } catch (error) {
            console.error('Erro ao buscar categoria:', error);
            throw error;
        }
    }

    /**
     * Busca todos os pratos
     */
    async getPratos() {
        try {
            const pratos = await this.prisma.prato.findMany({
                include: {
                    categoria: true
                },
                orderBy: [
                    { categoria: { ordem_exibicao: 'asc' } },
                    { nome_prato: 'asc' }
                ]
            });
            return pratos;
        } catch (error) {
            console.error('Erro ao buscar pratos:', error);
            throw error;
        }
    }

    /**
     * Busca apenas pratos disponíveis agrupados por categoria
     */
    async getPratosDisponiveis() {
        try {
            const categorias = await this.prisma.categoria.findMany({
                include: {
                    pratos: {
                        where: {
                            disponivel: true
                        },
                        orderBy: {
                            nome_prato: 'asc'
                        }
                    }
                },
                orderBy: {
                    ordem_exibicao: 'asc'
                }
            });

            // Filtrar apenas categorias que têm pratos disponíveis
            const cardapio = categorias
                .filter(categoria => categoria.pratos.length > 0)
                .map(categoria => ({
                    categoria: categoria.nome_categoria,
                    ordem_exibicao: categoria.ordem_exibicao,
                    pratos: categoria.pratos
                }));

            return cardapio;
        } catch (error) {
            console.error('Erro ao buscar cardápio:', error);
            throw error;
        }
    }

    /**
     * Busca prato por ID
     */
    async getPratoById(id) {
        try {
            const prato = await this.prisma.prato.findUnique({
                where: {
                    id_prato: parseInt(id)
                },
                include: {
                    categoria: true
                }
            });
            return prato;
        } catch (error) {
            console.error('Erro ao buscar prato:', error);
            throw error;
        }
    }

    /**
     * Cria um novo prato
     */
    async createPrato(dadosPrato) {
        try {
            // Gerar código do prato automaticamente
            const ultimoPrato = await this.prisma.prato.findFirst({
                orderBy: {
                    id_prato: 'desc'
                }
            });
            
            const proximoId = ultimoPrato ? ultimoPrato.id_prato + 1 : 1;
            const codigoPrato = `PRATO${proximoId.toString().padStart(3, '0')}`;

            const novoPrato = await this.prisma.prato.create({
                data: {
                    codigo_prato: codigoPrato,
                    nome_prato: dadosPrato.nome_prato,
                    descricao: dadosPrato.descricao,
                    preco: parseFloat(dadosPrato.preco),
                    disponivel: dadosPrato.disponivel !== undefined ? dadosPrato.disponivel : true,
                    id_categoria: parseInt(dadosPrato.id_categoria),
                    tipo_item: dadosPrato.tipo_item || "Cardápio"
                },
                include: {
                    categoria: true
                }
            });

            return novoPrato;
        } catch (error) {
            console.error('Erro ao criar prato:', error);
            throw error;
        }
    }

    /**
     * Atualiza um prato existente
     */
    async updatePrato(id, dadosAtualizacao) {
        try {
            // Preparar dados para atualização
            const updateData = {};
            
            if (dadosAtualizacao.nome_prato !== undefined) {
                updateData.nome_prato = dadosAtualizacao.nome_prato;
            }
            if (dadosAtualizacao.descricao !== undefined) {
                updateData.descricao = dadosAtualizacao.descricao;
            }
            if (dadosAtualizacao.preco !== undefined) {
                updateData.preco = parseFloat(dadosAtualizacao.preco);
            }
            if (dadosAtualizacao.disponivel !== undefined) {
                updateData.disponivel = dadosAtualizacao.disponivel;
            }
            if (dadosAtualizacao.id_categoria !== undefined) {
                updateData.id_categoria = parseInt(dadosAtualizacao.id_categoria);
            }

            const pratoAtualizado = await this.prisma.prato.update({
                where: {
                    id_prato: parseInt(id)
                },
                data: updateData,
                include: {
                    categoria: true
                }
            });

            return pratoAtualizado;
        } catch (error) {
            console.error('Erro ao atualizar prato:', error);
            throw error;
        }
    }

    /**
     * Atualiza apenas a disponibilidade de um prato
     */
    async updateDisponibilidadePrato(id, disponivel) {
        try {
            const pratoAtualizado = await this.prisma.prato.update({
                where: {
                    id_prato: parseInt(id)
                },
                data: {
                    disponivel: disponivel
                },
                include: {
                    categoria: true
                }
            });

            return pratoAtualizado;
        } catch (error) {
            console.error('Erro ao atualizar disponibilidade:', error);
            throw error;
        }
    }

    /**
     * Verifica se o banco está funcionando
     */
    async healthCheck() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: 'OK', database: 'PostgreSQL', orm: 'Prisma' };
        } catch (error) {
            console.error('Erro no health check:', error);
            throw error;
        }
    }
}

module.exports = new PrismaDatabase();

