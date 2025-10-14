/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_KnownLanguages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_LearnLanguages` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."_KnownLanguages" DROP CONSTRAINT "_KnownLanguages_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_LearnLanguages" DROP CONSTRAINT "_LearnLanguages_B_fkey";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "_KnownLanguages" DROP CONSTRAINT "_KnownLanguages_AB_pkey",
ALTER COLUMN "B" SET DATA TYPE TEXT,
ADD CONSTRAINT "_KnownLanguages_AB_pkey" PRIMARY KEY ("A", "B");

-- AlterTable
ALTER TABLE "_LearnLanguages" DROP CONSTRAINT "_LearnLanguages_AB_pkey",
ALTER COLUMN "B" SET DATA TYPE TEXT,
ADD CONSTRAINT "_LearnLanguages_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "_KnownLanguages" ADD CONSTRAINT "_KnownLanguages_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LearnLanguages" ADD CONSTRAINT "_LearnLanguages_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
