import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { PrismaClient } from '@prisma/client';

const apiEnvPath = fileURLToPath(new URL('../.env', import.meta.url));
const configuredDatabaseUrl = process.env.DATABASE_URL;
const hasPlaceholderUrl =
  configuredDatabaseUrl &&
  /(?:HOST(?::\d+)?|USER:PASSWORD|\/DATABASE(?:[?]|$))/i.test(configuredDatabaseUrl);

if (existsSync(apiEnvPath) && (!configuredDatabaseUrl || hasPlaceholderUrl)) {
  const apiEnv = parseEnv(readFileSync(apiEnvPath, 'utf8'));
  if (apiEnv.DATABASE_URL) {
    process.env.DATABASE_URL = apiEnv.DATABASE_URL;
  }
}

const prisma = new PrismaClient();

const genres = [
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Science Fiction', slug: 'science-fiction' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Biography', slug: 'biography' },
];

const books = [
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy' },
  { title: 'The Fellowship of the Ring', author: 'J.R.R. Tolkien', genre: 'Fantasy' },
  { title: 'A Game of Thrones', author: 'George R.R. Martin', genre: 'Fantasy' },
  { title: 'The Way of Kings', author: 'Brandon Sanderson', genre: 'Fantasy' },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy' },
  { title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling', genre: 'Fantasy' },
  { title: 'The Last Wish', author: 'Andrzej Sapkowski', genre: 'Fantasy' },
  { title: 'The Eye of the World', author: 'Robert Jordan', genre: 'Fantasy' },
  { title: 'American Gods', author: 'Neil Gaiman', genre: 'Fantasy' },
  { title: 'The Color of Magic', author: 'Terry Pratchett', genre: 'Fantasy' },
  { title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction' },
  { title: "Ender's Game", author: 'Orson Scott Card', genre: 'Science Fiction' },
  { title: 'Neuromancer', author: 'William Gibson', genre: 'Science Fiction' },
  { title: 'Foundation', author: 'Isaac Asimov', genre: 'Science Fiction' },
  { title: 'Snow Crash', author: 'Neal Stephenson', genre: 'Science Fiction' },
  { title: 'The Martian', author: 'Andy Weir', genre: 'Science Fiction' },
  { title: 'Hyperion', author: 'Dan Simmons', genre: 'Science Fiction' },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', genre: 'Science Fiction' },
  { title: 'Brave New World', author: 'Aldous Huxley', genre: 'Science Fiction' },
  { title: 'Fahrenheit 451', author: 'Ray Bradbury', genre: 'Science Fiction' },
  { title: 'The Big Sleep', author: 'Raymond Chandler', genre: 'Mystery' },
  { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', genre: 'Mystery' },
  { title: 'Gone Girl', author: 'Gillian Flynn', genre: 'Mystery' },
  { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', genre: 'Mystery' },
  { title: 'And Then There Were None', author: 'Agatha Christie', genre: 'Mystery' },
  { title: 'The Murders in the Rue Morgue', author: 'Edgar Allan Poe', genre: 'Mystery' },
  { title: 'In the Woods', author: 'Tana French', genre: 'Mystery' },
  { title: 'The Maltese Falcon', author: 'Dashiell Hammett', genre: 'Mystery' },
  { title: 'The Da Vinci Code', author: 'Dan Brown', genre: 'Mystery' },
  { title: 'Shutter Island', author: 'Dennis Lehane', genre: 'Mystery' },
  { title: 'Educated', author: 'Tara Westover', genre: 'Biography' },
  { title: 'The Diary of a Young Girl', author: 'Anne Frank', genre: 'Biography' },
  { title: 'Steve Jobs', author: 'Walter Isaacson', genre: 'Biography' },
  { title: 'Becoming', author: 'Michelle Obama', genre: 'Biography' },
  { title: 'Long Walk to Freedom', author: 'Nelson Mandela', genre: 'Biography' },
  { title: 'The Autobiography of Malcolm X', author: 'Malcolm X', genre: 'Biography' },
  { title: 'Alexander Hamilton', author: 'Ron Chernow', genre: 'Biography' },
  { title: 'The Wright Brothers', author: 'David McCullough', genre: 'Biography' },
  { title: 'Born a Crime', author: 'Trevor Noah', genre: 'Biography' },
  { title: 'I Know Why the Caged Bird Sings', author: 'Maya Angelou', genre: 'Biography' },
];

function createDemoIsbn(index: number): string {
  const body = `978${String(index).padStart(9, '0')}`;
  let weightedSum = 0;
  for (let position = 0; position < body.length; position++) {
    weightedSum += Number(body[position]) * (position % 2 === 0 ? 1 : 3);
  }
  return `${body}${(10 - (weightedSum % 10)) % 10}`;
}

async function main(): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const previousDemoIsbns = Array.from({ length: 15 }, (_, index) =>
      createDemoIsbn(index + 1),
    );
    await transaction.book.deleteMany({
      where: {
        isbn: { in: previousDemoIsbns },
        reviews: { none: {} },
      },
    });
    await transaction.genre.deleteMany({
      where: {
        name: { in: ['Fiction', 'Technology', 'History', 'Science'] },
        books: { none: {} },
      },
    });

    const genreIds = new Map<string, number>();

    for (const { name, slug } of genres) {
      const genre = await transaction.genre.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
      });
      genreIds.set(name, genre.id);
    }

    for (const [index, book] of books.entries()) {
      const genreId = genreIds.get(book.genre);
      if (genreId === undefined) {
        throw new Error(`Missing seeded genre: ${book.genre}`);
      }

      await transaction.book.upsert({
        where: { title_author: { title: book.title, author: book.author } },
        update: {
          isbn: createDemoIsbn(index + 10_001),
          description: `${book.title} by ${book.author}.`,
          genreId,
        },
        create: {
          title: book.title,
          author: book.author,
          isbn: createDemoIsbn(index + 10_001),
          description: `${book.title} by ${book.author}.`,
          totalCopies: 3,
          availableCopies: 3,
          genreId,
        },
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
