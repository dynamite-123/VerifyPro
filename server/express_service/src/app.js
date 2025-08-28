import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// Enable CORS for client application
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import authRouter from './routes/auth.routes.js'
import uploadRouter from './routes/upload.routes.js'
import otpRouter from './routes/otp.routes.js'

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/upload", uploadRouter)
app.use("/api/v1/otp", otpRouter)

// Global error handler - added for better debugging
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    return res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

export { app }