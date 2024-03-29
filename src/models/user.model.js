import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String,     //we are storing avatar and coverImage in third party App cloudinary and taking url from there
            required:true
        },
        coverImage:{
            type:String,       //we are storing avatar and coverImage in third party App cloudinary and taking url from there
        },
        watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true, "Password is Required!"]
        },
        refreshToken:{
            type:String,
        }
    },
    {timestamps:true})

userSchema.pre("save", async function (next) {
   if(this.isModified("password")){
       this.password =await bcrypt.hash(this.password,10);
       next();
    }
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function () {
   return jwt.sign(
        {
            _id: this._id,
            email : this.email,
            fullname : this.fullname,
            username : this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
         {
             _id: this._id,
            
         },
         process.env.REFRESH_TOKEN_SECRET,
         {
             expiresIn:process.env.REFRESH_TOKEN_EXPIRY
         }
     )
 }

export const User = mongoose.model("User",userSchema);