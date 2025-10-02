const update = async (Model, req, res) => {
    try {
      const { id } = req.params; // Business Segment ID from URL
      const { description } = req.body;
  
      // Validate description
      if (!description || typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description is required and must be a non-empty string.",
        });
      }
  
      // Update only description
      const updatedSegment = await Model.findOneAndUpdate(
        { _id: id, companyId: req.admin.companyId, removed: false },
        { description: description.trim() },
        { new: true }
      );
  
      if (!updatedSegment) {
        return res.status(404).json({
          success: false,
          message: "Cost/Profit Center not found.",
        });
      }
  
      return res.status(200).json({
        success: true,
        result: updatedSegment,
        message: "Cost/Profit Center description updated successfully.",
      });
  
    } catch (error) {
      console.error("Update Cost/Profit Center Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
  
  module.exports = update;
  