require('dotenv').config();
const mongoose = require('mongoose');
const { activityTracker } = require('../utils/activityTracker');
const { USER_REGISTERED } = require('../config/activity.enums');
const { MODULE, SUBMODULE, FILE, MODEL_AFFECTED, ACTIONS } = require('../config/structure.config');

console.log('✅ Activity Tracker Test started');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URI || 'mongodb://localhost:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  try {
    const testResult = await activityTracker({
      userId: new mongoose.Types.ObjectId(),
      companyId: 'TEST_COMPANY_123',
      plantId: null,
      module: MODULE.middlewares,
      subModuleAffected: SUBMODULE.createAuth,
      fileAffected: FILE.file_createAuth_register,
      modelAffected: [MODEL_AFFECTED.model_user, MODEL_AFFECTED.model_userPassword],
      eventType: USER_REGISTERED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: { email: 'test@example.com', name: 'Test User' },
    });

    if (testResult) {
      console.log('✅ Activity Tracker test passed!');
    } else {
      console.log('❌ Activity Tracker test failed.');
    }
  } catch (error) {
    console.error('❌ Activity Tracker test error:', error);
  } finally {
    mongoose.disconnect();
  }
})();
