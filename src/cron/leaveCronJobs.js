const cron = require('node-cron');
const LeavePolicy = require('../models/LeaveModels/leavePolicy');
const LeaveBalance = require('../models/LeaveModels/LeaveBalanace');
const User = require('../models/userModels/User');
const moment = require('moment');

function checkCreditDate(cycle, date) {
  if (cycle === 'Monthly') {
    return date.date() === 1;
  } else if (cycle === 'Quarterly') {
    return date.date() === 1 && [1, 4, 7, 10].includes(date.month() + 1);
  } else if (cycle === 'Yearly') {
    return date.date() === 1 && date.month() === 0; // Jan 1
  }
  return false;
}

function checkExpiryDate(cycle, date) {
  if (cycle === 'Monthly') {
    return date.date() === date.clone().endOf('month').date();
  } else if (cycle === 'Quarterly') {
    return date.date() === date.clone().endOf('month').date() &&
           [3, 6, 9, 12].includes(date.month() + 1);
  } else if (cycle === 'Yearly') {
    return date.date() === 31 && date.month() === 11; // Dec 31
  }
  return false;
}

async function creditLeaves(policy) {
  const employees = await User.find({
    companyId: policy.companyId,
    role: 'Employee'
  });

  for (const emp of employees) {
    let balance = await LeaveBalance.findOne({
      employeeId: emp._id,
      leaveType: policy.name
    });

    if (!balance) {
      balance = new LeaveBalance({
        employeeId: emp._id,
        leaveType: policy.name,
        companyId: emp.companyId,
        balance: 0
      });
    }

    balance.balance += policy.credits;
    await balance.save();
  }
}

async function expireLeaves(policy) {
  await LeaveBalance.updateMany(
    { leaveType: policy.name, companyId: policy.companyId },
    { $set: { balance: 0 } }
  );
}



function leaveCronJobs() {
// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Running leave crediting and expiry jobs...');

  const today = moment();

  try {
    const policies = await LeavePolicy.find({});

    for (const policy of policies) {
      const shouldCredit = checkCreditDate(policy.creditCycle, today);
      const shouldExpire = checkExpiryDate(policy.expiryCycle, today);

      if (shouldCredit) {
        console.log(`Crediting ${policy.name} for company ${policy.companyId}`);
        await creditLeaves(policy);
      }

      if (shouldExpire) {
        console.log(`Expiring ${policy.name} for company ${policy.companyId}`);
        await expireLeaves(policy);
      }
    }
  } catch (err) {
    console.error('[CRON ERROR]', err);
  }
});

}

module.exports = leaveCronJobs;
