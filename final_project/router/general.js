const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
  
    // Check if the username is already taken
    if (users.some(user => user.username === username)) {
      return res.status(400).json({ message: "Username already exists" });
    }
  
    // Save the user data to the database
    const newUser = { username, password: password };
    users.push(newUser);
  
    return res.status(200).json({ message: "Customer successfully registered. Now you can login " });
  });

  public_users.get('/', async function (req, res) {
    try {
      const formattedBooks = await new Promise((resolve) => {
        const result = Object.keys(books).map(isbn => ({
          isbn,
          author: books[isbn].author,
          title: books[isbn].title,
          reviews: books[isbn].reviews
        }));
        resolve(result);
      });
      
      res.status(200).json(formattedBooks);
    } catch (error) {
      res.status(500).json({message: "Error fetching books"});
    }
  });

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
    new Promise((resolve, reject) => {
      const isbn = req.params.isbn;
      const book = books[isbn];
      
      book ? resolve(book) : 
        reject(new Error(`Book not found with ISBN: ${isbn}`));
    })
    .then(book => res.status(200).json(book))
    .catch(err => res.status(404).json({message: err.message}));
  });
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
    try {
        const author = req.params.author;
        const matchingBooks = await new Promise((resolve) => {
            const result = Object.entries(books).reduce((acc, [isbn, book]) => {
                if (book.author === author) {
                    acc.push({ isbn, title: book.title, reviews: book.reviews });
                }
                return acc;
            }, []);
            resolve(result);
        });

        matchingBooks.length > 0 
            ? res.status(200).json({ booksbyauthor: matchingBooks })  // Modified output format
            : res.status(404).json({ message: `No books found by author: ${author}` });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});


// Get all books based on title
public_users.get('/title/:title', function (req, res) {
    new Promise((resolve) => {
      const title = req.params.title;
      const result = Object.entries(books).reduce((acc, [isbn, book]) => {
        if (book.title === title) {
          acc.push({ isbn, author: book.author, reviews: book.reviews });
        }
        return acc;
      }, []);
      resolve(result);
    })
    .then(books => {
      books.length > 0
        ? res.status(200).json({booksbytitle:books})
        : res.status(404).json({message: `No books found with title: ${title}`});
    })
    .catch(err => res.status(500).json({message: "Search failed"}));
  });

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  
  // Check if book exists
  if (books.hasOwnProperty(isbn)) {
    const reviews = books[isbn].reviews;
    return res.status(200).json(reviews);
  } else {
    return res.status(404).json({ 
      message: `No reviews found for ISBN: ${isbn}` 
    });
  }
});

module.exports.general = public_users;