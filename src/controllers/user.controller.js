import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";


const generateRefreshAndAccessToken = async (userId) => {
     try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave :false});

        return {refreshToken,accessToken}
     } catch (error) {
        throw new ApiError(500 , "Something went wrong while generating access and refersh token!")
     } 
}

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


    const {username,email,fullname,password} = req.body;
    // console.log(req.body);
    // console.log(email);

    // if(userName === ""){
    //     throw new ApiError(400,"userName is required!");         we can check for other field one by one using if but we do it in a single code
    // }

    if (
        [fullname,username,email,password].some((field)=> field ?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required!")
    }

    const existedUser = await User.findOne({
         $or :[{ username },{ email }]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or userName is already exist!")
    }

    const avatarLocalFile = req.files?.avatar[0]?.path;

    const coverImageLocalFile = req.files?.coverImage?.[0].path;

    // let coverImageLocalFile;
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    //     coverImageLocalFile =  req.files.coverImage[0].path;
    // }
    // console.log(req.files);
  
    
    if(!avatarLocalFile){
        throw new ApiError(400,"Avatar file is required!");
    }

   const avatar =   await uploadOnCloudinary(avatarLocalFile);
   const coverImage  =  await uploadOnCloudinary(coverImageLocalFile);

   if(!avatar){
    throw new ApiError(400,"avatar file is required!")
   }

   const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
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


const loginUser = asyncHandler(async ()=>{
    //get data from user
    //username or email
    //check if user send empty details or not
    //check if user exists or not
    //if login we check for password
    //generate access or refresh token
    //send the tokens(in cookies)
    //send response

    const {email,username,password} = req.body;

    if(!(username || email)){
        throw new ApiError(400,"Username or email is Required!")
    }

    const user =await User.findOne({
            $or:[{email},{username}]
    })

    if(!user){
        throw new ApiError(404 ,"User does not exists!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    
    if(!isPasswordValid){
        throw new ApiError(404 ,"Invalid User Credentials! ")
    }

    const {accessToken,refreshToken} = await generateRefreshAndAccessToken(user._id)

    const loggedInUser = await User.findById(user._id).select(" -password -refreshToken")

    const options = {
        httpOnly :true,
        secure : true
    }

    return res.
    status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options).
    json(
       new ApiResponse(200,
        {
            loggedInUser,refreshToken,accessToken
        },"User logged In successfully!"
        )
    )
})


const logoutUser = asyncHandler( async(req,res)=>{
   User.findByIdAndUpdate(
    req.user._id,
    {
        $set:{
            refreshToken:undefined
        }
    },
    {
        new:true
    }
   )

   const options = {
    httpOnly :true,
    secure : true
}

 res.status(200).
 clearCookie("accessToken",options).
 clearCookie("refreshToken",options).
 json(
    new ApiResponse(200,{},"User Logout Successfully!")
 )
})

export {
    registerUser,
    loginUser,
    logoutUser
}