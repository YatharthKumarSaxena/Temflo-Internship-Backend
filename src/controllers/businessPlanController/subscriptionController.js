const mongoose = require('mongoose');
const Plan = require('@/models/BusinessModels/Plan');
const Subscription = require('@/models/BusinessModels/Subscription');
// const Company = require('@/models/Company');

// ✅ Get current active subscription
exports.getAllSubscriptions = async (req, res) => {
    try {
        const companyId = req.admin.companyId;

        // Fetch all subscriptions for the company sorted by createdAt (latest first)
        const subscriptions = await Subscription.find({ companyId })
            .populate('planId')
            .sort({ createdAt: -1 });

        if (!subscriptions || subscriptions.length === 0) {
            return res
                .status(404)
                .json({ success: false, message: 'No subscriptions found' });
        }

        res.status(200).json({
            success: true,
            count: subscriptions.length,
            data: subscriptions,
        });
    } catch (err) {
        console.error('Error fetching subscriptions:', err);
        res
            .status(500)
            .json({ success: false, message: 'Error fetching subscriptions' });
    }
};


// // ✅ Renew current plan
// exports.renewCurrentPlan = async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const companyId = req.admin.companyId;

//         const activeSub = await Subscription.findOne({ companyId })
//             .sort({ endDate: -1 })
//             .populate('planId');

//         if (!activeSub) {
//             return res.status(400).json({ success: false, message: 'No active plan found to renew' });
//         }

//         const plan = activeSub.planId;
//         const newStartDate = activeSub.endDate;
//         const newEndDate = new Date(newStartDate);
//         newEndDate.setDate(newEndDate.getDate() + plan.durationDays);

//         // Create new subscription period
//         const renewed = await Subscription.create(
//             [
//                 {
//                     companyId,
//                     planId: plan._id,
//                     startDate: newStartDate,
//                     endDate: newEndDate,
//                     amount: plan.price || 0,
//                     paymentStatus: 'paid', // integrate payment later
//                 },
//             ],
//             { session }
//         );

//         // Update company with latest subscription
//         await Company.findByIdAndUpdate(
//             companyId,
//             { subscriptionId: renewed[0]._id },
//             { session }
//         );

//         await session.commitTransaction();
//         session.endSession();

//         res.status(201).json({
//             success: true,
//             message: `Plan renewed successfully until ${newEndDate.toDateString()}`,
//         });
//     } catch (err) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error(err);
//         res.status(500).json({ success: false, message: 'Plan renewal failed' });
//     }
// };

// // ✅ Upgrade or change plan
// exports.changePlan = async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const { companyId } = req.user;
//         const { planId } = req.body;

//         const plan = await Plan.findById(planId);
//         if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

//         const endDate = new Date();
//         endDate.setDate(endDate.getDate() + plan.durationDays);

//         const newSub = await Subscription.create(
//             [
//                 {
//                     companyId,
//                     planId,
//                     startDate: new Date(),
//                     endDate,
//                     amount: plan.price || 0,
//                     paymentStatus: 'paid',
//                 },
//             ],
//             { session }
//         );

//         await Company.findByIdAndUpdate(
//             companyId,
//             {
//                 planId,
//                 subscriptionId: newSub[0]._id,
//                 seatLimit: plan.seatLimit,
//                 status: 'active',
//             },
//             { session }
//         );

//         await session.commitTransaction();
//         session.endSession();

//         res.status(201).json({
//             success: true,
//             message: `Plan changed successfully to ${plan.name}`,
//         });
//     } catch (err) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error(err);
//         res.status(500).json({ success: false, message: 'Plan change failed' });
//     }
// };

// // ✅ Buy a new plan (for expired accounts)
// exports.buyNewPlan = async (req, res) => {
//     try {
//         const { companyId } = req.user;
//         const { planId } = req.body;

//         const plan = await Plan.findById(planId);
//         if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

//         const startDate = new Date();
//         const endDate = new Date();
//         endDate.setDate(endDate.getDate() + plan.durationDays);

//         const newSub = await Subscription.create({
//             companyId,
//             planId,
//             startDate,
//             endDate,
//             amount: plan.price || 0,
//             paymentStatus: 'paid',
//         });

//         await Company.findByIdAndUpdate(companyId, {
//             planId,
//             subscriptionId: newSub._id,
//             seatLimit: plan.seatLimit,
//             status: 'active',
//         });

//         res.status(201).json({ success: true, message: `Plan ${plan.name} activated successfully` });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, message: 'Plan purchase failed' });
//     }
// };
