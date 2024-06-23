import mongoose from "mongoose"; 
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    // console.log(process.env.MONGODB_URI);
    try{ 
      const connectionInstance =   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      console.log(`Connected to the database: ${connectionInstance.connection.host}`);
    }
    catch(err){
   console.log("error connecting to the database", err)
   process.exit(1); 
 
    } 
};

export default connectDB;