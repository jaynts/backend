import { asyncHandler } from "../utils/aysncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser= asyncHandler(async(req,res)=>{
   //get user details
   //validation-not empty
   //check if user exits:username, email
   //check for images, check for avatar
   //upload them to cloudinary
   //create user object-entry in db
   // remove password and refresh token field from response
   //remove password and refresh token field from response as we dont want to send password
   //check for user creation
   //return res
   const {fullName,email,username,password}=req.body;
   console.log("email: ",email);
   if(
    [fullName,email,username,password].some((field)=>field?.trim()==="")//checks multiple ifs using some, could have checked for all manually
   ){
    throw new ApiError(400,"All fields are required");
   }

   const existedUser=User.findOne({
    $or:[{username},{email}]//we check if those exist or not
   })
   if(existedUser){
    throw new ApiError(409,"User already exists")
   }

   const avatarLocalPath= req.files?.avatar[0]?.path;
   const coverImageLocalPath=req.files?.coverImage[0]?.path;

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar not uploafed");
   }
   const avatar=await uploadOnCloudinary(avatarLocalPath);
   const coverImage=await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
    throw new ApiError(400,"Avatar not uploaded");
   }
   const user = User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
   })
   
   const createdUser= await User.findById(user._id).select(
    "-password -refreshToken"//this is weird syntax to check what all we dont want
   )
   if(!createdUser){
      throw new ApiError(500,"Something went wrong while registering the user")
   }

   return res.status(201).json(
      new ApiResponse(200,createdUser,"user registered successfully")
   )
})

export {registerUser}