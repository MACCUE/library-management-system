import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Clear existing records to avoid unique constraint duplicates on re-run
  await prisma.book.deleteMany();
  await prisma.genre.deleteMany();

  const genreNames = ["Fantasy", "Science Fiction", "Mystery", "Biography"];
  const genres = await Promise.all(
    genreNames.map((name) =>
      prisma.genre.create({
        data: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
      }),
    ),
  );

  const sampleBooks = [
    // Fantasy
    { title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy" },
    { title: "The Fellowship of the Ring", author: "J.R.R. Tolkien", genre: "Fantasy" },
    { title: "A Game of Thrones", author: "George R.R. Martin", genre: "Fantasy" },
    { title: "The Way of Kings", author: "Brandon Sanderson", genre: "Fantasy" },
    { title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy" },
    { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", genre: "Fantasy" },
    { title: "The Last Wish", author: "Andrzej Sapkowski", genre: "Fantasy" },
    { title: "The Eye of the World", author: "Robert Jordan", genre: "Fantasy" },
    { title: "American Gods", author: "Neil Gaiman", genre: "Fantasy" },
    { title: "The Color of Magic", author: "Terry Pratchett", genre: "Fantasy" },

    // Science Fiction
    { title: "Dune", author: "Frank Herbert", genre: "Science Fiction" },
    { title: "Ender's Game", author: "Orson Scott Card", genre: "Science Fiction" },
    { title: "Neuromancer", author: "William Gibson", genre: "Science Fiction" },
    { title: "Foundation", author: "Isaac Asimov", genre: "Science Fiction" },
    { title: "Snow Crash", author: "Neal Stephenson", genre: "Science Fiction" },
    { title: "The Martian", author: "Andy Weir", genre: "Science Fiction" },
    { title: "Hyperion", author: "Dan Simmons", genre: "Science Fiction" },
    { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", genre: "Science Fiction" },
    { title: "Brave New World", author: "Aldous Huxley", genre: "Science Fiction" },
    { title: "Fahrenheit 451", author: "Ray Bradbury", genre: "Science Fiction" },

    // Mystery
    { title: "The Big Sleep", author: "Raymond Chandler", genre: "Mystery" },
    { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", genre: "Mystery" },
    { title: "Gone Girl", author: "Gillian Flynn", genre: "Mystery" },
    { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", genre: "Mystery" },
    { title: "And Then There Were None", author: "Agatha Christie", genre: "Mystery" },
    { title: "The Murders in the Rue Morgue", author: "Edgar Allan Poe", genre: "Mystery" },
    { title: "In the Woods", author: "Tana French", genre: "Mystery" },
    { title: "The Maltese Falcon", author: "Dashiell Hammett", genre: "Mystery" },
    { title: "The Da Vinci Code", author: "Dan Brown", genre: "Mystery" },
    { title: "Shutter Island", author: "Dennis Lehane", genre: "Mystery" },

    // Biography
    { title: "Educated", author: "Tara Westover", genre: "Biography" },
    { title: "The Diary of a Young Girl", author: "Anne Frank", genre: "Biography" },
    { title: "Steve Jobs", author: "Walter Isaacson", genre: "Biography" },
    { title: "Becoming", author: "Michelle Obama", genre: "Biography" },
    { title: "Long Walk to Freedom", author: "Nelson Mandela", genre: "Biography" },
    { title: "The Autobiography of Malcolm X", author: "Malcolm X", genre: "Biography" },
    { title: "Alexander Hamilton", author: "Ron Chernow", genre: "Biography" },
    { title: "The Wright Brothers", author: "David McCullough", genre: "Biography" },
    { title: "Born a Crime", author: "Trevor Noah", genre: "Biography" },
    { title: "I Know Why the Caged Bird Sings", author: "Maya Angelou", genre: "Biography" },
  ];

  for (const book of sampleBooks) {
    const genre = genres.find((g) => g.name === book.genre);
    if (genre) {
      await prisma.book.create({
        data: {
          title: book.title,
          author: book.author,
          isbn: `978${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          description: `${book.title} by ${book.author}.`,
          totalCopies: 3,
          availableCopies: 3,
          genreId: genre.id,
        },
      });
    }
  }

  console.log(`Successfully seeded ${sampleBooks.length} books across 4 genres!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());