import express from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { requireRole } from '../../shared/middleware/role.middleware.js';
import { validate, createUserSchema, updateUserSchema } from './user.validation.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints (Admin/Manager access required)
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     description: Get comprehensive user statistics (Admin/Manager only)
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                           example: 150
 *                         active:
 *                           type: number
 *                           example: 142
 *                         inactive:
 *                           type: number
 *                           example: 8
 *                         byRole:
 *                           type: object
 *                           properties:
 *                             admin:
 *                               type: object
 *                               properties:
 *                                 total:
 *                                   type: number
 *                                   example: 2
 *                                 active:
 *                                   type: number
 *                                   example: 2
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /users/agents:
 *   get:
 *     summary: Get list of active agents
 *     tags: [Users]
 *     description: Get list of active agents for ticket assignment (Admin/Manager only)
 *     responses:
 *       200:
 *         description: Agents list retrieved successfully
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
 *                     agents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439011
 *                           name:
 *                             type: string
 *                             example: John Agent
 *                           email:
 *                             type: string
 *                             example: john.agent@example.com
 *                           department:
 *                             type: string
 *                             example: Support
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with filtering and pagination
 *     tags: [Users]
 *     description: Get paginated list of users with role-based filtering (Admin/Manager only)
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
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, manager, agent, customer]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, email, or department
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
 *         description: Users retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
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
 *                           example: 150
 *                         pages:
 *                           type: number
 *                           example: 15
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Get user stats (Admin/Manager only)
router.get('/stats', 
  requireRole(ROLES.ADMIN, ROLES.MANAGER), 
  UserController.getUserStats
);

// Get agents list (Admin/Manager only)
router.get('/agents', 
  requireRole(ROLES.ADMIN, ROLES.MANAGER), 
  UserController.getAgents
);

// Get all users (Admin/Manager only)
router.get('/', 
  requireRole(ROLES.ADMIN, ROLES.MANAGER), 
  UserController.getAllUsers
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     description: Create a new user (Admin/Manager only). Managers can only create agents and customers.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.smith@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [admin, manager, agent, customer]
 *                 example: agent
 *               department:
 *                 type: string
 *                 example: Support
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: User created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     description: Get a specific user by ID (Admin/Manager only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     description: Update a user (Admin/Manager only). Managers can only update agents and customers.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.updated@example.com
 *               role:
 *                 type: string
 *                 enum: [admin, manager, agent, customer]
 *                 example: agent
 *               department:
 *                 type: string
 *                 example: Engineering
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: User updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     description: Delete a user (Admin/Manager only). Managers can only delete agents and customers.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: User deleted successfully
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

// Create user (Admin and Manager)
router.post('/', 
  requireRole(ROLES.ADMIN, ROLES.MANAGER), 
  validate(createUserSchema), 
  UserController.createUser
);

// Get user by ID (Admin/Manager only)
router.get('/:id', 
  requireRole(ROLES.ADMIN, ROLES.MANAGER), 
  UserController.getUserById
);

// Update user (Admin and Manager)
router.put('/:id', 
  requireRole(ROLES.ADMIN, ROLES.MANAGER), 
  validate(updateUserSchema), 
  UserController.updateUser
);

// Delete user (Admin and Manager)
router.delete('/:id', 
  requireRole(ROLES.ADMIN, ROLES.MANAGER), 
  UserController.deleteUser
);

export default router;