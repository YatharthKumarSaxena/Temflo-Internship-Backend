const UserModel = require('../../../models/userModels/User')
const UserPassword = require('../../../models/userModels/UserPassword')
const bcrypt = require('bcryptjs');
const { generate: uniqueId } = require('shortid');

class UpdateController{

  updateInfo = async (req, res, next) => {
        try {

        // Check the type and get _id accordingly
        const _id = req.params.id 
        const { firstName, middleName, lastName, bloodGroup, gender, dob, contactNumber, emailPersonal, department, dateOfJoining, designation, supervisor,role,status } = req.body

        const updatedUser = await UserModel.findByIdAndUpdate({_id,companyId:req.admin.companyId}, {
                $set: {
                    "mobile": contactNumber,
                    "employeeInfo.firstName": firstName,
                    "employeeInfo.middleName": middleName,
                    "employeeInfo.lastName": lastName,
                    "employeeInfo.bloodGroup": bloodGroup,
                    "employeeInfo.gender": gender,
                    "employeeInfo.dob": dob,
                    "employeeInfo.emailPersonal": emailPersonal,
                    "employeeInfo.department": department,
                    "employeeInfo.dateOfJoining": dateOfJoining,
                    "employeeInfo.designation": designation,
                    "supervisor":supervisor,
                    "status":status,
                    "role":role
                }
            }, { new: true });

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            return res.status(200).json({ success: true, message: 'Employee information updated successfully', employee: updatedUser });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Error updating employee information'});
        }

    }

    updateAddress = async (req, res, next) => {
        try {
            const _id =  req.params.id 

            const { permanentAddress, presentAddress } = req.body
            
            const updatedUser = await UserModel.findByIdAndUpdate({_id,companyId:req.admin.companyId}, {
                $set: {
                    "address.permanentAddress.address": permanentAddress.address,
                    "address.permanentAddress.country": permanentAddress.country,
                    "address.permanentAddress.state": permanentAddress.state,
                    "address.permanentAddress.city": permanentAddress.city,
                    "address.presentAddress.address": presentAddress.address,
                    "address.presentAddress.country": presentAddress.country,
                    "address.presentAddress.state": presentAddress.state,
                    "address.presentAddress.city": presentAddress.city,
                }
            }, { new: true });

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            return res.status(200).json({ success: true, message: 'Employee information updated successfully', employee: updatedUser });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Error updating employee information'});
        }

    }

    updateEmergencyContact = async (req, res, next) => {
        try {

            const _id = req.params.id 

            const { name, address, number, email } = req.body

            const updatedUser = await UserModel.findByIdAndUpdate({_id, comapanyId:req.admin.companyId }, {
                $set: {
                    "emergencyContact.name": name,
                    "emergencyContact.address": address,
                    "emergencyContact.number": number,
                    "emergencyContact.email": email,
                }
            }, { new: true });

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            return res.status(200).json({ success: true, message: 'Employee information updated successfully', employee: updatedUser });



        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Error updating employee information', error: error.message });


        }
    }

    updateBankDetail = async (req, res, next) => {
        try {
          const file = req.file;
          const _id = req.params.id;
          const {
            accountNumber,
            bankName,
            ifscCode,
            accountType,
            accountHolder,
            documentPresent,
          } = req.body;
      
          let filename = '';
      
          if (file) {
            filename = file.path; // New file uploaded
          } else if (documentPresent === 'true' || documentPresent === true) {
            const existingUser = await UserModel.findOne({
              _id,
              companyId: req.admin.companyId,
            });
      
            if (!existingUser) {
              return res
                .status(404)
                .json({ success: false, message: 'Employee not found' });
            }
      
            filename = existingUser.bankDetail?.document || '';
          } else {
            return res.status(400).json({
              success: false,
              message: 'No document uploaded or marked as present',
            });
          }
      
          const updatedUser = await UserModel.findByIdAndUpdate(
            { _id, companyId: req.admin.companyId },
            {
              $set: {
                'bankDetail.accountNumber': accountNumber,
                'bankDetail.bankName': bankName,
                'bankDetail.ifscCode': ifscCode,
                'bankDetail.accountType': accountType,
                'bankDetail.accountHolder': accountHolder,
                'bankDetail.document': filename,
              },
            },
            { new: true }
          );
      
          if (!updatedUser) {
            return res
              .status(404)
              .json({ success: false, message: 'Employee not found' });
          }
      
          return res.status(200).json({
            success: true,
            message: 'Employee information updated successfully',
            employee: updatedUser,
          });
        } catch (error) {
          console.error(error);
          return res
            .status(500)
            .json({ success: false, message: 'Error updating employee information' });
        }
      };
      

