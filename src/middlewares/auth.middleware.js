import { asyncHandler } from "../utils/asyncHandler";
import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token){
            throw new ApiError(401, "Unauthorized");
        }
       const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
       const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    
       if(!user){
           throw new ApiError(401, "invalid access token");
       }
       req.user = user;  // adding new user property to request object
       next();
    } catch (error) {
        throw new ApiError(401, error?.message  || "invalid access token");
    }
});
