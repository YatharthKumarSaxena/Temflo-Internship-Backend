const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  email:{
        type:String,
        required:[true,'Enter Email Address'],
        unique:[true,'Email Already Exist'],
        trim:true,
        required: true,
    },
    employeeCode:{
        type:String,
        required:true,
        unique:true,
        minlength:4,
        maxlength:15,
        trim:true
    },
    mobile:{
        type:Number,
        minlength:10,
        maxlength:13,
    },
    type:{
        type:String,
        enum:['admin','employee','leader']
    },
    status:{
        type:String,
        enum:['active','banned'],
        default:'active'
    },
    team:[{
        type:Schema.Types.ObjectId,
        ref:'Team'
    }],
    leadTeam:[{
        type:Schema.Types.ObjectId,
        ref:'Team'
    }],
    image:{
        type:String,
        required:false,
        default:'user.png'
    },
    companyId:{
        type:Schema.Types.ObjectId,
        ref:'Company'
    },
    name: {
        type: String,
        trim: true
    },
    employeeInfo: {
        firstName: {
            type: String,
           
            trim: true
        },
        middleName: {
            type: String,
            trim: true
        },
        lastName: {
            type: String,
           
            trim: true
        },
        bloodGroup: {
            type: String,
            trim: true
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
          
        },
        dob: {
            type: Date,
           
        },
      
        emailPersonal: {
            type: String,
            trim: true,
           
        },
        department: {
            type: String,
            trim: true
        },
        dateOfJoining: {
            type: Date,
          
        },
    
        designation: {
            type: String,
            trim: true
        },
        // supervisor: {
        //     type: Schema.Types.ObjectId,
        //     ref: 'User' // Reference to another user (supervisor)
        // }
    },
    address: {
        permanentAddress: {
            address: String,
            country: String,
            state: String,
            city: String
        },
        presentAddress: {
            address: String,
            country: String,
            state: String,
            city: String
        }
    },
    emergencyContact:{
        name: String,
        address: String,
        number: String,
        email: String
    },
    degreeInfo:[
        {
        degree: String,
        institute: String,
        year:String,
        percentage: String,
        document: String
        }
    ],
    experience:[
        {
        company: String,
        position: String,
        dateOfEntry: String,
        dateOfExit: String,
        document: String
        }
    ],
    bankDetail:{
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountType: String,
    accountHolder: String,
    document: String
    },
    panaddhar:{
        panCard: String,
        aadharCard: String
    },

  created: {
    type: Date,
    default: Date.now,
  },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
 
});

module.exports = mongoose.model('User', UserSchema);
