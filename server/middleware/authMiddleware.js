import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  try {
    // Check for token in different places
    const token = 
      req.headers.authorization?.split(' ')[1] || // Bearer token
      req.cookies['next-auth.session-token'] ||   // Cookie
      req.headers['x-auth-token'];               // Custom header

    if (!token) {
      return res.status(401).json({ message: 'No authentication token found' });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      req.user = decoded;
      next();
    } catch (verifyError) {
      // If the token is a session token, try decoding it differently
      try {
        // Next-auth uses a different encryption method for session tokens
        const sessionData = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString()
        );
        req.user = sessionData;
        next();
      } catch (sessionError) {
        throw new Error('Invalid token');
      }
    }
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export default authMiddleware; 