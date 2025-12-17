import express from 'express';
import { TicketController } from './ticket.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { requireRole, authorize } from '../../shared/middleware/role.middleware.js';
import { 
  validate, 
  createTicketSchema, 
  updateTicketSchema,
  assignTicketSchema 
} from './ticket.validation.js';
import { ROLES, PERMISSIONS } from '../../shared/constants/roles.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management endpoints with role-based access control
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /tickets/stats:
 *   get:
 *     summary: Get ticket statistics
 *     tags: [Tickets]
 *     description: Get comprehensive ticket statistics based on user role
 *     responses:
 *       200:
 *         description: Ticket statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 250
 *                         open:
 *                           type: number
 *                           example: 45
 *                         inProgress:
 *                           type: number
 *                           example: 32
 *                         resolved:
 *                           type: number
 *                           example: 150
 *                         closed:
 *                           type: number
 *                           example: 23
 *                         byPriority:
 *                           type: object
 *                           properties:
 *                             urgent:
 *                               type: number
 *                               example: 5
 *                             high:
 *                               type: number
 *                               example: 15
 *                             medium:
 *                               type: number
 *                               example: 35
 *                             low:
 *                               type: number
 *                               example: 25
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Get all tickets with filtering and pagination
 *     tags: [Tickets]
 *     description: Get paginated list of tickets filtered by user role and permissions
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tickets per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filter by ticket status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [technical, billing, general, feature_request, bug_report, account, other]
 *         description: Filter by category
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned agent ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tickets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ticket'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         total:
 *                           type: number
 *                           example: 250
 *                         pages:
 *                           type: number
 *                           example: 25
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
 *     description: Create a new support ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - priority
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: Login Issue - Cannot Access Dashboard
 *               description:
 *                 type: string
 *                 example: User reports being unable to login to the dashboard after password reset
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 example: high
 *               category:
 *                 type: string
 *                 enum: [technical, billing, general, feature_request, bug_report, account, other]
 *                 example: technical
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [login, dashboard, authentication]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-25T10:00:00Z
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ticket created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       $ref: '#/components/schemas/Ticket'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Get ticket statistics
router.get('/stats', TicketController.getTicketStats);

// Get all tickets (filtered by role)
router.get('/', TicketController.getAllTickets);

// Create ticket
router.post('/', 
  authorize(PERMISSIONS.CREATE_TICKET),
  validate(createTicketSchema), 
  TicketController.createTicket
);

/**
 * @swagger
 * /tickets/{id}/assign:
 *   put:
 *     summary: Assign ticket to an agent
 *     tags: [Tickets]
 *     description: Assign a ticket to an agent (Admin/Manager only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedTo
 *             properties:
 *               assignedTo:
 *                 type: string
 *                 description: Agent ID to assign the ticket to
 *                 example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Ticket assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /tickets/{id}/accept:
 *   put:
 *     summary: Accept assigned ticket
 *     tags: [Tickets]
 *     description: Accept a ticket assignment (Agent only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Ticket accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /tickets/{id}/reject:
 *   put:
 *     summary: Reject assigned ticket
 *     tags: [Tickets]
 *     description: Reject a ticket assignment with reason (Agent only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 example: Workload too high - cannot take on additional tickets
 *     responses:
 *       200:
 *         description: Ticket rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

// Assign ticket (Admin/Manager only)
router.put('/:id/assign', 
  authorize(PERMISSIONS.ASSIGN_TICKETS),
  validate(assignTicketSchema),
  TicketController.assignTicket
);

// Accept ticket (Agent only - for assigned tickets)
router.put('/:id/accept', TicketController.acceptTicket);

// Reject ticket (Agent only - for assigned tickets)
router.put('/:id/reject', TicketController.rejectTicket);

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
 *     description: Get a specific ticket by ID with role-based access control
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Ticket retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       $ref: '#/components/schemas/Ticket'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update ticket
 *     tags: [Tickets]
 *     description: Update a ticket with role-based permissions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Login Issue - Cannot Access Dashboard
 *               description:
 *                 type: string
 *                 example: Updated description with more details
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *                 example: in_progress
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 example: high
 *               category:
 *                 type: string
 *                 enum: [technical, billing, general, feature_request, bug_report, account, other]
 *                 example: technical
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [login, dashboard, authentication, resolved]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-25T10:00:00Z
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Ticket updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       $ref: '#/components/schemas/Ticket'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete ticket
 *     tags: [Tickets]
 *     description: Delete a ticket (Admin only or ticket owner)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Ticket deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

// Get ticket by ID
router.get('/:id', TicketController.getTicketById);

// Update ticket
router.put('/:id', 
  validate(updateTicketSchema), 
  TicketController.updateTicket
);

// Delete ticket (Admin only or ticket owner)
router.delete('/:id', TicketController.deleteTicket);

export default router;