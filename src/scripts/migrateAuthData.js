const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Migration script to transition from old auth schema to new enhanced auth schema
 * This script should be run once after deploying the new authentication system
 */

const migrateAuthData = async () => {
  console.log('🚀 Starting authentication data migration...');

  try {
    // Get all password models
    const models = ['AdminPassword', 'UserPassword'];

    for (const modelName of models) {
      console.log(`\n📋 Migrating ${modelName}...`);

      try {
        const Model = mongoose.model(modelName);

        // Find all documents that need migration
        const documents = await Model.find({
          $or: [
            { activeSessions: { $exists: false } },
            { blacklistedTokens: { $exists: false } },
            { tokenVersion: { $exists: false } },
            { salt: { $exists: true } }, // Old salt-based passwords
          ],
        });

        console.log(`Found ${documents.length} ${modelName} documents to migrate`);

        let migrated = 0;
        let errors = 0;

        for (const doc of documents) {
          try {
            let needsSave = false;

            // Migrate session structure
            if (!doc.activeSessions) {
              doc.activeSessions = [];
              needsSave = true;
            }

            // Migrate old loggedSessions to new activeSessions structure
            if (doc.loggedSessions && doc.loggedSessions.length > 0) {
              console.log(
                `Migrating ${doc.loggedSessions.length} logged sessions for user ${doc.user}`
              );

              // Convert old sessions to new format (mark them for cleanup since we can't verify them)
              for (const oldToken of doc.loggedSessions) {
                try {
                  // Try to decode the old token to get expiry info
                  const jwt = require('jsonwebtoken');
                  const decoded = jwt.decode(oldToken);

                  if (decoded && decoded.exp) {
                    const expiryDate = new Date(decoded.exp * 1000);

                    // Only migrate if token hasn't expired
                    if (expiryDate > new Date()) {
                      doc.activeSessions.push({
                        accessToken: oldToken,
                        refreshToken: '', // No refresh token in old system
                        tokenVersion: 1,
                        deviceInfo: {
                          userAgent: 'Legacy Session',
                          ip: 'Unknown',
                          deviceId: 'legacy-' + Math.random().toString(36).substr(2, 9),
                        },
                        lastActivity: new Date(),
                        createdAt: new Date(decoded.iat ? decoded.iat * 1000 : Date.now()),
                        expiresAt: expiryDate,
                      });
                    }
                  }
                } catch (tokenError) {
                  console.warn(
                    `Could not decode legacy token for user ${doc.user}: ${tokenError.message}`
                  );
                }
              }

              // Remove old loggedSessions field
              doc.loggedSessions = undefined;
              needsSave = true;
            }

            // Initialize blacklisted tokens
            if (!doc.blacklistedTokens) {
              doc.blacklistedTokens = [];
              needsSave = true;
            }

            // Initialize token version
            if (!doc.tokenVersion) {
              doc.tokenVersion = 1;
              needsSave = true;
            }

            // Initialize security fields
            if (!doc.lastPasswordChange) {
              doc.lastPasswordChange = doc.createdAt || new Date();
              needsSave = true;
            }

            if (!doc.lastCleanup) {
              doc.lastCleanup = new Date();
              needsSave = true;
            }

            if (!doc.passwordHistory) {
              doc.passwordHistory = [];
              needsSave = true;
            }

            // Migrate password hashing (from salt+password to direct bcrypt)
            if (doc.salt && doc.password) {
              console.log(`Migrating password hash for user ${doc.user}`);

              try {
                // The existing password is already hashed with salt
                // We'll keep it as is and remove the salt field
                // New passwords will use the new hashing method

                // Add current password to history
                doc.passwordHistory.push({
                  hash: doc.password,
                  createdAt: doc.lastPasswordChange || new Date(),
                });

                // Remove salt field
                doc.salt = undefined;
                needsSave = true;

                console.log(`✅ Migrated password for user ${doc.user}`);
              } catch (hashError) {
                console.error(
                  `❌ Failed to migrate password for user ${doc.user}:`,
                  hashError.message
                );
                errors++;
                continue;
              }
            }

            // Update email token structure
            if (doc.emailToken && typeof doc.emailToken === 'string') {
              doc.emailToken = {
                token: doc.emailToken,
                created: doc.createdAt || new Date(),
              };
              needsSave = true;
            }

            // Update reset token structure
            if (doc.resetToken && typeof doc.resetToken === 'string') {
              doc.resetToken = {
                token: doc.resetToken,
                created: new Date(),
              };
              needsSave = true;
            }

            if (needsSave) {
              await doc.save();
              migrated++;

              if (migrated % 10 === 0) {
                console.log(`Progress: ${migrated}/${documents.length} documents migrated`);
              }
            }
          } catch (docError) {
            console.error(`❌ Failed to migrate document ${doc._id}:`, docError.message);
            errors++;
          }
        }

        console.log(`✅ ${modelName} migration completed: ${migrated} migrated, ${errors} errors`);
      } catch (modelError) {
        console.error(`❌ Failed to migrate ${modelName}:`, modelError.message);
      }
    }

    console.log('\n🎉 Authentication data migration completed!');

    // Run cleanup to remove any invalid sessions
    console.log('\n🧹 Running initial cleanup...');
    const authService = require('../services/authService');

    try {
      await authService.cleanupExpiredSessions('Admin');
      await authService.cleanupExpiredSessions('User');
      console.log('✅ Initial cleanup completed');
    } catch (cleanupError) {
      console.error('❌ Initial cleanup failed:', cleanupError.message);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Rollback function (partial - can't fully restore old data)
const rollbackMigration = async () => {
  console.log('⚠️  Starting authentication data rollback...');
  console.log('Note: This is a partial rollback. Some data cannot be fully restored.');

  try {
    const models = ['AdminPassword', 'UserPassword'];

    for (const modelName of models) {
      console.log(`\n📋 Rolling back ${modelName}...`);

      const Model = mongoose.model(modelName);

      const result = await Model.updateMany(
        {},
        {
          $unset: {
            activeSessions: 1,
            blacklistedTokens: 1,
            passwordHistory: 1,
            tokenVersion: 1,
            lastPasswordChange: 1,
            lastCleanup: 1,
          },
        }
      );

      console.log(`✅ ${modelName} rollback completed: ${result.modifiedCount} documents updated`);
    }

    console.log(
      '\n⚠️  Rollback completed. Note: Active sessions and security data have been removed.'
    );
    console.log('Users will need to log in again.');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
};

// Export functions for use in other scripts
module.exports = {
  migrateAuthData,
  rollbackMigration,
};

// Run migration if this script is executed directly
if (require.main === module) {
  const runMigration = async () => {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.DATABASE);

      console.log('📡 Connected to MongoDB');

      // Check if this is a rollback
      if (process.argv.includes('--rollback')) {
        await rollbackMigration();
      } else {
        await migrateAuthData();
      }

      console.log('🏁 Migration script completed');
      process.exit(0);
    } catch (error) {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    }
  };

  runMigration();
}
