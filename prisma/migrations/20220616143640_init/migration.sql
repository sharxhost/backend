-- CreateTable
CREATE TABLE "Image" (
    "id" CHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "uploaded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" INTEGER NOT NULL,
    "hash" CHAR(64) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);
