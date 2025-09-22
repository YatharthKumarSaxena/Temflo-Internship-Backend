const express = require('express');
const router = express.Router();

const adminAuth = require('../../controllers/coreControllers/adminAuth');
const buildCrud = require('../../controllers/financeControllers/crudFactory');

const FinancialHeading = require('../../models/financeModels/FinancialHeading');
const GlSubHeading = require('../../models/financeModels/GlSubHeading');
const GeneralLedger = require('../../models/financeModels/GeneralLedger');
const DocumentType = require('../../models/financeModels/DocumentType');
const NumberRange = require('../../models/financeModels/NumberRange');
const GstCode = require('../../models/financeModels/GstCode');
const TdsCode = require('../../models/financeModels/TdsCode');
const SpecialGlIndicator = require('../../models/financeModels/SpecialGlIndicator');
const DefaultGlConfig = require('../../models/financeModels/DefaultGlConfig');

// Attach CRUD routers
const entities = [
  { path: 'financial-headings', model: FinancialHeading },
  { path: 'gl-sub-headings', model: GlSubHeading },
  { path: 'general-ledgers', model: GeneralLedger },
  { path: 'document-types', model: DocumentType },
  { path: 'number-ranges', model: NumberRange },
  { path: 'gst-codes', model: GstCode },
  { path: 'tds-codes', model: TdsCode },
  { path: 'special-gl-indicators', model: SpecialGlIndicator },
  { path: 'default-gl-configs', model: DefaultGlConfig },
];

entities.forEach(({ path, model }) => {
  const c = buildCrud(model);
  router.post(`/${path}`, adminAuth.isValidAuthToken, c.create);
  router.get(`/${path}`, adminAuth.isValidAuthToken, c.list);
  router.get(`/${path}/:id`, adminAuth.isValidAuthToken, c.read);
  router.put(`/${path}/:id`, adminAuth.isValidAuthToken, c.update);
  router.delete(`/${path}/:id`, adminAuth.isValidAuthToken, c.remove);
});

module.exports = router;
