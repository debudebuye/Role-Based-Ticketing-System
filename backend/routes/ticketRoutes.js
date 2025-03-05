const express = require('express');
const { createTicket, getTickets, updateTicket } = require('../controllers/ticketController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Protected routes (require authentication)
router.post('/', authMiddleware, createTicket); // POST /api/tickets
router.get('/', authMiddleware, getTickets);    // GET /api/tickets
router.put('/:id', authMiddleware, updateTicket); // PUT /api/tickets/:id

module.exports = router;