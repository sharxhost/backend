-- CreateTable
CREATE TABLE "User" (
    "uuid" UUID NOT NULL,
    "usernname" VARCHAR(16) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_usernname_key" ON "User"("usernname");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
