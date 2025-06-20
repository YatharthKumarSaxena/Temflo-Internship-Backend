const Policy = require('../../models/coreModels/Policy')

class UpdateController{

    updatePolicy = async (req, res, next) => {
    try {
    const file = req.file;
    const filename = req.file.path;

    const { description, publishedDate } = req.body;

    if (!description || !publishedDate || !file) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newPolicyEntry = {
      description,
      publishedDate,
      file: filename,
    };

    let policy = await Policy.findOne({ companyId: req.admin.companyId });

    if (policy) {
      // Policy document found — push into array
      policy.policies.push(newPolicyEntry);
      await policy.save();

      return res.status(200).json({
        success: true,
        message: 'Policy updated successfully',
        policy: policy.policies
      });
    } else {
      // Policy document not found — create a new one
      policy = new Policy({
        companyId: req.admin.companyId,
        policies: [newPolicyEntry]
      });

      await policy.save();

      return res.status(201).json({
        success: true,
        message: 'Policy created and policy entry added',
        policy: policy.policies
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error processing policy' });
  }

}

}


module.exports = new UpdateController();