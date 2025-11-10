-- CreateTable
CREATE TABLE "Reaction" (
    "id" SERIAL NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "groupMessageId" INTEGER,
    "directMessageId" INTEGER,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reaction_groupMessageId_idx" ON "Reaction"("groupMessageId");

-- CreateIndex
CREATE INDEX "Reaction_directMessageId_idx" ON "Reaction"("directMessageId");

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "Reaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_groupMessageId_emoji_key" ON "Reaction"("userId", "groupMessageId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_directMessageId_emoji_key" ON "Reaction"("userId", "directMessageId", "emoji");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_groupMessageId_fkey" FOREIGN KEY ("groupMessageId") REFERENCES "GroupMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_directMessageId_fkey" FOREIGN KEY ("directMessageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
