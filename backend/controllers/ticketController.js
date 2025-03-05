const Ticket = require('../models/Ticket');

const createTicket = async (req, res) => {
  const { title, description } = req.body;
  const ticket = new Ticket({ title, description, createdBy: req.user._id });
  await ticket.save();
  res.status(201).json(ticket);
};

const getTickets = async (req, res) => {
  const tickets = req.user.role === 'admin' ? await Ticket.find() : await Ticket.find({ createdBy: req.user._id });
  res.json(tickets);
};

const updateTicket = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can update tickets.' });
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(ticket);
};

module.exports = { createTicket, getTickets, updateTicket };
