BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "User") THEN
        RAISE EXCEPTION 'Cannot migrate existing users automatically: add a secure password-hash migration before changing the User ID.';
    END IF;

    IF EXISTS (SELECT 1 FROM "Review") THEN
        RAISE EXCEPTION 'Cannot migrate existing reviews automatically: export or migrate reviews before changing Book and User IDs.';
    END IF;
END $$;

ALTER TABLE "Review" RENAME TO "Review_legacy";
ALTER TABLE "Book" RENAME TO "Book_legacy";
ALTER TABLE "Genre" RENAME TO "Genre_legacy";
ALTER TABLE "User" RENAME TO "User_legacy";

ALTER TABLE "Review_legacy" RENAME CONSTRAINT "Review_pkey" TO "Review_legacy_pkey";
ALTER INDEX "Review_bookId_userId_key" RENAME TO "Review_legacy_bookId_userId_key";
ALTER INDEX "Review_userId_idx" RENAME TO "Review_legacy_userId_idx";
ALTER TABLE "Book_legacy" RENAME CONSTRAINT "Book_pkey" TO "Book_legacy_pkey";
ALTER INDEX "Book_title_author_key" RENAME TO "Book_legacy_title_author_key";
ALTER INDEX "Book_genreId_idx" RENAME TO "Book_legacy_genreId_idx";
ALTER TABLE "Genre_legacy" RENAME CONSTRAINT "Genre_pkey" TO "Genre_legacy_pkey";
ALTER INDEX "Genre_name_key" RENAME TO "Genre_legacy_name_key";
ALTER TABLE "User_legacy" RENAME CONSTRAINT "User_pkey" TO "User_legacy_pkey";
ALTER INDEX "User_email_key" RENAME TO "User_legacy_email_key";

CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PATRON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "genreId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "bookId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Genre" ("name", "slug")
SELECT
    "name",
    regexp_replace(trim(lower("name")), '\s+', '-', 'g')
FROM "Genre_legacy";

WITH numbered_books AS (
    SELECT
        book."title",
        book."author",
        book."createdAt",
        genre.id AS genre_id,
        row_number() OVER (ORDER BY book."title", book."author") AS sequence
    FROM "Book_legacy" AS book
    JOIN "Genre_legacy" AS old_genre ON old_genre.id = book."genreId"
    JOIN "Genre" AS genre ON genre."name" = old_genre."name"
),
isbn_bodies AS (
    SELECT
        numbered_books.*,
        '978' || lpad(sequence::TEXT, 9, '0') AS body
    FROM numbered_books
),
numbered_isbns AS (
    SELECT
        isbn_bodies.*,
        body || (
            (
                10 - (
                    SELECT sum(
                        substring(body, digit_position, 1)::INTEGER
                        * CASE WHEN digit_position % 2 = 1 THEN 1 ELSE 3 END
                    )
                    FROM generate_series(1, 12) AS digit_position
                ) % 10
            ) % 10
        )::TEXT AS isbn
    FROM isbn_bodies
)
INSERT INTO "Book" (
    "title",
    "author",
    "isbn",
    "description",
    "totalCopies",
    "availableCopies",
    "genreId",
    "createdAt"
)
SELECT
    "title",
    "author",
    isbn,
    "title" || ' by ' || "author" || '.',
    1,
    1,
    genre_id,
    "createdAt"
FROM numbered_isbns;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");
CREATE INDEX "Book_genreId_idx" ON "Book"("genreId");
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");
CREATE UNIQUE INDEX "Book_title_author_key" ON "Book"("title", "author");
CREATE INDEX "Review_userId_idx" ON "Review"("userId");
CREATE UNIQUE INDEX "Review_bookId_userId_key" ON "Review"("bookId", "userId");

ALTER TABLE "Book"
    ADD CONSTRAINT "Book_genreId_fkey"
    FOREIGN KEY ("genreId") REFERENCES "Genre"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Review"
    ADD CONSTRAINT "Review_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "Book"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
    ADD CONSTRAINT "Review_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "Review_legacy";
DROP TABLE "Book_legacy";
DROP TABLE "Genre_legacy";
DROP TABLE "User_legacy";

COMMIT;
