import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import dotenv from 'dotenv';
dotenv.config();

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true, 
        index : true,
    },
    avatar :{
        type: String,
        required: true,
    },
    coverImage :{
        type: String,
        // required: true,
    },
    watchHistory :[{
        type: Schema.Types.ObjectId,
        ref : "Video",
    }],
    password : {
        type : String, 
        required : [true, "Please provide a password"],
    }, 
    refreshToken : {
        type : String,
    },




}, {timestamps: true});

userSchema.methods.isPassworCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}



userSchema.pre("save", async function(next){
    if (!this.isModified("password")) {
     return  next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.generateAccessToken = async function(){
    jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,

    }
    ,process.env.ACCESS_TOKEN_SECRET 
    ,{
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
    
    )
}
userSchema.methods.generateRefreshToken = async function(){
    jwt.sign({
        _id : this._id
    }
    ,process.env.REFRESH_TOKEN_SECRET 
    ,{
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
    
    )

}

export const User = mongoose.model("User", userSchema);
