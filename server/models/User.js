const mongoose = require("mongoose");
const  validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var Schema = mongoose.Schema.Types,
    ObjectId = Schema.ObjectId;
// Defining Schema
const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: "First name can't be empty",
    trim: true,
  },
  last_name: {
    type: String,
    required: "Last name can't be empty",
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: "{VALUE} is not a valid email",
      isAsync: false,
    },
  },
  password: {
    type: String,
    trim: true,
    minlength: [5, "Password must be atleast 5 character long"],
    //maxlength : [12,'Password maximum lenth of 12 characters']
  },
  phoneno: {
    type: String,
    trim: true,
    validate: {
      validator: validator.isMobilePhone,
      message: "{VALUE} is not a valid mobile number",
      isAsync: false,
    },
    //minlength: [10, "Mobile no. must be atleast 10 character long"],
    //maxlength: [15, "Mobile no. maximum of 15 characters"],
  },
  profile_pic: {
    type: String,
    trim: true,
  },
  type: {
    type: Number,
    default: 0,
  },
  otp: {
    type: [
      {
        otp_value: {
          type: Number,
          required: true,
          trim: true,
        },
        otp_createdOn: {
          type: Date,
          required: true,
          trim: true,
        },
      },
    ],
    default: [],
  },
  location: {
    type: {
      latitude: {
        type: String,
        trim: true,
      },
      longitude: {
        type: String,
        trim: true,
      },
    },
  },
  isverified: {
    type: Boolean,
  },
  saltScret: String,
  change_password: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  jwt_tokens: {
    type: [
      {
        token: String,
        expire: Boolean,
      },
    ],
  },
  is_deleted: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  modified_by: {
    type: ObjectId,
    trim: true,
  },
  tc: { 
    type: 
    Boolean, 
    required: true 
  },
},{timestamps:true});

// Custom validation for email
userSchema.path('email').validate((val) => {
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(val);
}, 'Invalid e-mail.');

//Event
userSchema.pre('save',function(next){

  if(this.setPassword)
  {
      bcrypt.genSalt(10,(err,salt)=>{
          bcrypt.hash(this.password,salt,(err,hash)=>{

              this.password= hash;
              this.saltScret = salt;
              next();
          });
      });
  } 
  else
  {
      next();
  }  
});

//Methods
userSchema.methods.verifyPassword = function(password){

   return bcrypt.compareSync(password,this.password);

};

userSchema.methods.generateJWT = function(){
  return jwt.sign({_id:this._id,user_type:this.type},process.env.JWT_SECRET_KEY,{
      expiresIn:process.env.JWT_EXP
  });

};

userSchema.index({ email: 1,is_deleted: 1,deletedAt:1}, { unique: true });
//userSchema.index({ phoneno: 1,is_deleted: 1,deletedAt:1}, { unique: true ,partialFilterExpression: { phoneno: { $exists: true } }});
userSchema.set('toJSON', { getters: true });
// Model
mongoose.model("User", userSchema);

//export default UserModel;
