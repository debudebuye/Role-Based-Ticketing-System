import express from 'express';
import { CommentController } from './comment.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { authorize } from '../../shared/middleware/role.middleware.js';
import { validate, createCommentSchema, updateCommentSchema } from './comment.validation.js';
import { PERMISSIONS } from '../../shared/constants/roles.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management endpoints for ticket discussions
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /comments/ticket/{ticketId}:
 *   get:
 *     summary: Get comments for a specific ticket
 *     tags: [Comments]
 *     description: Get all comments for a specific ticket with role-based filtering
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *         example: 507f1f77bcf86cd799439011
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
 *           default: 20
 *         description: Number of comments per page
 *       - in: query
 *         name: includeInternal
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include internal comments (Admin/Manager/Agent only)
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
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
 *                     comments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 20
 *                         total:
 *                           type: number
 *                           example: 45
 *                         pages:
 *                           type: number
 *                           example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   post:
 *     summary: Create comment for a specific ticket
 *     tags: [Comments]
 *     description: Add a new comment to a ticket
 *     parameters:
 *       - in: path
 *         name: ticketId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: I have investigated this issue and found the root cause in the authentication module.
 *               isInternal:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is an internal comment (visible to staff only)
 *                 example: false
 *     responses:
 *       201:
 *         description: Comment created successfully
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
 *                   example: Comment created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     comment:
 *                       $ref: '#/components/schemas/Comment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

// Get comments for a specific ticket
router.get('/ticket/:ticketId', 
  authorize(PERMISSIONS.VIEW_COMMENTS),
  CommentController.getTicketComments
);

// Create comment for a specific ticket
router.post('/ticket/:ticketId', 
  authorize(PERMISSIONS.ADD_COMMENTS),
  validate(createCommentSchema),
  CommentController.createComment
);

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get specific comment
 *     tags: [Comments]
 *     description: Get a specific comment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
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
 *                     comment:
 *                       $ref: '#/components/schemas/Comment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update comment
 *     tags: [Comments]
 *     description: Update a comment (author only or admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Updated comment with additional information about the resolution.
 *               isInternal:
 *                 type: boolean
 *                 description: Whether this is an internal comment
 *                 example: false
 *     responses:
 *       200:
 *         description: Comment updated successfully
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
 *                   example: Comment updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     comment:
 *                       $ref: '#/components/schemas/Comment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete comment
 *     tags: [Comments]
 *     description: Delete a comment (author only or admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Comment deleted successfully
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

// Get specific comment
router.get('/:id', 
  authorize(PERMISSIONS.VIEW_COMMENTS),
  CommentController.getCommentById
);

// Update comment
router.put('/:id', 
  authorize(PERMISSIONS.ADD_COMMENTS),
  validate(updateCommentSchema),
  CommentController.updateComment
);

// Delete comment
router.delete('/:id', 
  authorize(PERMISSIONS.ADD_COMMENTS),
  CommentController.deleteComment
);

export default router;