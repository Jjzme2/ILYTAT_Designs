/**
 * Authentication configuration settings
 */

const config = {
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h',
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpiresIn: '7d'
    },
    password: {
        saltRounds: 10,
        minLength: 8,
        maxLength: 128,
        validationRules: {
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        }
    },
    session: {
        maxConcurrentSessions: 5,
        inactivityTimeout: '30m'
    },
    rateLimit: {
        loginWindow: 15 * 60 * 1000, // 15 minutes
        maxLoginAttempts: 5,
        lockoutDuration: 30 * 60 * 1000 // 30 minutes
    }
};

module.exports = config;
