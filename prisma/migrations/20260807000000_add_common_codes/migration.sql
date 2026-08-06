-- CreateTable
CREATE TABLE "common_code_groups" (
    "id" BIGSERIAL NOT NULL,
    "group_code" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "description" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "common_code_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common_codes" (
    "id" BIGSERIAL NOT NULL,
    "group_code" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "code_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_use" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "common_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "common_code_groups_group_code_key" ON "common_code_groups"("group_code");

-- CreateIndex
CREATE UNIQUE INDEX "common_codes_group_code_code_key" ON "common_codes"("group_code", "code");

-- AddForeignKey
ALTER TABLE "common_codes" ADD CONSTRAINT "common_codes_group_code_fkey" FOREIGN KEY ("group_code") REFERENCES "common_code_groups"("group_code") ON DELETE CASCADE ON UPDATE CASCADE;
