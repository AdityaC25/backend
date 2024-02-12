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
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById
}
