import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    const playlists = await Playlist.create({name,description,owner:req.user?._id})

    if(!playlists){
        throw new ApiError(500, "Something went wrong while creating playlist")
    }

    return res.status(200).json(new ApiResponse(200, playlists, "Playlist created"))
    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user Id!")
    }

    const playlists = await Playlist.find({owner : userId})
    if (!playlists) {
        throw new ApiError(400 , "playlist not found")
    }

    return res.status(200).json(new ApiResponse(200,playlists,"userPlayLists Fetched"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist Id!")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400 , "Playlist not found")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist Fetched Successfully!")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist Id!")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id!")
    }

    const videoToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{videos:videoId}
        },
        {
            new:true
        }
    ).populate('videos')


    if(!videoToPlaylist){
        throw new ApiError(400 , "Something went wrong while adding video to playlist")
    }

    return res.status(200)
    .json(
        new ApiResponse(
            200,videoToPlaylist,"Video added to Playlist!"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
      
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist Id!")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id!")
    }

    const removedVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{videos:videoId}
        },
        {
            new:true
        }
    
    ).populate('videos');

    if(!removedVideo){
        throw new ApiError(400 , "Something went wrong while deleting video to playlist")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,removedVideo,"Video Removed From PlayList!")
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist Id!")
    } 

    const deletedPlaylist = await Playlist.findByIdAndDelete(
        playlistId
    )

    if(!deletedPlaylist){
        throw new ApiError(400 , "Something went wrong while deleting a playlist")
    }
    return res.status(200).json(new ApiResponse(200, "Playlist deleted"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist Id!")
    } 

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {name, description}
        },
        {
            new: true
        }
    )
    if (!updatePlaylist) {
        throw new ApiError(400 , "Something went wrong while updating playlist")
    }
    return res.status(200).json(new ApiResponse(200,  updatedPlaylist, "Playlist updated"))

})







export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
