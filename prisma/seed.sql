-- Script SQL para inserir dados iniciais
-- Sistema de Gerenciamento de Restaurante

-- Inserir categorias
INSERT INTO categorias (id_categoria, nome_categoria, ordem_exibicao) VALUES
(1, 'Entradas', 1),
(2, 'Pratos Principais', 2),
(3, 'Sobremesas', 3),
(4, 'Bebidas', 4);

-- Inserir pratos iniciais
INSERT INTO pratos (id_prato, codigo_prato, nome_prato, descricao, preco, disponivel, id_categoria, tipo_item) VALUES
(1, 'PRATO001', 'Bruschetta Italiana', 'Pão italiano tostado com tomate, manjericão e azeite extra virgem', 18.90, true, 1, 'Cardápio'),
(2, 'PRATO002', 'Salmão Grelhado', 'Filé de salmão grelhado com legumes e molho de ervas', 45.90, true, 2, 'Cardápio'),
(3, 'PRATO003', 'Tiramisu', 'Sobremesa italiana tradicional com café e mascarpone', 16.90, false, 3, 'Cardápio'),
(4, 'PRATO004', 'Risotto de Camarão', 'Risotto cremoso com camarões frescos e ervas finas', 42.90, false, 2, 'Cardápio'),
(5, 'PRATO005', 'Carpaccio de Carne', 'Fatias finas de carne bovina com rúcula e parmesão', 24.90, true, 1, 'Cardápio'),
(6, 'PRATO006', 'Frango à Parmegiana', 'Peito de frango empanado com molho de tomate e queijo', 32.90, true, 2, 'Cardápio'),
(7, 'PRATO007', 'Cheesecake de Frutas Vermelhas', 'Cheesecake cremoso com calda de frutas vermelhas', 14.90, true, 3, 'Cardápio'),
(8, 'PRATO008', 'Água Mineral', 'Água mineral sem gás 500ml', 4.50, true, 4, 'Cardápio'),
(9, 'PRATO009', 'Suco Natural de Laranja', 'Suco de laranja natural 300ml', 8.90, true, 4, 'Cardápio'),
(10, 'PRATO010', 'Vinho Tinto', 'Taça de vinho tinto selecionado', 18.00, true, 4, 'Cardápio');

-- Atualizar sequências para evitar conflitos
SELECT setval('categorias_id_categoria_seq', (SELECT MAX(id_categoria) FROM categorias));
SELECT setval('pratos_id_prato_seq', (SELECT MAX(id_prato) FROM pratos));

