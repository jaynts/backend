import dotenv from "dotenv" // or another way to do this could have been seen from their documentation which was require('dotenv').config({path :})
import connectDB from "./db/index.js"



dotenv.config({
    path : "./env"
})


connectDB();