    updateDegreeInfo = async (req, res, next) => {
        try {

            const file = req.file;
            const filename = req.file.path;

            const _id = req.params.id ;

            const { degree, institute, year, percentage, key } = req.body;

            if (!degree || !institute || !year || !percentage || !file) return res.status(404).json({ success: false, message: 'All field requireed' });


            const user = await UserModel.findOne({ _id, companyId:req.admin.companyId });

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Destructure the degree fields from the request body
            const newDegree = {
                degree,
                institute,
                year,
                percentage,
                key,
                document: filename // Add file path (if uploaded)
            };
            
            
            // Push new degree to the degreeInfo array
            user.degreeInfo.push(newDegree);

            // Save the updated user information
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Degree information updated successfully',
                degreeInfo: user.degreeInfo
            });


        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Error updating employee information' });


        }
    }

    updateExperienceInfo = async (req, res, next) => {
        try {

            const file = req.file;
            const filename = req.file.path;

            const _id = req.params.id ;

            const { company,position,dateOfEntry,dateOfExit, key } = req.body;

            if (!company || !position || !dateOfEntry || !dateOfExit || !file) return res.status(404).json({ success: false, message: 'All field requireed' });


            const user = await UserModel.findOne({ _id, companyId:req.admin.companyId });

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Destructure the degree fields from the request body
            const newExperience = {
                company,
                position,
                dateOfEntry,
                dateOfExit,
                key,
                document: filename // Add file path (if uploaded)
            };
            
            
            // Push new degree to the degreeInfo array
            user.experience.push(newExperience);

            // Save the updated user information
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Experience information updated successfully',
                experienceInfo: user.experience
            });


        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Error updating employee information' });


        }
    }


    updatePan = async (req,res,next) => {

        try{

            const file = req.file;
            const filename = req.file.path;
           
            if(!file) return res.status(404).json({ success: false, message: 'All field required' });


            const _id =  req.params.id 

            const updatedUser = await UserModel.findByIdAndUpdate({_id,companyId:req.admin.companyId}, {
                $set: {
                    "panaddhar.panCard": filename,
                    
                }
            }, { new: true });

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            return res.status(200).json({ success: true, message: 'Employee information updated successfully', employee: updatedUser });




        }catch (error){
            console.log(error)
            return res.status(500).json({ success: false, message: 'Error updating employee information' });

        }

    }

    updateAadhar = async (req,res,next) => {

        try{

            const file = req.file;
            const filename = req.file.path;
           
            if(!file) return res.status(404).json({ success: false, message: 'All field Required' }) ;


            const _id =  req.params.id ;
            const updatedUser = await UserModel.findByIdAndUpdate({_id,companyId:req.admin.companyId}, {
                $set: {
                    "panaddhar.aadharCard": filename,
                    
                }
            }, { new: true });

            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            return res.status(200).json({ success: true, message: 'Employee information updated successfully', employee: updatedUser });


        }catch (error){
            console.log(error)
            return res.status(500).json({ success: false, message: 'Error updating employee information' });

        }

    }

    updatePassword = async (req,res,next) =>{

        const { password, confirmPassword } = req.body;
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({ msg: 'User ID is required in query.' });
        }

        if (!password || !confirmPassword) {
            return res.status(400).json({ msg: 'New password and confirm password are required.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ msg: 'The new password must be at least 8 characters long.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ msg: 'New password and confirm password do not match.' });
        }

        // Step 1: Fetch existing password entry
        const existingPasswordDoc = await UserPassword.findOne({
            user: id,
            removed: false,
        });

        if (!existingPasswordDoc) {
            return res.status(404).json({ msg: 'Password record not found.' });
        }

        // Step 2: Generate and update new password
        const salt = uniqueId();
        const passwordHash = bcrypt.hashSync(salt + password);

        const resultPassword = await UserPassword.findOneAndUpdate(
            { user: id, removed: false },
            { $set: { password: passwordHash, salt } },
            { new: true }
        ).exec();

        if (!resultPassword) {
            return res.status(403).json({
            success: false,
            result: null,
            message: "User password couldn't be updated correctly.",
            });
        }

        return res.status(200).json({
            success: true,
            result: {},
            message: 'Password updated successfully',
        });

    }


}


module.exports = new UpdateController();