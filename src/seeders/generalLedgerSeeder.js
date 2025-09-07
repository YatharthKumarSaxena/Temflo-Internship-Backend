const GeneralLedger = require('../models/MaterialModels/GeneralLedgerModel');

const defaultAccounts = [
  // Assets
  {
    accountCode: '1001',
    accountName: 'Cash',
    accountType: 'Asset',
    category: 'Current Assets',
    description: 'Cash on hand and in bank accounts',
    isActive: true,
  },
  {
    accountCode: '1002',
    accountName: 'Bank Account',
    accountType: 'Asset',
    category: 'Current Assets',
    description: 'Bank checking and savings accounts',
    isActive: true,
  },
  {
    accountCode: '1100',
    accountName: 'Accounts Receivable',
    accountType: 'Asset',
    category: 'Current Assets',
    description: 'Amounts owed by customers',
    isActive: true,
  },
  {
    accountCode: '1200',
    accountName: 'Inventory',
    accountType: 'Asset',
    category: 'Current Assets',
    description: 'Raw materials, work in progress, and finished goods',
    isActive: true,
  },
  {
    accountCode: '1300',
    accountName: 'Prepaid Expenses',
    accountType: 'Asset',
    category: 'Current Assets',
    description: 'Expenses paid in advance',
    isActive: true,
  },
  {
    accountCode: '1400',
    accountName: 'Fixed Assets',
    accountType: 'Asset',
    category: 'Fixed Assets',
    description: 'Property, plant, and equipment',
    isActive: true,
  },
  {
    accountCode: '1500',
    accountName: 'Accumulated Depreciation',
    accountType: 'Asset',
    category: 'Fixed Assets',
    description: 'Accumulated depreciation on fixed assets',
    isActive: true,
  },

  // Liabilities
  {
    accountCode: '2000',
    accountName: 'Accounts Payable',
    accountType: 'Liability',
    category: 'Current Liabilities',
    description: 'Amounts owed to suppliers',
    isActive: true,
  },
  {
    accountCode: '2100',
    accountName: 'Accrued Expenses',
    accountType: 'Liability',
    category: 'Current Liabilities',
    description: 'Expenses incurred but not yet paid',
    isActive: true,
  },
  {
    accountCode: '2200',
    accountName: 'Short-term Loans',
    accountType: 'Liability',
    category: 'Current Liabilities',
    description: 'Short-term borrowings',
    isActive: true,
  },
  {
    accountCode: '2300',
    accountName: 'Long-term Loans',
    accountType: 'Liability',
    category: 'Long-term Liabilities',
    description: 'Long-term borrowings',
    isActive: true,
  },

  // Equity
  {
    accountCode: '3000',
    accountName: 'Common Stock',
    accountType: 'Equity',
    category: 'Equity',
    description: 'Common stock issued',
    isActive: true,
  },
  {
    accountCode: '3100',
    accountName: 'Retained Earnings',
    accountType: 'Equity',
    category: 'Equity',
    description: 'Accumulated profits',
    isActive: true,
  },

  // Revenue
  {
    accountCode: '4000',
    accountName: 'Revenue',
    accountType: 'Revenue',
    category: 'Revenue',
    description: 'Sales revenue',
    isActive: true,
  },
  {
    accountCode: '4100',
    accountName: 'Sales Returns',
    accountType: 'Revenue',
    category: 'Revenue',
    description: 'Returns and allowances',
    isActive: true,
  },
  {
    accountCode: '4200',
    accountName: 'Other Income',
    accountType: 'Revenue',
    category: 'Other Income',
    description: 'Other sources of income',
    isActive: true,
  },

  // Expenses
  {
    accountCode: '5000',
    accountName: 'Cost of Goods Sold',
    accountType: 'Expense',
    category: 'Cost of Goods Sold',
    description: 'Direct costs of producing goods',
    isActive: true,
  },
  {
    accountCode: '5100',
    accountName: 'Direct Labor',
    accountType: 'Expense',
    category: 'Cost of Goods Sold',
    description: 'Direct labor costs',
    isActive: true,
  },
  {
    accountCode: '5200',
    accountName: 'Manufacturing Overhead',
    accountType: 'Expense',
    category: 'Cost of Goods Sold',
    description: 'Indirect manufacturing costs',
    isActive: true,
  },
  {
    accountCode: '6000',
    accountName: 'Operating Expenses',
    accountType: 'Expense',
    category: 'Operating Expenses',
    description: 'General operating expenses',
    isActive: true,
  },
  {
    accountCode: '6100',
    accountName: 'Administrative Expenses',
    accountType: 'Expense',
    category: 'Operating Expenses',
    description: 'Administrative and office expenses',
    isActive: true,
  },
  {
    accountCode: '6200',
    accountName: 'Selling Expenses',
    accountType: 'Expense',
    category: 'Operating Expenses',
    description: 'Sales and marketing expenses',
    isActive: true,
  },
  {
    accountCode: '6300',
    accountName: 'Depreciation',
    accountType: 'Expense',
    category: 'Operating Expenses',
    description: 'Depreciation expense',
    isActive: true,
  },
  {
    accountCode: '6400',
    accountName: 'Interest Expense',
    accountType: 'Expense',
    category: 'Other Expenses',
    description: 'Interest on loans and borrowings',
    isActive: true,
  },
  {
    accountCode: '6500',
    accountName: 'Tax Expense',
    accountType: 'Expense',
    category: 'Other Expenses',
    description: 'Income tax expense',
    isActive: true,
  },
];

async function seedGeneralLedgerAccounts() {
  try {
    console.log('Seeding general ledger accounts...');

    for (const account of defaultAccounts) {
      const existingAccount = await GeneralLedger.findOne({ accountCode: account.accountCode });

      if (!existingAccount) {
        await GeneralLedger.create({
          ...account,
          createdBy: '000000000000000000000000', // Default system user ID
        });
        console.log(`Created account: ${account.accountCode} - ${account.accountName}`);
      } else {
        console.log(`Account already exists: ${account.accountCode} - ${account.accountName}`);
      }
    }

    console.log('General ledger accounts seeding completed!');
  } catch (error) {
    console.error('Error seeding general ledger accounts:', error);
  }
}

module.exports = { seedGeneralLedgerAccounts };
