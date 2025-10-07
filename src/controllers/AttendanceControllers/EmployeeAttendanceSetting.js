const EmployeeAttendanceSetting = require('../../models/AttendanceModels/AttendanceEmployeeSetting');
const User = require('../../models/userModels/User');
const { EMP_ATTENDANCE_SETTING_CREATED, EMP_ATTENDANCE_SETTING_UPDATED } = require('@/config/activity.enums');
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { getFullName } = require("@/utils/commonFunctions");
const { attendanceTemplate } = require("@/config/emailTemplates/attendanceTemplates");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

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
    
        // Fetch old data before update
        const oldData = await EmployeeAttendanceSetting.findOne({ userId, plantId, companyId: req.admin.companyId });

        const updatedSetting = await EmployeeAttendanceSetting.findOneAndUpdate(
          { userId, plantId, companyId:req.admin.companyId },
          { $set: updateData },
          { new: true, upsert: true }
        );
    
        // Get employee info for description and email
        const employee = await User.findById(userId).select('employeeCode employeeInfo email name');

        // Trigger activity tracker
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: plantId,
      module: MODULE.attendance,
      subModuleAffected: null,
      fileAffected: FILE.file_employee_attendance_setting,
      modelAffected: [MODEL_AFFECTED.model_employeeAttendanceSetting],
      eventType: oldData ? EMP_ATTENDANCE_SETTING_UPDATED : EMP_ATTENDANCE_SETTING_CREATED,
      actionDone: oldData ? ACTIONS.update : ACTIONS.create,
      oldData: oldData ? oldData.toObject() : null,
      newData: updatedSetting.toObject(),
      description: `Employee attendance setting ${oldData ? 'updated' : 'created'} for ${getFullName(employee?.employeeInfo)} (${employee?.employeeCode}) by ${getFullName(req.admin.employeeInfo)}`
    });

    // ---- EMAIL INTEGRATION ----
    const baseUrl = process.env.FRONTEND_URL || 'https://erpica.netlify.app/';
    const settingsLink = `${baseUrl}attendance/my-settings`;

    if (employee?.email) {
      const settingsDetails = `
        Location Based: ${isLocationBased ? 'Yes' : 'No'}<br/>
        Approval Required: ${isApprovalRequired ? 'Yes' : 'No'}<br/>
        Marking Enabled: ${isMarkingEnabled ? 'Yes' : 'No'}<br/>
        ${oldData ? 'Updated' : 'Created'} By: ${getFullName(req.admin.employeeInfo)}
      `;
      const settingDate = new Date().toLocaleString();

      const emailHtml = generateMasterTemplate({
        user_name: getFullName(employee.employeeInfo),
        event_name: attendanceTemplate.employeeAttendanceSettingUpdated.event_name,
        action: attendanceTemplate.employeeAttendanceSettingUpdated.action,
        status: oldData ? 'Updated' : 'Created',
        message_intro: `Your attendance settings have been ${oldData ? 'updated' : 'created'} by the administration`,
        notes: `${settingsDetails}<br/>${oldData ? 'Updated' : 'Created'} On: ${settingDate}`,
        actionbutton_text: attendanceTemplate.employeeAttendanceSettingUpdated.actionbutton_text,
        actionlink: settingsLink,
        fallback_note: attendanceTemplate.employeeAttendanceSettingUpdated.fallback_note,
        action_link: settingsLink
      });
      sendEmail(employee.email, attendanceTemplate.employeeAttendanceSettingUpdated.subject, emailHtml);
    }

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