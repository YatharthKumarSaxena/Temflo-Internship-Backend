const mongoose = require('mongoose');
const TDSCode = require('../models/MaterialModels/TDSCodeModel');

const tdsCodes = [
  {
    tdsCode: '194A',
    description: 'Interest other than on securities',
    tdsRate: 10,
    section: '194A',
    category: 'Interest',
  },
  {
    tdsCode: '194B',
    description: 'Winnings from lottery or crossword puzzle',
    tdsRate: 30,
    section: '194B',
    category: 'Other',
  },
  {
    tdsCode: '194BB',
    description: 'Winnings from horse race',
    tdsRate: 30,
    section: '194BB',
    category: 'Other',
  },
  {
    tdsCode: '194C',
    description: 'Payment to contractors',
    tdsRate: 1,
    section: '194C',
    category: 'Contractor',
  },
  {
    tdsCode: '194D',
    description: 'Insurance commission',
    tdsRate: 5,
    section: '194D',
    category: 'Commission',
  },
  {
    tdsCode: '194E',
    description: 'Payment to non-resident sportsmen or sports association',
    tdsRate: 20,
    section: '194E',
    category: 'Other',
  },
  {
    tdsCode: '194EE',
    description: 'Payment in respect of deposits under National Savings Scheme',
    tdsRate: 10,
    section: '194EE',
    category: 'Interest',
  },
  {
    tdsCode: '194F',
    description: 'Payment on account of repurchase of units by Mutual Fund or Unit Trust of India',
    tdsRate: 20,
    section: '194F',
    category: 'Other',
  },
  {
    tdsCode: '194G',
    description: 'Commission on sale of lottery tickets',
    tdsRate: 5,
    section: '194G',
    category: 'Commission',
  },
  {
    tdsCode: '194H',
    description: 'Commission or brokerage',
    tdsRate: 5,
    section: '194H',
    category: 'Commission',
  },
  {
    tdsCode: '194I',
    description: 'Rent',
    tdsRate: 10,
    section: '194I',
    category: 'Rent',
  },
  {
    tdsCode: '194IA',
    description: 'Payment on transfer of certain immovable property other than agricultural land',
    tdsRate: 1,
    section: '194IA',
    category: 'Other',
  },
  {
    tdsCode: '194IB',
    description: 'Payment of rent by individual or HUF not liable to tax audit',
    tdsRate: 5,
    section: '194IB',
    category: 'Rent',
  },
  {
    tdsCode: '194IC',
    description: 'Payment under specified agreement',
    tdsRate: 10,
    section: '194IC',
    category: 'Other',
  },
  {
    tdsCode: '194J',
    description: 'Fees for professional or technical services',
    tdsRate: 10,
    section: '194J',
    category: 'Professional Services',
  },
  {
    tdsCode: '194K',
    description: 'Income in respect of units',
    tdsRate: 10,
    section: '194K',
    category: 'Other',
  },
  {
    tdsCode: '194LA',
    description: 'Payment of compensation on acquisition of certain immovable property',
    tdsRate: 10,
    section: '194LA',
    category: 'Other',
  },
  {
    tdsCode: '194LB',
    description: 'Income by way of interest from infrastructure debt fund',
    tdsRate: 5,
    section: '194LB',
    category: 'Interest',
  },
  {
    tdsCode: '194LC',
    description: 'Income by way of interest from an Indian company engaged in specified business',
    tdsRate: 5,
    section: '194LC',
    category: 'Interest',
  },
  {
    tdsCode: '194LD',
    description: 'Income by way of interest on certain bonds and Government securities',
    tdsRate: 5,
    section: '194LD',
    category: 'Interest',
  },
  {
    tdsCode: '194LBA',
    description: 'Certain income from units of a business trust',
    tdsRate: 10,
    section: '194LBA',
    category: 'Other',
  },
  {
    tdsCode: '194LBB',
    description: 'Income in respect of investment fund',
    tdsRate: 10,
    section: '194LBB',
    category: 'Other',
  },
  {
    tdsCode: '194LBC',
    description: 'Income from securitisation trust',
    tdsRate: 25,
    section: '194LBC',
    category: 'Other',
  },
  {
    tdsCode: '194M',
    description: 'Payment of certain sum by individual or HUF',
    tdsRate: 5,
    section: '194M',
    category: 'Other',
  },
  {
    tdsCode: '194N',
    description: 'Payment of certain amounts in cash',
    tdsRate: 2,
    section: '194N',
    category: 'Other',
  },
  {
    tdsCode: '194O',
    description: 'Payment of certain sum by e-commerce operator',
    tdsRate: 1,
    section: '194O',
    category: 'Other',
  },
  {
    tdsCode: '194P',
    description: 'Payment of certain income of senior citizen',
    tdsRate: 0,
    section: '194P',
    category: 'Other',
  },
  {
    tdsCode: '194Q',
    description: 'Payment of certain sum for purchase of goods',
    tdsRate: 0.1,
    section: '194Q',
    category: 'Other',
  },
  {
    tdsCode: '194R',
    description: 'Benefit or perquisite in respect of business or profession',
    tdsRate: 10,
    section: '194R',
    category: 'Other',
  },
  {
    tdsCode: '194S',
    description: 'Payment on transfer of virtual digital asset',
    tdsRate: 1,
    section: '194S',
    category: 'Other',
  },
  {
    tdsCode: '192',
    description: 'Salary',
    tdsRate: 0, // As per tax slab
    section: '192',
    category: 'Salary',
  },
  {
    tdsCode: '193',
    description: 'Interest on securities',
    tdsRate: 10,
    section: '193',
    category: 'Interest',
  },
];

const seedTDSCodes = async () => {
  try {
    // Clear existing TDS codes
    await TDSCode.deleteMany({});

    // Add required fields to each TDS code
    const tdsCodesWithRequiredFields = tdsCodes.map((code) => ({
      ...code,
      createdBy: new mongoose.Types.ObjectId(), // Generate a dummy ObjectId for seeder
      status: 'active',
    }));

    // Insert new TDS codes
    const createdCodes = await TDSCode.insertMany(tdsCodesWithRequiredFields);

    console.log(`Successfully seeded ${createdCodes.length} TDS codes`);
    return createdCodes;
  } catch (error) {
    console.error('Error seeding TDS codes:', error);
    throw error;
  }
};

module.exports = { seedTDSCodes, tdsCodes };
