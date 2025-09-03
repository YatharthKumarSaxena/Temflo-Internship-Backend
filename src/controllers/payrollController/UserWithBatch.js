const User = require("../../models/userModels/User");
const UserWithBatch = require("../../models/parollModels/UserWithBatch");
const Batch = require("../../models/parollModels/Batch");


const setNoCache = (res) => {
  res.set("Cache-Control", "no-store");
};

exports.syncUsers = async (req, res) => {
  try {
    // Fetch all users
    const users = await User.find({}, {
      email: 1,
      name: 1,
      role: 1,
      companyId: 1,
      address: 1,
      city: 1,
      state: 1,
      phoneNumber: 1,
      year: 1,
    });

    // Fetch batch names
    const batches = await Batch.find({}, "name");
    const batchNames = batches.map(b => b.name);

    const inserted = [];

    for (const user of users) {
      // ✅ Check if user already exists by companyId OR email
      const exists = await UserWithBatch.findOne({
        $or: [{ companyId: user.companyId }, { email: user.email }]
      });
      if (exists) continue;

      // Map only required fields
      const userWithBatch = new UserWithBatch({
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        address: user.address?.permanentAddress?.address || "",
        city: user.city,
        state: user.state,
        phoneNumber: user.phoneNumber,
        year: user.year,
        batches: batchNames,
        selectedBatch: "Not selected any batch",
        isBatchSelected: false,
      });

      inserted.push(await userWithBatch.save());
    }

    res.set("Cache-Control", "no-store");
    res.status(201).json({
      message: "Users synced into UserWithBatch successfully",
      count: inserted.length,
      data: inserted
    });
  } catch (err) {
    console.error("Sync Error:", err);
    res.status(500).json({ error: err.message });
  }
};



// exports.syncUsers = async (req, res) => {
//   try {
//     const users = await User.find();
//     const batches = await Batch.find({}, "name -_id");
//     const batchNames = batches.map(b => b.name);

//     const inserted = [];

//     for (const user of users) {
//       const exists = await UserWithBatch.findOne({ email: user.email });
//       if (exists) continue;

//       const userWithBatch = new UserWithBatch({
//         ...user.toObject(),
//         batches: batchNames,
//         selectedBatch: "Not selected any batch",
//         isBatchSelected: false
//       });

//       inserted.push(await userWithBatch.save());
//     }

//     res.set("Cache-Control", "no-store");

//     res.status(201).json({
//       message: "Users synced into UserWithBatch successfully",
//       count: inserted.length,
//       data: inserted
//     });
//   } catch (err) {
//     console.error("Sync Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };


// Create UserWithBatch manually
exports.createUser = async (req, res) => {
  try {
    const user = new UserWithBatch(req.body);
    user.isBatchSelected = user.selectedBatch && user.selectedBatch !== "Not selected any batch";
    const saved = await user.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all active users with batch info
exports.getActiveUsersWithBatch = async (req, res) => {
  try {
    const users = await UserWithBatch.find({ enabled: true }, {
      _id: 1, email: 1, name: 1, isBatchSelected: 1, status: 1, enabled: 1
    });

    const result = users.map(u => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      batchAllotted: u.isBatchSelected ? "Yes" : "No",
      status: u.status,
      enabled: u.enabled
    }));
    setNoCache(res);

    res.json(result);
  } catch (err) {
    console.error("Error fetching active users with batch:", err);
    res.status(500).json({ error: err.message });
  }
};


// Get all active users with batch info
// exports.getActiveUsersWithOutBatch = async (req, res) => {
//   try {
//     const users = await UserWithBatch.find({ enabled: true }, {
//       _id: 1, email: 1, name: 1, isBatchSelected: 0, status: 1, enabled: 1
//     });

//     const result = users.map(u => ({
//       _id: u._id,
//       email: u.email,
//       name: u.name,
//       batchAllotted: !u.isBatchSelected ? "Yes" : "No",
//       status: u.status,
//       enabled: u.enabled
//     }));

//     res.json(result);
//   } catch (err) {
//     console.error("Error fetching active users with batch:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserWithBatch.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await UserWithBatch.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const updatedData = req.body;
    if (updatedData.selectedBatch) {
      updatedData.isBatchSelected = updatedData.selectedBatch !== "Not selected any batch";
    }

    const updated = await UserWithBatch.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await UserWithBatch.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
