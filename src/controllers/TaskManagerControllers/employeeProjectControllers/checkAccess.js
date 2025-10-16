const mongoose = require('mongoose');

const checkAccess = async (req, res) => {
    try {
        const Project = mongoose.model('Project');
        const Member = mongoose.model('Member');

        const { projectId } = req.body;
        const { companyId, id: userId } = req.admin;

        // Step 1: Validate projectId
        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required',
            });
        }

        const member = await Member.findOne({
            userId,
            projectId,
            companyId,
            removed: false,
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                hasAccess: false,
                project: null,
                message: 'You do not have access to this project',
            });
        }

        return res.status(200).json({
            success: true,
            hasAccess: true,
            message: 'Project data fetched successfully',
        });
    } catch (error) {
        console.error('Project Reading Error:', error);
        return res.status(500).json({
            success: false,
            hasAccess: false,
            message: 'Internal server error',
        });
    }
};

module.exports = checkAccess;
