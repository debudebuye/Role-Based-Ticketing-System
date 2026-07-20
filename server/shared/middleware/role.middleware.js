import { ROLE_PERMISSIONS } from '../constants/roles.js';

export const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    
    const hasPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

export const requireOwnershipOrRole = (resourceField = 'createdBy', ...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Privileged roles bypass ownership check
    if (roles.includes(req.user.role)) {
      return next();
    }

    // Ownership check: the resource ID comes from the route param.
    // The caller is responsible for ensuring the resource is loaded and
    // attached to req.resource, or the check falls through to the handler.
    // If req.resource is available, compare its resourceField to the user id.
    if (req.resource) {
      const ownerId = req.resource[resourceField]?._id || req.resource[resourceField];
      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }
      return next();
    }

    // Resource not pre-loaded — pass ownership field info to the handler
    req.requireOwnership = { field: resourceField };
    next();
  };
};