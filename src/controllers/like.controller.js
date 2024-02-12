import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id!")
    }

    const likedVideo = await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })

    if(likedVideo){
        await Like.findByIdAndDelete(likedVideo?._id)

        return res.status(200)
        .json(new ApiResponse(200,  {}, "Video unliked successfully!"))
    }

    const videoLiked = await Like.create({
        video:videoId,
        likedBy:req.user?._id
    })

    return res.status(200)
    .json(
        new ApiResponse(200,videoLiked,"Video Liked Successfully!")
    )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
   
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment Id!")
    }

    const likedComment = await Like.findOne({
        Comment:commentId,
        likedBY:req.user?._id
    })


    if(likedComment){
        await Like.findByIdAndDelete(likedComment?._id)

        return res.status(200)
        .json(new ApiResponse(200,  {}, "comment unliked successfully!"))
    }

    const commentLiked = await Like.create({
        Comment:commentId,
        likedBy:req.user?._id
    })

    return res.status(200)
    .json(
        new ApiResponse(200,commentLiked,"comment Liked Successfully!")
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet Id")
    }

    const likedTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if(likedTweet){
        await Like.findByIdAndDelete(likedTweet?._id)

        return res.status(200)
        .json(new ApiResponse(200, "tweet unliked successfully", {}))
    }

    const tweetLiked = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    return res.status(200)
    .json(new ApiResponse(200, "tweet liked successfully", tweetLiked))
})


const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find({likedBy: req.user._id}).populate('video')
    if(!likedVideos){
        throw new ApiError(404, "No liked videos found")
    }
     res.status(200).json(new ApiResponse(200,  likedVideos,"Liked videos"))
})



export {
    toggleVideoLike,
    toggleCommentLike ,
    toggleTweetLike,
    getLikedVideos

}