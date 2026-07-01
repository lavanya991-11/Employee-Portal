const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Reject pre-migration tokens whose id is a MongoDB ObjectId (24-char hex)
        // instead of a numeric SQL id. Such tokens pass verification but every
        // id-based query matches nothing, so the user silently sees empty lists.
        // Returning 401 makes the frontend clear the session and send them to log
        // in again (getting a fresh, SQL-id token).
        const uid = Number(decoded.id);
        if (!Number.isInteger(uid) || uid <= 0) {
            return res.status(401).json({ message: "Session outdated — please log in again." });
        }
        req.user = { ...decoded, id: uid };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        next();
    };
};

module.exports = protect;
module.exports.protect = protect;
module.exports.authorize = authorize;
