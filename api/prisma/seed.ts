import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genres = ['Fiction', 'Technology', 'History', 'Science'];

const books = [
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction' },
  { title: '1984', author: 'George Orwell', genre: 'Fiction' },
  { title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Fiction' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Fiction' },
  { title: 'Moby-Dick', author: 'Herman Melville', genre: 'Fiction' },
  { title: 'Clean Code', author: 'Robert C. Martin', genre: 'Technology' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', genre: 'Technology' },
  { title: 'Design Patterns', author: 'Erich Gamma', genre: 'Technology' },
  { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', genre: 'Technology' },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', genre: 'Technology' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History' },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', genre: 'History' },
  { title: "A People's History of the United States", author: 'Howard Zinn', genre: 'History' },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', genre: 'Science' },
  { title: 'Cosmos', author: 'Carl Sagan', genre: 'Science' },
];

async function main() {
  await prisma.$transaction(async (transaction) => {
    const genreIds = new Map<string, string>();

    for (const name of genres) {
      const genre = await transaction.genre.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      genreIds.set(name, genre.id);
    }

    for (const { title, author, genre } of books) {
      const genreId = genreIds.get(genre);
      if (!genreId) {
        throw new Error(`Missing seeded genre: ${genre}`);
      }

      await transaction.book.upsert({
        where: { title_author: { title, author } },
        update: { genreId },
        create: { title, author, genreId },
      });
    }
  });

  console.log(`Seeded ${genres.length} genres and ${books.length} books.`);
}

main()
  .catch((error: unknown) => {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });