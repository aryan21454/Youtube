import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async(userId) =>
{
   try{
    const user = await User.findById(userId);

   }
   catch(error)
   {
      throw new ApiError(500, "something went wrong while generating tokens");
   }
   const accessToken = user.generateAccessToken();
   const refreshToken = user.generateRefreshToken();

   user.refreshToken = refreshToken;
   await user.save({validateBeforeSave : false});
   return {accessToken, refreshToken};
};


export const registerUser = asyncHandler(
   async (req, res, next) => {
   // get user details from frontend
   // validation - not empty
   // check if user exists
   //check for images , check for avatar 
   // upload to cloudnary 
   // user object create 
   // remove password and refresh toen from field 
   // check for user creation
   // return response 
   const {fullName , email, username , password}= req.body 
   console.log(fullName , email, username , password);
   // for beginers
   // if (fullName ==="")
   //    {
   //       throw new ApiError(400, "Fullname is required");    
   //    } 
   if (
      [fullName, email, username, password].some((field)=>field?.trim() === "")
   )
   {
      throw new ApiError(400, "All fields are required");    
   }
    // to check more than one field like email and username
   const existedUser = await User.findOne({
      $or :[{ email },{ username }]
   })
   if (existedUser)
   {
      throw new ApiError(409, "User already exists");    
   }
   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path;
   console.log(req.files);
   if (!avatarLocalPath)
   {
      throw new ApiError(400, "Avatar is required");    
   }
   console.log(avatarLocalPath);
   const avatar = await uploadOnCloudinary(avatarLocalPath); 
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
//   console.log(avatar);
   if (!avatar)
      {
         throw new ApiError(500, "Avatar upload failed");
      }
 const user =  await User.create(
      {
         fullName, 
         avatar : avatar.url,
         coverImage : coverImage?.url || "",
         email,
         password, 
         username : username.toLowerCase()
      }
   ); 
 const createdUser =  await User.findById(user._id).select(
      "-password -refreshToken"
 );
 if (!createdUser)
 {
    throw new ApiError(500, "something went wrong while user registeration");
 }

 return res.status(201).json(
      new ApiResponse(201, "User registered successfully", createdUser)
 );

});


export const loginUser = asyncHandler(
   async(req,res,next)=>{
      const {email,username, password} = req.body;
      if (!email && !username)
      {
         throw new ApiError(400, "Email or username is required");
      }
      const user = await User.findOne({
         $or: [{ email },{ username}]
     });
     if (!user)
     {
        throw new ApiError(404, "User not found");
     }
     //check password
     const isPasswordCorrect = await user.isPassworCorrect(password);
     if (!isPasswordCorrect)
     {
        throw new ApiError(401, "Password is incorrect");
     }
    const {accessToken , refreshToken} =  await generateAccessandRefreshToken(user._id);
    
     const loggedInUser = User.findById(user._id).select("-password -refreshToken");

     const options = {
      httpOnly :true,
      secure : true
     }
     return res.status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(new ApiResponse(200,"user login successfully",{
      user : loggedInUser,
      accessToken,
      refreshToken
     }))    
   }
);

export const logoutUser = asyncHandler(async(req,res,next)=>{
  await User.findByIdAndUpdate(req.user._id, {
      $set : {refreshToken : undefined}
   },{
      new : true
   });


   const options = {
      httpOnly :true,
      secure : true
     }

   return res.status(200).
   clearCookie("accessToken",options).
   clearCookie("refreshToken",options).
   json(new ApiResponse(200,"User logged out successfully"));
   

});

export const refreshAccessToken = asyncHandler(async(req,res,next)=>{

   const incomingRefreshToken  = req.cookies.refreshToken || req.body?.refreshToken

   if (!incomingRefreshToken)
   {
      throw new ApiError(401, "Unauthorized request");
   }
   try {
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = User.findById(decodedToken._id);
   
      if (!user)
      {
         throw new ApiError(401, "invalid refresh token");
      }
      if (incomingRefreshToken !== user?.refreshToken)
         {
            throw new ApiError(401, "invalid refresh token");
         }
      const {accessToken , newrefreshToken} =  await generateAccessandRefreshToken(user._id);
      const options = {
         httpOnly :true,
         secure : true
        }
      
      return res.status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newrefreshToken,options)
      .json(new ApiResponse(200,"user login successfully",{
         accessToken,
         newrefreshToken : refreshToken
      }))
   } catch (error) {
      throw new ApiError(401,error?.message ||  "invalid refresh token");
      
   }

   



});

export const changeCurrentPassword = asyncHandler(async(req,res,next)=>{
   const {oldPassword , newPassword} = req.body;
   if (!oldPassword || !newPassword)
   {
      throw new ApiError(400, "All fields are required");
   }
   const id = req.user?.id ; 
   const user = await User.findById(id);
   if (!user)
   {
      throw new ApiError(404, "User not found");
   }
   const isPasswordCorrect = await user.isPassworCorrect(oldPassword);
   if (!isPasswordCorrect)
   {
      throw new ApiError(401, "Password is incorrect");
   }
   user.password = newPassword; 
   await user.save({validateBeforeSave : false});
   return res.status(200).json(new ApiResponse(200, "Password changed successfully", {}));
});

export const getCurrentUser = asyncHandler(async(req,res,next)=>{
   return res.status(200).json(new ApiResponse(200, "User found", req.user));
});

export const updateAccountDetails = asyncHandler(async(req,res,next)=>{
   const {fullName , email} = req.body;
   if (!fullName || !email)
   {
      throw new ApiError(400, "All fields are required");
   }
   User.findByIdAndUpdate(req.user?.id, {$set:{fullName,email}}, {new : true}).select("-password -refreshToken");

   return res.status(200).json(new ApiResponse(200, "User updated successfully", user));
});

export const updateUserAvatar = asyncHandler(async(req,res,next)=>{
   const avatarLocalPath = req.file?.path;
   
});


// export default {registerUser};