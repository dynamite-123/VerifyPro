import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`, {
            // Add connection options if needed
        });
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        console.log(`DB NAME: ${connectionInstance.connection.name}`);
        return connectionInstance;
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        console.error("Details:", JSON.stringify(error, null, 2));
        process.exit(1);
    }
}

export default connectDB;