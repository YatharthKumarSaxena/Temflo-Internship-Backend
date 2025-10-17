// middlewares/checkActivePlan.js
const Subscription = require('@/models/BusinessModels/Subscription');

module.exports = function checkActivePlan(moduleKey) {
    return async (req, res, next) => {
        try {
            const companyId = req.admin?.companyId;
            if (!companyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized: company not found in token.',
                });
            }

            // Find latest subscription for this company
            const latestSubscription = await Subscription.findOne({ companyId })
                .populate('planId')
                .sort({ createdAt: -1 });

            if (!latestSubscription) {
                return res.status(403).json({
                    success: false,
                    message: 'No subscription found. Please activate your plan.',
                });
            }

            const plan = latestSubscription.planId;
            if (!plan) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid subscription. Plan not found.',
                });
            }

            const now = new Date();

            // Allow access during valid trial or active plan period
            if (plan.status !== 'trial' && latestSubscription.endDate < now) {
                return res.status(403).json({
                    success: false,
                    message: 'Your subscription has expired. Please renew your plan.',
                });
            }

            if (plan.status === 'suspended' || !plan.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Your plan is suspended or inactive. Please contact support.',
                });
            }

            // ✅ Module-level access check
            if (moduleKey) {
                const moduleAccess = plan.includedModules.find(
                    (m) => m.moduleKey === moduleKey && m.enabled !== false
                );

                if (!moduleAccess) {
                    return res.status(403).json({
                        success: false,
                        message: `Access denied: '${moduleKey}' module is not included in your current plan.`,
                    });
                }
            }

            // Attach plan info to request for downstream logic (optional)
            req.currentPlan = plan;
            req.currentSubscription = latestSubscription;

            next();
        } catch (error) {
            console.error('❌ Error in checkActivePlan middleware:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while checking subscription.',
            });
        }
    };
};
