-- CreateTable
CREATE TABLE "public"."categorias" (
    "id_categoria" SERIAL NOT NULL,
    "nome_categoria" VARCHAR(100) NOT NULL,
    "ordem_exibicao" INTEGER NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "public"."pratos" (
    "id_prato" SERIAL NOT NULL,
    "codigo_prato" VARCHAR(20) NOT NULL,
    "nome_prato" VARCHAR(200) NOT NULL,
    "descricao" TEXT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "id_categoria" INTEGER NOT NULL,
    "tipo_item" VARCHAR(50) NOT NULL DEFAULT 'Cardápio',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pratos_pkey" PRIMARY KEY ("id_prato")
);

-- CreateIndex
CREATE INDEX "categorias_ordem_exibicao_idx" ON "public"."categorias"("ordem_exibicao");

-- CreateIndex
CREATE UNIQUE INDEX "pratos_codigo_prato_key" ON "public"."pratos"("codigo_prato");

-- CreateIndex
CREATE INDEX "pratos_id_categoria_idx" ON "public"."pratos"("id_categoria");

-- CreateIndex
CREATE INDEX "pratos_disponivel_idx" ON "public"."pratos"("disponivel");

-- CreateIndex
CREATE INDEX "pratos_codigo_prato_idx" ON "public"."pratos"("codigo_prato");

-- AddForeignKey
ALTER TABLE "public"."pratos" ADD CONSTRAINT "pratos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;
