import mongoose from 'mongoose'

const connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("db connected ! ");
        
    } catch (error) {
        console.log("Error in db connection : ", error.message);
        
    }
}


export default connectDB

