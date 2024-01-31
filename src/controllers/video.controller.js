import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {Video} from "../models/video.model.js"
import mongoose, {isValidObjectId} from "mongoose"

const getAllVideos = asyncHandler(async (req,res)=>{
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    try {
        let pipeline = [];

        //if userId is provided,add a $match stage to filter videos by owner
        if(userId){
            pipeline.push({
                $match:{ owner: new mongoose.Types.ObjectId(userId) }
            })
        }

        
    // If sortBy and sortType are provided, add a $sort stage to sort the videos

        if(sortBy && sortType){
            const sortOptions ={};
            sortOptions[sortBy] = sortType === "desc" ?-1:1;

            pipeline.push({
                $sort:sortOptions
            })
        
        }

         // Add $skip and $limit stages for pagination

         pipeline.push(
            {
                $skip:(page-1)*parseInt(limit)
            },
            {
                $limit:parseInt(limit)
            }
         )

          // Use $lookup to join with the "users" collection and fetch owner details

          pipeline.push({
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails"
            }
          })

          // Use $unwind to destructure the array created by $lookup

          pipeline.push({
            $unwind: "$ownerDetails",
          });

          pipeline.push({
            $project: {
              videoFile: 1,
              thumbNail: 1,
              title: 1,
              duration: 1,
              views: 1,
              owner: {
                _id: "$ownerDetails._id",
                fullName: "$ownerDetails.fullName",
                avatar: "$ownerDetails.avatar",
              },
            },
          });

          const getVideos = await Video.aggregate(pipeline);

          if (!getVideos || getVideos.length === 0) {
            return res.status(200).json(new ApiResponse(404, [], "No videos found"));
          }

          res.status(200).json(new ApiResponse(200, getVideos, "All videos fetched"));

    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error?.message || "Internal Server error in getting AllVideos!"
        )
    }

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body;
    
    
    if (
        [title,description].some((field)=> field ?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required!")
    }

    const videoLocalFile = req.files?.videoFile[0]?.path;
    const thumbnailLocalFile = req.files?.thumbnail[0].path;

    if(!videoLocalFile){
        throw new ApiError(400,"Video File is required!")
    }

    if(!thumbnailLocalFile){
        throw new ApiError(400,"Video File is required!")
    }

    const videoFile = await uploadOnCloudinary(videoLocalFile);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalFile);

    if(!videoFile){
        throw new ApiError(400,"Video is required!")
    }

    if(!thumbnail){
        throw new ApiError(400,"Thumbnail is required!")
    }

    const video = await Video.create(
        {
            title,
            description,
            videoFile:videoFile.url,
            thumbnail:thumbnail.url,
            duration: videoFile.duration,
            owner: req.user?._id,
            isPublished:true

        }
    )
    
    const createdVideo = await Video.findById(video._id)

    if(!createdVideo){
        throw new ApiError(401,"Something went wrong while adding a video!")
    }

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            createdVideo,
            "Video is published"
        )
    )

   

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id")
    }

    const video = await Video.aggregate([
       {
         $match: {
            _id: new mongoose.Types.ObjectId(videoId)
        },

    },
    {
         $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"ownerDetails",
            pipeline:[
                {
                    $project:{
                        fullname:1,
                        username:1,
                        avatar:1
                    }
                },
               
            ]
        }
    },
    
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"video",
            as:"likes"
        }
    },
    {
        $lookup:{
            from:"comments",
            localField:"_id",
            foreignField:"video",
            as:"comments"
        }
    },
    {
        $addFields:{
           
            likes:{
                 $size:"$likes"
            },
            comments:{
                $size:"$comments"
            },
            views:{
                $add:[1,"$views"]
            }
            
        }
    }
    ])

    if(!video?.length){
        throw new ApiError(404,"Video does not exist!")
      }

      await Video.findByIdAndUpdate(videoId, {
        $set:{
            views: video.views
        }
    });

      return res.status(200).json(new ApiResponse(200, video[0],"Video found"));
    
    

})


export {
    getAllVideos,
    publishAVideo,
    getVideoById

}