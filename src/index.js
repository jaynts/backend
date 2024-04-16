import dotenv from "dotenv" // or another way to do this could have been seen from their documentation which was require('dotenv').config({path :})
import connectDB from "./db/index.js"
import {app} from "./app.js"


dotenv.config({
    path : "./env"
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed. ", err);
})