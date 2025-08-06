const cron = require('node-cron');
const LeavePolicy = require('../models/LeaveModels/leavePolicy');
const LeaveBalance = require('../models/LeaveModels/LeaveBalanace');


const BATCH_SIZE = 500;

const isCreditDue = (policy, today) => {
  // Safely handle if credit block is missing
  if (!policy.credit) return false;

  const { frequency, dayOfMonth} = policy.credit;
  const last = policy.lastCreditedAt ? dayjs(policy.lastCreditedAt) : null;

  // If frequency is missing or invalid, do nothing
  if (!frequency) return false;

  switch (frequency) {
    case 'monthly':
      if (dayOfMonth == null) return false;
      return !last || (today.diff(last, 'month') >= 1 && today.date() >= dayOfMonth);

    case 'quarterly':
      if (dayOfMonth == null) return false;
      return !last || (today.diff(last, 'month') >= 3 && today.date() >= dayOfMonth);

    case 'yearly':
      if (dayOfMonth == null) return false;
      return !last || (today.diff(last, 'year') >= 1 && today.date() >= dayOfMonth);

    default:
      return false;
  }
};


const isExpiryDue = (policy, today) => {
  // Check if expiry object exists
  if (!policy.expiry) return false;

  const { frequency, dayOfMonth } = policy.expiry;
  const last = policy.lastExpiredAt ? dayjs(policy.lastExpiredAt) : null;

  // If frequency is missing or "never", don't expire
  if (!frequency || frequency === 'never') return false;

  switch (frequency) {
    case 'monthly':
      if (dayOfMonth == null) return false;
      return !last || (today.diff(last, 'month') >= 1 && today.date() >= dayOfMonth);

    case 'quarterly':
      if (dayOfMonth == null) return false;
      return !last || (today.diff(last, 'month') >= 3 && today.date() >= dayOfMonth);

    case 'yearly':
      if (dayOfMonth == null) return false;
      return !last || (today.diff(last, 'year') >= 1 && today.date() >= dayOfMonth);
    
    default:
      return false;
  }
};


const creditEmployeesForPolicy = async (policy, today) => {
  const period = `${today.year()}-${(today.month() + 1).toString().padStart(2, '0')}`;

  const query = {
    leaveTypeId: policy._id,
    isActive: true,
    $or: [
      { lastCreditedPeriod: { $ne: period } },
      { lastCreditedPeriod: { $exists: false } }
    ]
  };

  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const balances = await LeaveBalance.find(query).skip(skip).limit(BATCH_SIZE);
    if (balances.length === 0) break;

    const bulkOps = balances.map(balance => ({
      updateOne: {
        filter: { _id: balance._id },
        update: {
          $inc: { balance: policy.count },
          $set: {
            lastCredited: today.toDate(),
            lastCreditedPeriod: period
          }
        }
      }
    }));

    await LeaveBalance.bulkWrite(bulkOps);
    console.log(`[+] Credited ${balances.length} balances for policy: ${policy.name}`);
    skip += BATCH_SIZE;
  }
};

const expireEmployeesForPolicy = async (policy, today) => {
  const { expireRatio = 1 } = policy.expiry || {};
  const currentPeriod = `${today.year()}-${(today.month() + 1).toString().padStart(2, '0')}`;

  const query = {
    leaveTypeId: policy._id,
    isActive: true,
    balance: { $gt: 0 },
    $or: [
      { lastExpiredPeriod: { $ne: currentPeriod } },
      { lastExpiredPeriod: { $exists: false } }
    ]
  };

  let skip = 0;
  const BATCH_SIZE = 500;

  while (true) {
    const balances = await LeaveBalance.find(query).skip(skip).limit(BATCH_SIZE);
    if (balances.length === 0) break;

    const bulkOps = balances.map(balance => {
      const expireAmount = parseFloat((balance.balance * expireRatio).toFixed(2));
      return {
        updateOne: {
          filter: { _id: balance._id },
          update: {
            $inc: { balance: -expireAmount },
            $set: { lastExpiredPeriod: currentPeriod }
          }
        }
      };
    });

    await LeaveBalance.bulkWrite(bulkOps);
    console.log(`[-] Expired ${balances.length} balances for policy: ${policy.name}`);
    skip += BATCH_SIZE;
  }
};




function leaveCronJobs() {
// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log(`[CRON] Running leave credit & expiry at ${new Date().toISOString()}`);
  const today = dayjs();

  try {
    const leavePolicies = await LeavePolicy.find({ isActive: true });

    for (const policy of leavePolicies) {
      if (policy.type === 'wfh') continue;

      // ✅ Expire FIRST
        if (isExpiryDue(policy, today)) {
          await expireEmployeesForPolicy(policy,today);
          policy.lastExpiredAt = today.toDate();
        }

      // ✅ Then credit
      if (isCreditDue(policy, today)) {
        await creditEmployeesForPolicy(policy, today);
        policy.lastCreditedAt = today.toDate();
      }

      await policy.save();
    }

    console.log(`[CRON] Leave processing completed ✅`);
  } catch (err) {
    console.error('❌ Error in leave cron job:', err);
  }
});

}

module.exports = leaveCronJobs;
