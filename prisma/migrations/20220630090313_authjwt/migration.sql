-- CreateTable
CREATE TABLE "AuthJWT" (
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "AuthJWT_pkey" PRIMARY KEY ("token")
);

-- AddForeignKey
ALTER TABLE "AuthJWT" ADD CONSTRAINT "AuthJWT_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
