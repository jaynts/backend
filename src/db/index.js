import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"


const connectDB= async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MONGO_DB connection is established, DB Host: ${connectionInstance.connection.host}`)
    }
    catch(error){
        console.log("ERROR is", error);
        process.exit(1);
    }
}

export default connectDB