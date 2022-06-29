-- CreateTable
CREATE TABLE "UploadKey" (
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "UploadKey_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadKey_userId_key" ON "UploadKey"("userId");

-- AddForeignKey
ALTER TABLE "UploadKey" ADD CONSTRAINT "UploadKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
