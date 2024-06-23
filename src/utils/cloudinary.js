import {v2 as cloudinary} from 'cloudinary';
import fs from "fs" ; 
import dotenv from 'dotenv';
dotenv.config();
cloudinary.config({ 
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME , 
    api_key : process.env.CLOUDINARY_API_KEY , 
    api_secret : process.env.CLOUDINARY_API_SECRET  // Click 'View Credentials' below to copy your API secret
});
const uploadOnCloudinary = async(filepath)=>{
    try{

        if (!filepath) return null; 
        //upload
        const response = await cloudinary.uploader.upload(filepath,{
            resource_type: "auto",
        })
        //file uloaded
        // console.log("file is uploaded on cloudinary",response.url);
        fs.unlinkSync(filepath); // remove the local saved temp file as the upload operation got successful
        return response;
    }
    catch(err){
        fs.unlinkSync(filepath); 
        // console.log(err)// remove the local saved temp file as the upload operation got failed
        return null;

    }

}
export {uploadOnCloudinary};