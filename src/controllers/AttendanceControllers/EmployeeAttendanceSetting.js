const EmployeeAttendanceSetting = require('../../models/AttendanceModels/AttendanceEmployeeSetting')

const EmpAttendanceSetting = async (req,res) => {

    try {
        const {
          userId,
          plantId,
          isLocationBased,
          isApprovalRequired,
          isMarkingEnabled,
          inTime,
          outTime,
          avgHours,
          location,
          workingHours,
          weeklyOffs,
          remote
        } = req.body;
    
        if (!userId || !plantId) {
          return res.status(400).json({ message: "userId and plantId are required." });
        }
    
        const updateData = {
          isLocationBased,
          isApprovalRequired,
          isMarkingEnabled,
          inTime,
          outTime,
          avgHours,
          location,
          workingHours,
          weeklyOffs,
          remote
        };
    
        const updatedSetting = await EmployeeAttendanceSetting.findOneAndUpdate(
          { userId, plantId, companyId:req.admin.companyId },
          { $set: updateData },
          { new: true, upsert: true }
        );
    
        res.status(200).json({
          message: "Attendance settings saved successfully.",
          data: updatedSetting
        });
    
      } catch (error) {
        console.error("Error in saving attendance settings:", error);
        res.status(500).json({ message: "Server error", error: error.message });
      }
   
    

}


module.exports = EmpAttendanceSetting