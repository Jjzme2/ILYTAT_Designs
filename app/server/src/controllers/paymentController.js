const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const printifyService = require('../services/printifyService');
const orderService = require('../services/orderService'); 
const { catchAsync, createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { sequelize } = require('../models');

/**
 * PaymentController handles all payment processing operations
 * @module controllers/paymentController
 */
class PaymentController {
    constructor() {
        this.logger = logger.child({ component: 'PaymentController' });
    }
    
    /**
     * Create a Stripe checkout session
     * @route POST /api/payment/create-checkout
     */
    createCheckoutSession = catchAsync(async (req, res) => {
        const startTime = Date.now();
        const { items, customerId } = req.body;
        
        // Log payment attempt with sanitized data
        this.logger.info(
            this.logger.response.business({
                message: 'Creating checkout session',
                data: {
                    itemCount: items?.length || 0,
                    totalAmount: items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
                    customerId: customerId ? 'present' : 'not provided'
                }
            }).withRequestDetails(req)
        );
        
        if (!items || items.length === 0) {
            throw createError('Cart is empty', 400);
        }
        
        // Create line items for Stripe
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.title,
                    description: item.variantTitle,
                    images: item.image ? [item.image] : [],
                    metadata: {
                        product_id: item.id,
                        variant_id: item.variantId
                    }
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));
        
        // Set up checkout session parameters
        const sessionParams = {
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
            // Enable shipping address collection if needed
            shipping_address_collection: {
                allowed_countries: ['US', 'CA'], // Add more countries as needed
            },
            // Allow promotion codes
            allow_promotion_codes: true,
            metadata: {
                // Store minimal info in metadata, we'll use this in the webhook
                cartItems: JSON.stringify(items.map(item => ({
                    id: item.id,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: item.price
                })))
            }
        };
        
        // Add customer ID if provided
        if (customerId) {
            sessionParams.customer = customerId;
        }
        
        // Create checkout session
        const session = await stripe.checkout.sessions.create(sessionParams);
        
        // Log successful checkout session creation
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Checkout session created successfully',
                userMessage: 'Redirecting to checkout',
                data: {
                    sessionId: session.id,
                    items: items.length
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );
        
        return res.sendSuccess(
            { 
                url: session.url,
                sessionId: session.id 
            },
            'Checkout session created successfully'
        );
    });
    
    /**
     * Get user's order history
     * @route GET /api/payment/orders
     */
    getUserOrderHistory = catchAsync(async (req, res) => {
        const userId = req.user?.id;
        
        if (!userId) {
            throw createError('Unauthorized', 401);
        }
        
        // Log order history request
        this.logger.info(
            this.logger.response.business({
                message: 'Retrieving user order history',
                data: { userId }
            }).withRequestDetails(req)
        );
        
        try {
            // Use order service to fetch user's orders
            const orders = await orderService.getOrdersByUserId(userId);
            
            return res.sendSuccess(
                orders,
                'Order history retrieved successfully'
            );
        } catch (error) {
            // Log error
            this.logger.error(
                this.logger.response.error({
                    success: false,
                    message: 'Error retrieving order history',
                    error,
                    data: { 
                        userId,
                        errorMessage: error.message
                    }
                })
            );
            
            throw error;
        }
    });
    
    /**
     * Get order details by stripe session ID
     * @route GET /api/payment/order/:sessionId
     */
    getOrderBySessionId = catchAsync(async (req, res) => {
        const { sessionId } = req.params;
        
        if (!sessionId) {
            throw createError('No session ID provided', 400);
        }
        
        // Log order retrieval attempt
        this.logger.info(
            this.logger.response.business({
                message: 'Retrieving order details',
                data: { sessionId }
            }).withRequestDetails(req)
        );
        
        try {
            // Use the OrderService to get order details
            const result = await orderService.getOrderBySessionId(sessionId);
            
            return res.sendSuccess(
                result.data,
                `Order details retrieved successfully from ${result.type}`
            );
        } catch (error) {
            // Log error
            this.logger.error(
                this.logger.response.error({
                    success: false,
                    message: 'Error retrieving order details',
                    error,
                    data: { 
                        sessionId,
                        errorMessage: error.message
                    }
                })
            );
            
            throw error;
        }
    });
    
    /**
     * Handle successful payment and redirect
     * @route GET /api/payment/success
     */
    handlePaymentSuccess = catchAsync(async (req, res) => {
        const { session_id } = req.query;
        
        if (!session_id) {
            throw createError('No session ID provided', 400);
        }
        
        // Log success payment callback
        this.logger.info(
            this.logger.response.business({
                message: 'Payment success callback received',
                data: { sessionId: session_id }
            }).withRequestDetails(req)
        );
        
        // Verify the session is completed - Note: This is NOT the primary fulfillment logic
        // The webhook is the reliable source for fulfillment
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        if (session.payment_status === 'paid') {
            // Log successful payment verification
            this.logger.info(
                this.logger.response.business({
                    success: true,
                    message: 'Payment verified as completed',
                    data: { 
                        sessionId: session_id,
                        paymentStatus: session.payment_status,
                        customer: session.customer
                    }
                })
            );
            
            // We'll redirect to a success page
            return res.redirect(`${process.env.CLIENT_URL}/order/confirmation?id=${session_id}`);
        } else {
            // Log payment not completed
            this.logger.warn(
                this.logger.response.business({
                    success: false,
                    message: 'Payment not completed',
                    data: { 
                        sessionId: session_id,
                        paymentStatus: session.payment_status
                    }
                })
            );
            
            // Redirect to a pending or processing page
            return res.redirect(`${process.env.CLIENT_URL}/order/processing?id=${session_id}`);
        }
    });
    
    /**
     * Handle canceled payment and redirect
     * @route GET /api/payment/cancel
     */
    handlePaymentCancel = catchAsync(async (req, res) => {
        // Log payment cancellation
        this.logger.info(
            this.logger.response.business({
                message: 'Payment canceled by user',
                data: { 
                    sessionId: req.query.session_id || 'unknown'
                }
            }).withRequestDetails(req)
        );
        
        // Redirect back to cart
        return res.redirect(`${process.env.CLIENT_URL}/cart`);
    });
    
    /**
     * Handle Stripe webhook events
     * @route POST /api/payment/webhook
     */
    handleStripeWebhook = catchAsync(async (req, res) => {
        const sig = req.headers['stripe-signature'];
        const startTime = Date.now();
        let event;
        
        try {
            // Verify webhook signature
            event = stripe.webhooks.constructEvent(
                req.rawBody, // You need to make sure your app has access to the raw request body
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
            
            // Log webhook event received
            this.logger.info(
                this.logger.response.network({
                    success: true,
                    message: 'Stripe webhook received',
                    data: { 
                        eventType: event.type,
                        eventId: event.id
                    },
                    endpoint: 'stripe-webhook'
                })
            );
        } catch (err) {
            // Log signature verification failure
            this.logger.error(
                this.logger.response.network({
                    success: false,
                    message: 'Stripe webhook signature verification failed',
                    error: err,
                    data: { 
                        errorMessage: err.message 
                    },
                    endpoint: 'stripe-webhook'
                })
            );
            
            throw createError(`Webhook Error: ${err.message}`, 400);
        }
        
        // Handle specific events with an async function to process safely
        await this.processWebhookEvent(event, startTime);
        
        // Return a 200 response to acknowledge receipt of the event
        // Always return a 200 quickly to acknowledge receipt, even if processing failed
        return res.sendSuccess(
            { received: true },
            'Webhook event received successfully'
        );
    });
    
    /**
     * Process webhook events in a separate method to handle errors safely
     * @private
     */
    async processWebhookEvent(event, startTime) {
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutCompleted(event.data.object, startTime);
                    break;
                    
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event.data.object, startTime);
                    break;
                    
                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailed(event.data.object, startTime);
                    break;
                    
                default:
                    this.logger.info(
                        this.logger.response.network({
                            message: `Unhandled webhook event: ${event.type}`,
                            data: { eventId: event.id },
                            endpoint: 'stripe-webhook'
                        })
                    );
            }
        } catch (error) {
            // We don't want to crash or cause the webhook to return a non-200 response
            // So we catch all errors and just log them
            this.logger.error(
                this.logger.response.error({
                    success: false,
                    message: `Error processing webhook event: ${event.type}`,
                    error,
                    data: { 
                        eventId: event.id,
                        errorMessage: error.message
                    }
                }).withPerformanceMetrics({
                    duration: Date.now() - startTime
                })
            );
        }
    }
    
    /**
     * Handle checkout.session.completed webhook event
     * @private
     */
    async handleCheckoutCompleted(session, startTime) {
        // Process the order if payment was successful
        if (session.payment_status === 'paid') {
            try {
                // Extract cart items from metadata
                const cartItems = JSON.parse(session.metadata.cartItems);
                
                // Log order processing attempt
                this.logger.info(
                    this.logger.response.business({
                        message: 'Processing completed order',
                        data: { 
                            sessionId: session.id,
                            items: cartItems.length
                        }
                    })
                );
                
                // Use the OrderService to create order
                const order = await orderService.createOrderFromStripeSession(session, cartItems);
                
                // Format order data for Printify
                const shopId = process.env.DEFAULT_PRINTIFY_SHOP_ID;
                const orderData = {
                    external_id: session.id,
                    shipping_method: 1, // Default shipping method
                    shipping: {
                        name: session.shipping_details?.name || session.customer_details.name,
                        address1: session.shipping_details?.address?.line1 || '',
                        address2: session.shipping_details?.address?.line2 || '',
                        city: session.shipping_details?.address?.city || '',
                        state: session.shipping_details?.address?.state || '',
                        zip: session.shipping_details?.address?.postal_code || '',
                        country: session.shipping_details?.address?.country || '',
                        phone: session.customer_details?.phone || '',
                        email: session.customer_details?.email || ''
                    },
                    line_items: cartItems.map(item => ({
                        product_id: item.id,
                        variant_id: item.variantId,
                        quantity: item.quantity
                    }))
                };
                
                // Try to submit the order to Printify
                try {
                    const printifyOrder = await printifyService.createOrder(shopId, orderData);
                    
                    // Update our order with Printify ID
                    await orderService.updateOrderStatus(order.id, 'submitted_to_printify');
                    
                    // Log successful Printify order submission
                    this.logger.info(
                        this.logger.response.business({
                            success: true,
                            message: 'Order submitted to Printify',
                            data: { 
                                sessionId: session.id,
                                printifyOrderId: printifyOrder.id
                            }
                        })
                    );
                } catch (printifyError) {
                    // Log Printify order submission failure
                    this.logger.error(
                        this.logger.response.business({
                            success: false,
                            message: 'Failed to submit order to Printify',
                            error: printifyError,
                            data: { 
                                sessionId: session.id,
                                errorMessage: printifyError.message
                            }
                        })
                    );
                    
                    // Order is still valid even if Printify submission fails
                    // We can handle this manually or with a retry mechanism
                }
                
                // Log successful order processing
                this.logger.info(
                    this.logger.response.business({
                        success: true,
                        message: 'Order processed successfully',
                        data: { 
                            sessionId: session.id,
                            orderId: order.id
                        }
                    }).withPerformanceMetrics({
                        duration: Date.now() - startTime
                    })
                );
            } catch (error) {
                // Log error
                this.logger.error(
                    this.logger.response.business({
                        success: false,
                        message: 'Failed to process order',
                        error,
                        data: { 
                            sessionId: session.id,
                            errorMessage: error.message
                        }
                    }).withPerformanceMetrics({
                        duration: Date.now() - startTime
                    })
                );
                
                throw error;
            }
        } else {
            // Log payment not completed
            this.logger.warn(
                this.logger.response.business({
                    message: 'Payment not paid, skipping order processing',
                    data: { 
                        sessionId: session.id,
                        paymentStatus: session.payment_status
                    }
                })
            );
        }
    }
    
    /**
     * Handle payment_intent.succeeded webhook event
     * @private
     */
    async handlePaymentIntentSucceeded(paymentIntent, startTime) {
        // This is a secondary safeguard for payment success
        // Most processing is done in checkout.session.completed
        this.logger.info(
            this.logger.response.business({
                success: true,
                message: 'Payment intent succeeded',
                data: { 
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount / 100, // Convert from cents
                    currency: paymentIntent.currency
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );
    }
    
    /**
     * Handle payment_intent.payment_failed webhook event
     * @private
     */
    async handlePaymentFailed(paymentIntent, startTime) {
        this.logger.warn(
            this.logger.response.business({
                success: false,
                message: 'Payment failed',
                data: { 
                    paymentIntentId: paymentIntent.id,
                    errorMessage: paymentIntent.last_payment_error?.message || 'Unknown error',
                    errorCode: paymentIntent.last_payment_error?.code,
                    amount: paymentIntent.amount / 100, // Convert from cents
                    currency: paymentIntent.currency
                }
            }).withPerformanceMetrics({
                duration: Date.now() - startTime
            })
        );
    }
}

// Export a singleton instance
module.exports = new PaymentController();