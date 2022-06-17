const jwt = require('jsonwebtoken');
const config = require('config');

// Exporting middlware function
module.exports = function(req, res, next) {
    
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if(!token) {
        return res.status(401).json({ msg: 'No token, authorization denited' });
    }

    // Verify token
    try {
        // Decode token
        const decoded = jwt.verify(token, config.get('jwtSecret'))

        // Set request.user to decoded token user
        req.user = decoded.user;

        // Call next
        next();
    
    // Catch invalid token
    } catch(err) {
        res.status(401).json({ msg: 'Token is not valid' })
    }
}
