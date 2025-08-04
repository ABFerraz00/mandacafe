/**
 * Script de Seed para Popular o Banco de Dados
 * Sistema de Gerenciamento de Restaurante
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    try {
        // Limpar dados existentes (opcional)
        console.log('🧹 Limpando dados existentes...');
        await prisma.prato.deleteMany();
        await prisma.categoria.deleteMany();

        // Inserir categorias
        console.log('📂 Inserindo categorias...');
        const categorias = await prisma.categoria.createMany({
            data: [
                { id_categoria: 1, nome_categoria: 'Entradas', ordem_exibicao: 1 },
                { id_categoria: 2, nome_categoria: 'Pratos Principais', ordem_exibicao: 2 },
                { id_categoria: 3, nome_categoria: 'Sobremesas', ordem_exibicao: 3 },
                { id_categoria: 4, nome_categoria: 'Bebidas', ordem_exibicao: 4 }
            ]
        });
        console.log(`✅ ${categorias.count} categorias inseridas`);

        // Inserir pratos
        console.log('🍽️ Inserindo pratos...');
        const pratos = await prisma.prato.createMany({
            data: [
                {
                    id_prato: 1,
                    codigo_prato: 'PRATO001',
                    nome_prato: 'Bruschetta Italiana',
                    descricao: 'Pão italiano tostado com tomate, manjericão e azeite extra virgem',
                    preco: 18.90,
                    disponivel: true,
                    id_categoria: 1,
                    tipo_item: 'Cardápio'
                },
                {
                    id_prato: 2,
                    codigo_prato: 'PRATO002',
                    nome_prato: 'Salmão Grelhado',
                    descricao: 'Filé de salmão grelhado com legumes e molho de ervas',
                    preco: 45.90,
                    disponivel: true,
                    id_categoria: 2,
                    tipo_item: 'Cardápio'
                },
                {
                    id_prato: 3,
                    codigo_prato: 'PRATO003',
                    nome_prato: 'Tiramisu',
                    descricao: 'Sobremesa italiana tradicional com café e mascarpone',
                    preco: 16.90,
                    disponivel: false,
                    id_categoria: 3,
                    tipo_item: 'Cardápio'
                },
                {
                    id_prato: 4,
                    codigo_prato: 'PRATO004',
                    nome_prato: 'Risotto de Camarão',
                    descricao: 'Risotto cremoso com camarões frescos e ervas finas',
                    preco: 42.90,
                    disponivel: false,
                    id_categoria: 2,
                    tipo_item: 'Cardápio'
                },
                {
                    id_prato: 5,
                    codigo_prato: 'PRATO005',
                    nome_prato: 'Carpaccio de Carne',
                    descricao: 'Fatias finas de carne bovina com rúcula e parmesão',
                    preco: 24.90,
                    disponivel: true,
                    id_categoria: 1,
                    tipo_item: 'Cardápio'
                },
                {
                    id_prato: 6,
                    codigo_prato: 'PRATO006',
                    nome_prato: 'Frango à Parmegiana',
                    descricao: 'Peito de frango empanado com molho de tomate e queijo',
                    preco: 32.90,
                    disponivel: true,
                    id_categoria: 2,
                    tipo_item: 'Cardápio'
                },
                {
                    id_prato: 7,
                    codigo_prato: 'PRATO007',
                    nome_prato: 'Cheesecake de Frutas Vermelhas',
                    descricao: 'Cheesecake cremoso com calda de frutas vermelhas',
                    preco: 14.90,
                    disponivel: true,
                    id_categoria: 3,
                    tipo_item: 'Cardápio'
                },
                {
                    id_prato: 8,
                    codigo_prato: 'PRATO008',
                    nome_prato: 'Água Mineral',
                    descricao: 'Água mineral sem gás 500ml',
                    preco: 4.50,
                    disponivel: true,
                    id_categoria: 4,
                    tipo_item: 'Cardápio'
                },
                {
                    id_prato: 9,
                    codigo_prato: 'PRATO009',
                    nome_prato: 'Suco Natural de Laranja',
                    descricao: 'Suco de laranja natural 300ml',
                    preco: 8.90,
                    disponivel: true,
                    id_categoria: 4,
                    tipo_item: 'Cardápio'
                },
                {
                    id_prato: 10,
                    codigo_prato: 'PRATO010',
                    nome_prato: 'Vinho Tinto',
                    descricao: 'Taça de vinho tinto selecionado',
                    preco: 18.00,
                    disponivel: true,
                    id_categoria: 4,
                    tipo_item: 'Cardápio'
                }
            ]
        });
        console.log(`✅ ${pratos.count} pratos inseridos`);

        console.log('🎉 Seed concluído com sucesso!');
        
        // Mostrar estatísticas
        const totalCategorias = await prisma.categoria.count();
        const totalPratos = await prisma.prato.count();
        const pratosDisponiveis = await prisma.prato.count({ where: { disponivel: true } });
        
        console.log('\n📊 Estatísticas do banco:');
        console.log(`   Categorias: ${totalCategorias}`);
        console.log(`   Pratos: ${totalPratos}`);
        console.log(`   Pratos disponíveis: ${pratosDisponiveis}`);

    } catch (error) {
        console.error('❌ Erro durante o seed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

