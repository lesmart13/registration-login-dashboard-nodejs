const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Login page
router.get('/login', (req, res) => {
    const error = req.session.error;
    req.session.error = null;
    res.render('login', { error });
});

// Registration page
router.get('/register', (req, res) => {
    const message = req.session.message;
    req.session.message = null;
    res.render('register', { message });
});

// Dashboard
router.get('/', isAuthenticated, (req, res) => {
    res.render('dashboard', { username: req.session.user.username });
});

// Register handler
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) {
                req.session.message = { type: 'error', text: 'Username already exists!' };
                res.redirect('/register');
            } else {
                req.session.message = { type: 'success', text: 'Registration successful! Please login.' };
                res.redirect('/login');
            }
        });
    } catch (err) {
        req.session.message = { type: 'error', text: 'Registration failed!' };
        res.redirect('/register');
    }
});

// Login handler
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user || !(await bcrypt.compare(password, user.password))) {
            req.session.error = 'Invalid credentials!';
            res.redirect('/login');
        } else {
            req.session.user = { id: user.id, username: user.username };
            res.redirect('/');
        }
    });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;