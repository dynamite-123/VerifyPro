import dotenv from "dotenv"
// Load environment variables first, before importing other modules
dotenv.config({
    path: './.env'
})

import connectDB from "./db/dbConnect.js";
import {app} from './app.js'

// Debug environment variables
console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN)
console.log("PORT:", process.env.PORT)

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})