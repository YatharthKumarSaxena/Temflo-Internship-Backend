const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const Asset = require("@/models/AssetModels/Asset");
const { sendEmail } = require("@/utils/emailSender");
const { assetTemplate } = require("@/config/emailTemplates/assetTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const mongoose = require("mongoose");
const { getFullName } = require("@/utils/commonFunctions");

// Daily cron job at 9 AM IST
function assetCronJobs() {
    cron.schedule("30 3 * * *", async () => {
        console.log(`[CRON] Running Asset Expiry Mail Job at ${new Date().toISOString()}`);

        // Today range in UTC
        const startOfTodayUTC = dayjs().startOf('day').utc().toDate();
        const endOfTodayUTC = dayjs().endOf('day').utc().toDate();

        // 7 days later range in UTC
        const sevenDaysLater = dayjs().add(7, 'day');
        const startOf7DaysLaterUTC = sevenDaysLater.startOf('day').utc().toDate();
        const endOf7DaysLaterUTC = sevenDaysLater.endOf('day').utc().toDate();

        try {
            // 1️⃣ Assets expiring in 7 days
            const assets7Days = await Asset.find({
                expiryDate: { $gte: startOf7DaysLaterUTC, $lte: endOf7DaysLaterUTC }
            });

            for (const asset of assets7Days) {
                sendAssetMail(asset, "7days");
            }

            // 2️⃣ Assets expiring today
            const assetsToday = await Asset.find({
                expiryDate: { $gte: startOfTodayUTC, $lte: endOfTodayUTC }
            });

            for (const asset of assetsToday) {
                sendAssetMail(asset, "today");
            }

        } catch (err) {
            console.error("❌ Error in Asset Expiry Cron Job:", err);
        }
    });
}

async function sendAssetMail(asset, type = "today") {
    if (!asset.assignedTo) return;

    const User = mongoose.model('User');
    const users = await User.find({ companyId: asset.companyId, plantId: asset.plantId, role: "admin" });
    if (!users || users.length === 0) {
        console.log(`[SKIP] No user/email for asset ${asset.name}`);
        return;
    }

    const isToday = dayjs(asset.expiryDate).isSame(dayjs(), 'day');
    const messageIntro = assetTemplate.assetExpiryTemplate.message_intro
        .replace("<ASSET_NAME>", asset.name)
        .replace("<EXPIRY_DATE>", dayjs(asset.expiryDate).format("DD MMM YYYY"))
        .replace("<EXPIRY_TYPE>", isToday ? "today" : "in 7 days");

    const assetLink = `https://yourapp.com/assets/${asset._id}`;

    for(const user of users){
        const emailBody = generateMasterTemplate({
            ...assetTemplate.assetExpiryTemplate,
            user_name: getFullName(user.employeeInfo),
            message_intro: messageIntro,
            action_link: assetLink,
            actionLink: assetLink,
            actionbutton_text: assetTemplate.assetExpiryTemplate.actionbutton_text,
            fallback_note: assetTemplate.assetExpiryTemplate.fallback_note
        });
        
        if (user.email) {
            // Fire and forget with error logging
            sendEmail(user.email, assetTemplate.assetExpiryTemplate.subject, emailBody).then(() => {
                console.log(`[MAIL] Sent asset expiry mail to ${user.email} for asset ${asset.name} [${type}]`);
            }).catch(err => {
                console.error(`[MAIL ERROR] Failed to send mail to ${user.email} for asset ${asset.name}:`, err);
            });
        }
    }
}

module.exports = assetCronJobs;
