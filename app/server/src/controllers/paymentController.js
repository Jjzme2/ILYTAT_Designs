const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const printifyService = require('../services/printifyService');
const orderService = require('../services/orderService'); 
const { catchAsync, createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { sequelize, Order, User } = require('../models');

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

    /**
     * Internal method to get order by session ID without response handling
     * Used by permission middleware and other internal processes
     * @param {string} sessionId - Stripe session ID
     * @returns {Promise<Object>} Order data
     */
    getOrderBySessionIdInternal = async (sessionId) => {
        try {
            // Use order service to fetch order details
            const result = await orderService.getOrderBySessionId(sessionId);
            return result.data;
        } catch (error) {
            this.logger.error(
                this.logger.response.error({
                    success: false,
                    message: 'Error retrieving order details [internal]',
                    error,
                    data: { 
                        sessionId,
                        errorMessage: error.message
                    }
                })
            );
            return null;
        }
    }

    /**
     * Get a specific user's order history (admin only)
     * @route GET /api/payment/user/:userId/orders
     */
    getUserOrdersByAdmin = catchAsync(async (req, res) => {
        const { userId } = req.params;
        
        if (!userId) {
            throw createError('User ID is required', 400);
        }
        
        // Log order history request
        this.logger.info(
            this.logger.response.business({
                message: 'Admin retrieving user order history',
                data: { targetUserId: userId }
            }).withRequestDetails(req)
        );
        
        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            throw createError('User not found', 404);
        }
        
        try {
            // Use order service to fetch user's orders
            const orders = await orderService.getOrdersByUserId(userId);
            
            return res.sendSuccess(
                orders,
                `Order history for user ${userId} retrieved successfully`
            );
        } catch (error) {
            // Log error
            this.logger.error(
                this.logger.response.error({
                    success: false,
                    message: 'Error retrieving user order history',
                    error,
                    data: { 
                        targetUserId: userId,
                        errorMessage: error.message
                    }
                })
            );
            
            throw error;
        }
    });
    
    /**
     * Get all orders with filtering and pagination (admin only)
     * @route GET /api/payment/admin/orders
     */
    getAllOrders = catchAsync(async (req, res) => {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            fromDate, 
            toDate,
            sort = 'newest' 
        } = req.query;
        
        // Log all orders request
        this.logger.info(
            this.logger.response.business({
                message: 'Admin retrieving all orders',
                data: { 
                    page, 
                    limit, 
                    status,
                    dateRange: fromDate && toDate ? `${fromDate} to ${toDate}` : 'all time',
                    sort
                }
            }).withRequestDetails(req)
        );
        
        try {
            // Set up filters
            const filters = {};
            
            if (status) {
                filters.status = status;
            }
            
            if (fromDate && toDate) {
                filters.createdAt = {
                    [sequelize.Op.between]: [new Date(fromDate), new Date(toDate)]
                };
            }
            
            // Set up sorting
            let orderCriteria;
            switch(sort) {
                case 'oldest':
                    orderCriteria = [['createdAt', 'ASC']];
                    break;
                case 'highest':
                    orderCriteria = [['totalAmount', 'DESC']];
                    break;
                case 'lowest':
                    orderCriteria = [['totalAmount', 'ASC']];
                    break;
                case 'newest':
                default:
                    orderCriteria = [['createdAt', 'DESC']];
            }
            
            // Query orders with pagination
            const { rows: orders, count } = await Order.findAndCountAll({
                where: filters,
                order: orderCriteria,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    }
                ]
            });
            
            return res.sendSuccess(
                {
                    orders,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(count / parseInt(limit))
                    }
                },
                'All orders retrieved successfully'
            );
        } catch (error) {
            // Log error
            this.logger.error(
                this.logger.response.error({
                    success: false,
                    message: 'Error retrieving all orders',
                    error,
                    data: { 
                        errorMessage: error.message
                    }
                })
            );
            
            throw error;
        }
    });
    
    /**
     * Get order statistics for dashboard (admin only)
     * @route GET /api/payment/admin/stats
     */
    getOrderStatistics = catchAsync(async (req, res) => {
        const { timeRange = 'week' } = req.query;
        const now = new Date();
        let startDate;
        
        // Determine date range
        switch(timeRange) {
            case 'day':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 1);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'week':
            default:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
        }
        
        // Log stats request
        this.logger.info(
            this.logger.response.business({
                message: 'Admin retrieving order statistics',
                data: { 
                    timeRange,
                    startDate: startDate.toISOString(),
                    endDate: now.toISOString()
                }
            }).withRequestDetails(req)
        );
        
        try {
            // Get total sales and order count
            const salesStats = await Order.findAll({
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders']
                ],
                where: {
                    createdAt: {
                        [sequelize.Op.between]: [startDate, now]
                    },
                    status: {
                        [sequelize.Op.not]: 'cancelled'
                    }
                }
            });
            
            // Get sales grouped by day (for graphs)
            const dailySales = await Order.findAll({
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                    [sequelize.fn('SUM', sequelize.col('totalAmount')), 'amount'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                where: {
                    createdAt: {
                        [sequelize.Op.between]: [startDate, now]
                    },
                    status: {
                        [sequelize.Op.not]: 'cancelled'
                    }
                },
                group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
                order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
            });
            
            // Get stats by status
            const statusStats = await Order.findAll({
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['status']
            });
            
            return res.sendSuccess(
                {
                    summary: {
                        totalSales: parseFloat(salesStats[0]?.dataValues?.totalSales || 0),
                        totalOrders: parseInt(salesStats[0]?.dataValues?.totalOrders || 0)
                    },
                    dailySales: dailySales.map(day => ({
                        date: day.dataValues.date,
                        amount: parseFloat(day.dataValues.amount),
                        count: parseInt(day.dataValues.count)
                    })),
                    byStatus: statusStats.map(status => ({
                        status: status.dataValues.status,
                        count: parseInt(status.dataValues.count)
                    }))
                },
                'Order statistics retrieved successfully'
            );
        } catch (error) {
            // Log error
            this.logger.error(
                this.logger.response.error({
                    success: false,
                    message: 'Error retrieving order statistics',
                    error,
                    data: { 
                        errorMessage: error.message
                    }
                })
            );
            
            throw error;
        }
    });
    
    /**
     * Process a refund for an order (admin only)
     * @route POST /api/payment/admin/refund/:orderId
     */
    processRefund = catchAsync(async (req, res) => {
        const { orderId } = req.params;
        const { reason, amount, refundAll = false } = req.body;
        
        if (!orderId) {
            throw createError('Order ID is required', 400);
        }
        
        // Log refund request
        this.logger.info(
            this.logger.response.business({
                message: 'Admin processing refund',
                data: { 
                    orderId,
                    refundAll,
                    amount: refundAll ? 'full amount' : amount
                }
            }).withRequestDetails(req)
        );
        
        try {
            // Get order details
            const order = await Order.findByPk(orderId);
            
            if (!order) {
                throw createError('Order not found', 404);
            }
            
            if (order.refunded) {
                throw createError('Order has already been refunded', 400);
            }
            
            // Get payment intent from Stripe
            const session = await stripe.checkout.sessions.retrieve(order.sessionId, {
                expand: ['payment_intent']
            });
            
            if (!session.payment_intent) {
                throw createError('Payment intent not found for this order', 404);
            }
            
            // Process refund in Stripe
            const refundAmount = refundAll 
                ? undefined // Refund the full amount
                : Math.round(parseFloat(amount) * 100); // Convert to cents
            
            const refund = await stripe.refunds.create({
                payment_intent: session.payment_intent.id,
                amount: refundAmount,
                reason: reason || 'requested_by_customer'
            });
            
            // Update order status
            await order.update({
                refunded: true,
                refundedAt: new Date(),
                refundAmount: refundAll ? order.totalAmount : parseFloat(amount),
                refundReason: reason,
                status: 'refunded'
            });
            
            return res.sendSuccess(
                {
                    refund,
                    order: order.toJSON()
                },
                'Refund processed successfully'
            );
        } catch (error) {
            // Log error
            this.logger.error(
                this.logger.response.error({
                    success: false,
                    message: 'Error processing refund',
                    error,
                    data: { 
                        orderId,
                        errorMessage: error.message
                    }
                })
            );
            
            throw error;
        }
    });
}

// Export a singleton instance
module.exports = new PaymentController();