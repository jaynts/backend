import { asyncHandler } from "../utils/aysncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken=async(userId)=>{
   try {
      const user=await User.findById(userId)
      const accessToken=user.generateAccessToken()
      const refreshToken=user.generateRefreshToken()

      user.refreshToken=refreshToken;
      await user.save({validateBeforeSave:false});
      return {accessToken, refreshToken};

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating access and refesh token")
   }
}

const registerUser = asyncHandler(async (req, res) => {
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
   const { fullName, email, username, password } = req.body;
   console.log("email: ", email);
   if (
      [fullName, email, username, password].some((field) => field?.trim() === "")//checks multiple ifs using some, could have checked for all manually
   ) {
      throw new ApiError(400, "All fields are required");
   }

   const existedUser = await User.findOne({
      $or: [{ username }, { email }]//we check if those exist or not
   })
   if (existedUser) {
      throw new ApiError(409, "User already exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;//this can lead to errors, it is a js issue

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar not uploafed");
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
      throw new ApiError(400, "Avatar not uploaded");
   }
   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"//this is weird syntax to check what all we dont want
   )
   if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user")
   }

   return res.status(201).json(
      new ApiResponse(200, createdUser, "user registered successfully")
   )
})

const loginUser=asyncHandler(async(req,res)=>{
   //req body->data
   //username or email
   //find the user
   //passowrd check
   //access and refresh token 
   //send cookie

   const {email, username,password}=req.body;
   if(!username && !email){
      throw new ApiError(400,"username or password is required")
   }

   const user=await User.findOne({
      $or:[{username}, {email}]
   })
   if(!user){
      throw new ApiError(400,"user doesnt exist")
   }
   const isPasswordValid = await user.isPasswordCorrect(password)
   if(!isPasswordValid){
      throw new ApiError(404,"Password incorrect")
   }

   //now we generate tokens from above
   const {accessToken, refreshToken}= await generateAccessAndRefreshToken(user._id);

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
   //options for cookies
   const options={
      httpOnly:true,
      secure:true
   }
   return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(200,{
         user:loggedInUser,accessToken,refreshToken
      },"user logged in successfully")
   )
   
})

const logoutUser=asyncHandler(async(req,res)=>{
   //middleware will be used here so that we can logout without info as we dont have it here
   //with verifyjwt from route, we have access to id by user routes so that we can access our user

   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken: undefined// this removes the field from document
        }
      },
      {
         new:true
      }
   )
   const options={
      httpOnly:true,
      secure:true
   }
   return res.status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(
      new ApiResponse(
         200,{},"user logged out successfully!"
      )
   )

})

const refreshAccessToken= asyncHandler(async(req,res)=>{
   //access refresh token through cookies
   const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
      throw new ApiError(401,"unauthorised request")

   }
   try {
      const decodedToken= await jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      )
      const user= await User.findById(decodedToken?._id)
      if(!user){
         throw new ApiError(401,"Invalid refresh token")
      }
      //now we will match the tokens
      if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh token is expired or used")
      }
      const options={
         httpOnly:true,
         secure:true
      }
      const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
      return res.status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newRefreshToken,options)
      .json(
         new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed successfully"
         )
      )
   } catch (error) {
      throw new ApiError(401, error?.message ||"Invalid refreshToken")
   }

})

export { registerUser, loginUser, logoutUser,refreshAccessToken }