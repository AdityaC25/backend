import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const {content} = req.body;
    const userId = req.user._id

    if(!userId){
        throw new ApiError(400, "User not found")
    }

    const tweet = await Tweet.create({content: content,  owner: userId});

    if(!tweet){
        throw new ApiError(500, "Something went wrong while creating tweet")
    }

    return res.status(200)
    .json(
        new ApiResponse(
            200,tweet,"Tweet Created!"
        )
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid UserId")
    }

    const tweet = await Tweet.find({owner: userId});

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "User Tweet"
        )
    )

    
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Id")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:content
            }
        },
        { new: true }
    )

    return res.status(200)
    .json(
        new ApiResponse(
            200,updatedTweet,"tweet updated!"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const{tweetId} = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Id")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200)
    .json(
        new ApiResponse(200,{},"Tweet deleted!")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}