import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"

const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        //file has been uploaded successfully
        console.log("file is successfully uploaded", response.url);
        return response;
    }
    catch(error){
        //read from fs docs
        fs.unlinkSync(localFilePath); //removes the locally saved temporary file as upload failed
        return null;
    }
}

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export {uploadOnCloudinary}