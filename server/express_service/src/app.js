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

// Explicitly handle preflight requests for all routes using a regex
// to avoid passing a lone '*' string into the path parser (path-to-regexp).
app.options(/.*/, cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase body parser limits to accommodate base64-encoded images sent as JSON
// Note: keep this as small as reasonable for your app; 10mb should cover typical
// OTP image photos while limiting abuse. Consider per-route limits for tighter control.
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(express.static("public"))
app.use(cookieParser())

let authRouter, uploadRouter, signatureRouter, otpRouter, kycRouter;
try {
    authRouter = (await import('./routes/auth.routes.js')).default;
    console.log('Imported auth.routes OK');
} catch (err) {
    console.error('Failed to import auth.routes', err && err.message);
    throw err;
}

try {
    uploadRouter = (await import('./routes/upload.routes.js')).default;
    console.log('Imported upload.routes OK');
} catch (err) {
    console.error('Failed to import upload.routes', err && err.message);
    throw err;
}

try {
    otpRouter = (await import('./routes/otp.routes.js')).default;
    console.log('Imported otp.routes OK');
} catch (err) {
    console.error('Failed to import otp.routes', err && err.message);
    throw err;
}

try {
    signatureRouter = (await import('./routes/signature.routes.js')).default;
    console.log('Imported signature.routes OK');
} catch (err) {
    console.error('Failed to import signature.routes', err && err.message);
    throw err;
}

try {
    kycRouter = (await import('./routes/kyc.routes.js')).default;
    console.log('Imported kyc.routes OK');
} catch (err) {
    console.error('Failed to import kyc.routes', err && err.message);
    throw err;
}

// Debug: validate routers and isolate path-to-regexp issues
const routeRegistrations = [
    { path: '/api/v1/auth', router: authRouter },
    { path: '/api/v1/upload', router: uploadRouter },
    { path: '/api/v1/otp', router: otpRouter },
    { path: '/api/v1/signature', router: signatureRouter },
    { path: '/api/v1/kyc', router: kycRouter },
]

for (const reg of routeRegistrations) {
    try {
        console.log(`Registering route`, reg.path, 'routerType=', typeof reg.router);
        app.use(reg.path, reg.router);
    } catch (err) {
        console.error('Failed registering route', reg.path, 'error=', err && err.message);
        // rethrow so nodemon shows the original stack
        throw err;
    }
}

// Health check endpoint
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));


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