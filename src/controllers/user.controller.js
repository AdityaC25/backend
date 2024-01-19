import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req,res) =>{
    //get user detail from frontend/ if there is no frontend then we use postman
    //validation of users details(if user send empty username etc)
    //check if user already has account or not(username,email)
    //check for images , check for avatar as in our usermodel we make avatar required.
    //upload them in a cloudinary and take url form cloudinary
    //create user object to store in a database as we use mongodb(nosql) so we create object
    //check for user creation(if user is created or we get null as a response)
    //if user is created we will response
    //we remove password,refresh token form the responde as we do not want to send such details to users


    const {userName,email,fullname,password} = req.body;
    console.log(email);

    // if(userName === ""){
    //     throw new ApiError(400,"userName is required!");         we can check for other field one by one using if but we do it in a single code
    // }

    if (
        [fullname,userName,email,password].some((field)=> field ?.trim() === "")
    ) {
        throw new ApiError(400 , "All fields is required!")
    }

    const existedUser = User.findOne({
         $or :[{ userName },{ email }]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or userName is already exist!")
    }

    const avatarLocalFile = req.files?.avatar[0]?.path;
    const coverImageLocalFile = req.files?.coverImage[0]?.path;
    
    if(!avatarLocalFile){
        throw new ApiError(400,"Avatar file is required!");
    }

   const avatar =  await uploadOnCloudinary(avatarLocalFile);
   const coverImage  = await uploadOnCloudinary(coverImageLocalFile);

   if(avatar){
    throw new ApiError(400,"Avatar file is required!");
   }

   const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    userName:userName.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering a user!")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User Registered Successfully!")
   )
})

export {registerUser};