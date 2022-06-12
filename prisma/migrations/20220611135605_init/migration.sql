-- CreateTable
CREATE TABLE "User" (
    "username" VARCHAR(255) NOT NULL,
    "uuid" UUID NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uuid")
);
