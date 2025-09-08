const express = require("express");
const router = express.Router();

const {
  syncUsers,
  createUser,
  getActiveUsersWithBatch,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,

}  = require("../../controllers/payrollController/UserWithBatch");

// Sync all users from User
router.post("/sync", syncUsers);
// router.route('/sync')
//   .post(catchErrors(payrollApi.UserWithBatch.syncUsers));


// Create UserWithBatch manually
router.post("/", createUser);

// Get all active users with batch info
router.get("/", getActiveUsersWithBatch);

router.get("/", getActiveUsersWithOutBatch);

// Get all users
router.get("/", getAllUsers);

// Get user by ID
router.get("/:id", getUserById);

// Update user
router.put("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

module.exports = router;
