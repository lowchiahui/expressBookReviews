const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Function to check if a username is valid (already exists)
const isValid = (username) => {
    return users.some(user => user.username === username);
};

// Function to authenticate a user
const authenticatedUser = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    return !!user;
};

// Middleware to authenticate users using JWT
const authenticateUser = (req, res, next) => {
    const token = req.session?.authorization?.accessToken; // Get JWT token from session

    if (!token) {
        return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    try {
        const decoded = jwt.verify(token, "access"); // Verify JWT
        req.user = req.session.authorization.username; // Attach username to req.user
        next(); // Continue to the next function
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

// **User Login**
regd_users.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Check if username or password is missing
    if (!username || !password) {
        return res.status(400).json({ message: "Error logging in. Username and password are required." });
    }

    // Authenticate user
    if (authenticatedUser(username, password)) {
        // Generate JWT access token
        let accessToken = jwt.sign({ data: username }, 'access', { expiresIn: '1h' });

        // Store access token and username in session
        req.session.authorization = { accessToken, username };

        // ✅ Return plain text message
        return res.status(200).send("Customer successfully logged in");
    } else {
        return res.status(401).json({ message: "Invalid Login. Check username and password." });
    }
});

// **Add or Update a Book Review** (Authenticated Users Only)
regd_users.put("/auth/review/:isbn", authenticateUser, (req, res) => {
    const username = req.user; // Now req.user is correctly set
    const isbn = req.params.isbn;
    const review = req.query.review;

    if (!review) {
        return res.status(400).json({ message: "Review text required." });
    }

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found." });
    }

    if (!books[isbn].reviews) {
        books[isbn].reviews = {};
    }

    books[isbn].reviews[username] = review;

    return res.status(200).send(`The review for the book with ISBN ${isbn} has been added/ updated.`,
    );
});

// **Delete a Book Review** (Authenticated Users Only)
regd_users.delete("/auth/review/:isbn", authenticateUser, (req, res) => {
    const isbn = req.params.isbn;
    const username = req.user; // Now req.user is correctly set

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found." });
    }

    if (!books[isbn].reviews || !books[isbn].reviews[username]) {
        return res.status(404).json({ message: "Review not found." });
    }

    delete books[isbn].reviews[username];

    return res.status(200).send( `Reviews for the ISBN ${isbn} posted by user ${username} deleted.`);
});

// Export modules
module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
