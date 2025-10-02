const buildCrud = (Model) => {
  return {
    create: async (req, res) => {
      try {
        const payload = {
          ...req.body,
          companyId: req.admin.companyId,
          createdBy: req.user?._id || req.admin?._id,
        };
        const doc = await Model.create(payload);
        return res.status(201).json({ success: true, data: doc });
      } catch (error) {
        const status = error.code === 11000 ? 400 : 500;
        return res.status(status).json({ success: false, message: error.message });
      }
    },
    list: async (req, res) => {
      try {
        const { page = 1, limit = 20, search } = req.query;
        const q = { companyId: req.admin.companyId, removed: { $ne: true } };
        if (search) {
          q.$text = { $search: search };
        }
        const docs = await Model.find(q)
          .skip((page - 1) * limit)
          .limit(Number(limit))
          .sort({ createdAt: -1 });
        const total = await Model.countDocuments(q);
        return res.json({ success: true, data: docs, total });
      } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
      }
    },
    read: async (req, res) => {
      try {
        const doc = await Model.findOne({ _id: req.params.id, companyId: req.admin.companyId });
        if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
        return res.json({ success: true, data: doc });
      } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
      }
    },
    update: async (req, res) => {
      try {
        const doc = await Model.findOneAndUpdate(
          { _id: req.params.id, companyId: req.admin.companyId },
          { ...req.body, updatedBy: req.user?._id || req.admin?._id },
          { new: true }
        );
        if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
        return res.json({ success: true, data: doc });
      } catch (error) {
        const status = error.code === 11000 ? 400 : 500;
        return res.status(status).json({ success: false, message: error.message });
      }
    },
    remove: async (req, res) => {
      try {
        const doc = await Model.findOneAndUpdate(
          { _id: req.params.id, companyId: req.admin.companyId },
          { removed: true, updatedBy: req.user?._id || req.admin?._id },
          { new: true }
        );
        if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
        return res.json({ success: true, data: doc });
      } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
      }
    },
  };
};

module.exports = buildCrud;
