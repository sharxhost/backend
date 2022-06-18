/*
  Warnings:

  - The primary key for the `Image` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Image` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shortid]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shortid` to the `Image` table without a default value. This is not possible if the table is not empty.
  - The required column `uuid` was added to the `Image` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Image" DROP CONSTRAINT "Image_pkey",
DROP COLUMN "id",
ADD COLUMN     "shortid" CHAR(8) NOT NULL,
ADD COLUMN     "uuid" UUID NOT NULL,
ADD CONSTRAINT "Image_pkey" PRIMARY KEY ("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Image_shortid_key" ON "Image"("shortid");
