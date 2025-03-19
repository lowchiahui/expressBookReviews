const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{
    const isUserPresent = users.some(obj => Object.values(obj).includes(username));
    return isUserPresent;
}

const authenticatedUser = (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
  const user = users.find(u => u.username === username && u.password === password);
  return !!user;
}

//only registered users can login
regd_users.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Check if username or password is missing
    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in" });
    }

    // Authenticate user
    if (authenticatedUser(username, password)) {
        // Generate JWT access token
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });

        // Store access token and username in session
        req.session.authorization = {
            accessToken, username
        }
        return res.status(200).send("Customer successfully logged in");
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const username = req.user; 
    const isbn = req.params.isbn;
    const review = req.query.review;
  
    if (!review) {
      return res.status(400).json({ message: "Review text required" });
    }
  
    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found" });
    }
  
    // Initialize reviews object if missing
    if (!books[isbn].reviews) {
      books[isbn].reviews = {};
    }
  
    // Upsert review
    const isUpdate = !!books[isbn].reviews[username];
    books[isbn].reviews[username] = review;
  
    return res.status(200).json({
        // message: `The review for the book with ISBN ${isbn} has been ${isUpdate ? "updated" : "added"}.`
        message: `The review for the book with ISBN ${isbn} has been added/ updated.`
    });
  });

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.user; 
  
    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found" });
    }
  
    if (!books[isbn].reviews[username]) {
      return res.status(404).json({ message: "Review not found" });
    }
  
    delete books[isbn].reviews[username];
    return res.status(200).json({ message: "Review deleted successfully" });
  });

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;