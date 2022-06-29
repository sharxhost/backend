/*
  Warnings:

  - You are about to drop the column `usernname` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_usernname_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "usernname",
ADD COLUMN     "username" VARCHAR(16) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
