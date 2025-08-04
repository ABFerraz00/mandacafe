/**
 * Simulação de Banco de Dados usando arquivos JSON
 * Implementa as tabelas Categorias e Pratos conforme especificação
 */

const fs = require('fs-extra');
const path = require('path');

class Database {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
        this.categoriasFile = path.join(this.dataDir, 'categorias.json');
        this.pratosFile = path.join(this.dataDir, 'pratos.json');
        
        // Inicializar arquivos de dados se não existirem
        this.initializeData();
    }

    /**
     * Inicializa os arquivos de dados com dados padrão
     */
    async initializeData() {
        try {
            // Garantir que o diretório existe
            await fs.ensureDir(this.dataDir);

            // Inicializar categorias se não existir
            if (!await fs.pathExists(this.categoriasFile)) {
                const categoriasIniciais = [
                    { id_categoria: 1, nome_categoria: "Entradas", ordem_exibicao: 1 },
                    { id_categoria: 2, nome_categoria: "Pratos Principais", ordem_exibicao: 2 },
                    { id_categoria: 3, nome_categoria: "Sobremesas", ordem_exibicao: 3 },
                    { id_categoria: 4, nome_categoria: "Bebidas", ordem_exibicao: 4 }
                ];
                await fs.writeJson(this.categoriasFile, categoriasIniciais, { spaces: 2 });
            }

            // Inicializar pratos se não existir
            if (!await fs.pathExists(this.pratosFile)) {
                const pratosIniciais = [
                    {
                        id_prato: 1,
                        codigo_prato: "PRATO001",
                        nome_prato: "Bruschetta Italiana",
                        descricao: "Pão italiano tostado com tomate, manjericão e azeite extra virgem",
                        preco: 18.90,
                        disponivel: true,
                        id_categoria: 1,
                        tipo_item: "Cardápio"
                    },
                    {
                        id_prato: 2,
                        codigo_prato: "PRATO002",
                        nome_prato: "Salmão Grelhado",
                        descricao: "Filé de salmão grelhado com legumes e molho de ervas",
                        preco: 45.90,
                        disponivel: true,
                        id_categoria: 2,
                        tipo_item: "Cardápio"
                    },
                    {
                        id_prato: 3,
                        codigo_prato: "PRATO003",
                        nome_prato: "Tiramisu",
                        descricao: "Sobremesa italiana tradicional com café e mascarpone",
                        preco: 16.90,
                        disponivel: false,
                        id_categoria: 3,
                        tipo_item: "Cardápio"
                    }
                ];
                await fs.writeJson(this.pratosFile, pratosIniciais, { spaces: 2 });
            }
        } catch (error) {
            console.error('Erro ao inicializar dados:', error);
        }
    }

    /**
     * Busca todas as categorias ordenadas por ordem_exibicao
     */
    async getCategorias() {
        try {
            const categorias = await fs.readJson(this.categoriasFile);
            return categorias.sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            return [];
        }
    }

    /**
     * Busca categoria por ID
     */
    async getCategoriaById(id) {
        try {
            const categorias = await fs.readJson(this.categoriasFile);
            return categorias.find(cat => cat.id_categoria === parseInt(id));
        } catch (error) {
            console.error('Erro ao buscar categoria:', error);
            return null;
        }
    }

    /**
     * Busca todos os pratos
     */
    async getPratos() {
        try {
            const pratos = await fs.readJson(this.pratosFile);
            return pratos;
        } catch (error) {
            console.error('Erro ao buscar pratos:', error);
            return [];
        }
    }

    /**
     * Busca apenas pratos disponíveis agrupados por categoria
     */
    async getPratosDisponiveis() {
        try {
            const pratos = await this.getPratos();
            const categorias = await this.getCategorias();
            
            const pratosDisponiveis = pratos.filter(prato => prato.disponivel === true);
            
            // Agrupar por categoria
            const cardapio = categorias.map(categoria => {
                const pratosDaCategoria = pratosDisponiveis.filter(
                    prato => prato.id_categoria === categoria.id_categoria
                );
                
                return {
                    categoria: categoria.nome_categoria,
                    ordem_exibicao: categoria.ordem_exibicao,
                    pratos: pratosDaCategoria
                };
            }).filter(categoria => categoria.pratos.length > 0);
            
            return cardapio;
        } catch (error) {
            console.error('Erro ao buscar cardápio:', error);
            return [];
        }
    }

    /**
     * Busca prato por ID
     */
    async getPratoById(id) {
        try {
            const pratos = await fs.readJson(this.pratosFile);
            return pratos.find(prato => prato.id_prato === parseInt(id));
        } catch (error) {
            console.error('Erro ao buscar prato:', error);
            return null;
        }
    }

    /**
     * Cria um novo prato
     */
    async createPrato(dadosPrato) {
        try {
            const pratos = await fs.readJson(this.pratosFile);
            
            // Gerar novo ID
            const novoId = pratos.length > 0 ? Math.max(...pratos.map(p => p.id_prato)) + 1 : 1;
            
            // Gerar código do prato
            const codigoPrato = `PRATO${novoId.toString().padStart(3, '0')}`;
            
            const novoPrato = {
                id_prato: novoId,
                codigo_prato: codigoPrato,
                nome_prato: dadosPrato.nome_prato,
                descricao: dadosPrato.descricao,
                preco: parseFloat(dadosPrato.preco),
                disponivel: dadosPrato.disponivel !== undefined ? dadosPrato.disponivel : true,
                id_categoria: parseInt(dadosPrato.id_categoria),
                tipo_item: dadosPrato.tipo_item || "Cardápio"
            };
            
            pratos.push(novoPrato);
            await fs.writeJson(this.pratosFile, pratos, { spaces: 2 });
            
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
            const pratos = await fs.readJson(this.pratosFile);
            const indice = pratos.findIndex(prato => prato.id_prato === parseInt(id));
            
            if (indice === -1) {
                return null;
            }
            
            // Atualizar campos fornecidos
            if (dadosAtualizacao.nome_prato !== undefined) {
                pratos[indice].nome_prato = dadosAtualizacao.nome_prato;
            }
            if (dadosAtualizacao.descricao !== undefined) {
                pratos[indice].descricao = dadosAtualizacao.descricao;
            }
            if (dadosAtualizacao.preco !== undefined) {
                pratos[indice].preco = parseFloat(dadosAtualizacao.preco);
            }
            if (dadosAtualizacao.disponivel !== undefined) {
                pratos[indice].disponivel = dadosAtualizacao.disponivel;
            }
            if (dadosAtualizacao.id_categoria !== undefined) {
                pratos[indice].id_categoria = parseInt(dadosAtualizacao.id_categoria);
            }
            
            await fs.writeJson(this.pratosFile, pratos, { spaces: 2 });
            
            return pratos[indice];
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
            const pratos = await fs.readJson(this.pratosFile);
            const indice = pratos.findIndex(prato => prato.id_prato === parseInt(id));
            
            if (indice === -1) {
                return null;
            }
            
            pratos[indice].disponivel = disponivel;
            await fs.writeJson(this.pratosFile, pratos, { spaces: 2 });
            
            return pratos[indice];
        } catch (error) {
            console.error('Erro ao atualizar disponibilidade:', error);
            throw error;
        }
    }
}

module.exports = new Database();

