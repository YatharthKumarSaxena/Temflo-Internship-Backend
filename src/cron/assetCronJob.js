const cron = require("node-cron");
const dayjs = require("dayjs");
const Asset = require("@/models/AssetModels/Asset");
const { sendEmail } = require("@/utils/emailSender");
const { assetTemplate } = require("@/config/emailTemplates/assetTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const mongoose = require("mongoose");

// Daily cron job at 9 AM
function assetCronJobs() {
    cron.schedule("41 20 * * *", async () => {
        console.log(`[CRON] Running Asset Mail Job at ${new Date().toISOString()}`);

        const startOfToday = dayjs().startOf('day').toDate();
        const endOfToday = dayjs().endOf('day').toDate();
        const startOf7DaysLater = sevenDaysLater.startOf('day').toDate();
        const endOf7DaysLater = sevenDaysLater.endOf('day').toDate();

        try {
            // 1️⃣ Assets expiring in 7 days
            const assets7Days = await Asset.find({
                expiryDate: sevenDaysLater.toDate(),
                assignedTo: { $ne: null }
            });

            for (const asset of assets7Days) {
                sendAssetMail(asset, "7days");
            }

            // 2️⃣ Assets expiring today

            const assetsToday = await Asset.find({
                expiryDate: { $gte: startOfToday, $lte: endOfToday },
                assignedTo: { $ne: null }
            });

            for (const asset of assetsToday) {
                sendAssetMail(asset, "today");
            }

            // 3️⃣ Assets with status change (Disposed / Under Maintenance / Returned)
            const statusAssets = await Asset.find({
                status: { $in: ["Disposed", "Under Maintenance", "Returned"] },
                assignedTo: { $ne: null }
            });

            for (const asset of statusAssets) {
                sendAssetMail(asset, "status");
            }

        } catch (err) {
            console.error("❌ Error in Asset Cron Job:", err);
        }
    });
}

async function sendAssetMail(asset, type = "today") {
    if (!asset.assignedTo) return;

    const User = mongoose.model('User');
    const user = await User.findById(asset.assignedTo);
    if (!user || !user.email) {
        console.log(`[SKIP] No user/email for asset ${asset.name}`);
        return;
    }

    let messageIntro = type === "status"
        ? assetTemplate.assetStatusChange.message_intro.replace("<ASSET_NAME>", asset.name).replace("<ASSET_STATUS>", asset.status)
        : assetTemplate.assetExpiryTemplate.message_intro.replace("<ASSET_NAME>", asset.name).replace("<EXPIRY_DATE>", dayjs(asset.expiryDate).format("DD MMM YYYY"));

    let emailBody = generateMasterTemplate({
        ...(type === "status" ? assetTemplate.assetStatusChange : assetTemplate.assetExpiryTemplate),
        message_intro: messageIntro,
        action_link: `https://yourapp.com/assets/${asset._id}`,
    });

    // Fire and forget with error logging
    sendEmail({
        to: user.email,
        subject: type === "status" ? assetTemplate.assetStatusChange.subject : assetTemplate.assetExpiryTemplate.subject,
        html: emailBody
    }).then(() => {
        console.log(`[MAIL] Sent asset mail to ${user.email} for asset ${asset.name} [${type}]`);
    }).catch(err => {
        console.error(`[MAIL ERROR] Failed to send mail to ${user.email} for asset ${asset.name}:`, err);
    });
}


module.exports = assetCronJobs;
