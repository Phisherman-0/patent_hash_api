// Role verification middleware
export function requireRole(requiredRole) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Check if user has the required role
        if (req.user.role !== requiredRole) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
}
// Role verification middleware for multiple roles
export function requireRoles(requiredRoles) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Check if user has any of the required roles
        if (!requiredRoles.includes(req.user.role || '')) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
}
// Specific role middlewares
export const requireUser = requireRole('user');
export const requireConsultant = requireRole('consultant');
export const requireAdmin = requireRole('admin');
// Middleware to check if user is either a user or consultant (for appointment booking)
export const requireUserOrConsultant = requireRoles(['user', 'consultant']);
// Middleware to check if user is either consultant or admin
export const requireConsultantOrAdmin = requireRoles(['consultant', 'admin']);
// Middleware to check if user is either user or admin
export const requireUserOrAdmin = requireRoles(['user', 'admin']);
