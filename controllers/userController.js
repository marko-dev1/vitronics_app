// controllers/userController.js
const User = require('../models/user');

// Make sure these are proper async functions
exports.register = async (req, res) => {
  try {
    // Registration logic
    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    // Login logic
    res.json({ message: 'Logged in' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // Logout logic
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};