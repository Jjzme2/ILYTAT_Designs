const express = require('express');
const router = express.Router();

/**
 * Example route demonstrating various response patterns
 */
router.get('/test-responses', async (req, res) => {
    try {
        // Example of a successful response
        return res.sendSuccess({
            data: { message: "This is a test response" },
            message: "Data retrieved successfully"
        });
    } catch (error) {
        return res.sendError({
            error,
            clientMessage: "Failed to process request",
            context: { additionalInfo: "This is additional context for logging" }
        });
    }
});

/**
 * Example route demonstrating validation error handling
 */
router.post('/test-validation', (req, res) => {
    const validationErrors = {
        email: 'Invalid email format',
        password: 'Password must be at least 8 characters'
    };

    return res.sendValidationError({
        validationErrors,
        clientMessage: "Please check your input"
    });
});

module.exports = router;
