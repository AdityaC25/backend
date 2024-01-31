import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


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


const loginUser = asyncHandler(async (req,res)=>{
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
        $unset:{
            refreshToken:1
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

const refreshAccessToken = asyncHandler(async (req,res) =>{
        const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken;

        if(!incomingRefreshToken){
            throw new ApiError(401,"Unauthorized Access!");
        }

      try {
        const decodedToken =  jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);
  
        const user = await User.findById(decodedToken?._id);
  
        if(!user){
          throw new ApiError(401,"Invalid Refresh Token!");
      }
  
      if(incomingRefreshToken !== user?.refreshToken){
          throw new ApiError(401,"Refresh Token Expired!")
      }
  
      const options = {
          httpOnly:true,
          secure:true
      }
    const {accessToken,newRefreshToken} = await generateRefreshAndAccessToken(user._id);
  
     return res.
     status(200).
     cookie("accessToken",accessToken,options).
     cookie("refreshToken",newRefreshToken,options).
     json(
      new ApiResponse(
          200,
          {accessToken,newRefreshToken},
          "Access Token Refreshed Successfully!"
      )
     )
      } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token!")
      }
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Password!")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false})

    return res.status(200).
    json(
        new ApiResponse(200,{},"Password Changed Successfully!")
    )
})

const getCurrentUser = asyncHandler(async (req,res) =>{
        return res.status(200).
        json(
            new ApiResponse(
            200,
            req.user,
            "Current User Fetched Succesfully!"
            )
        )
})

const UpdateAccountDetail = asyncHandler(async (req,res) =>{
    const {email , fullname} = req.body;

     if(!(email || fullname)){
        throw new ApiError(400,"All Fields are Required!")
     }
    const user = await User.findByIdAndUpdate( 
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new:true}
        
    ).select("-password")

    res.status(200).
    json(
        new ApiResponse(
            200,
            user,
            "Account Updated Successfully!"
        )
    ) 
})

const updateUserAvatar = asyncHandler(async (req,res) =>{
    const avatarLocalFile = req.file?.path;
    
  

    if(!avatarLocalFile){
        throw new ApiError(400,"Avatar Required!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalFile);
//    console.log(avatar);
   
    

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading Avatar!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{avatar :avatar.url}
        },
        {new:true}
    ).select("-password")
    
    return res.
    status(200).
    json(
       new ApiResponse(
           200,
           user,
           "Avatar Updated Successfully!"
       )
    )
})

const updateUserCoverImage = asyncHandler(async (req,res) =>{
    const coverImageLocalFile = req.file?.path;

    if(!coverImageLocalFile){
        throw new ApiError(400,"coverImage Required!");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalFile);
    
    

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading coverImage!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{coverImage :coverImage.url}
        },
        {new:true}
    ).select("-password")
    
     return res.status(200).
     json(
        new ApiResponse(
            200,
            user,
            "CoverImage Updated Successfully!"
        )
     )
})

const getUserChannelProfile = asyncHandler(async (req,res) =>{
      const {username} = req.params;

      if(!username?.trim()){
        throw new ApiError(400,"Username is missing!");
      }

      const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
                
            }
        }
      ])

      if(!channel?.length){
        throw new ApiError(404,"Channel does not exist!")
      }

      return res.status(200).
      json(
        new ApiResponse(200,channel[0],"User channel fetched successfully!")
      )
})

const getWatchHistory = asyncHandler(async (req,res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first : "$owner"
                            }
                        }
                    }
                ]

            }
        }
    ])

    return res.status(200)
    . json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch History fetched successfully"
        )
    )
   
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    UpdateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}