import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// Ensure dotenv is configured before using environment variables
dotenv.config({
    path: "./.env"
});

// Debugging: print the entire process.env to check loaded environment variables
// console.log(process.env);  

// Print specific environment variable
// console.log(process.env.MONGODB_URI); 

connectDB().then(
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    }
)).catch((err)=>console.log(err));
