
const read = async (Model, req, res) => {
    // Find document by id
    const result = await Model.find({
      employeeId: req.params.id,
      companyId:req.admin.companyId,
    })  

    if (!result.length) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No Permission found ',
      });
    } else {
      // Return success resposne
      return res.status(200).json({
        success: true,
        result,
        message: 'We found this Permission ',
      });
    }
  };
  
  module.exports = read;
  