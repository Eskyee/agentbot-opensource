-- AlterTable
ALTER TABLE "PlaygroundProject" ADD COLUMN "sandboxName" TEXT,
ADD COLUMN "sandboxUrl" TEXT,
ADD COLUMN "executionMode" TEXT DEFAULT 'sandpack';
