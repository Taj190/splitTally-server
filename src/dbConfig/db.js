import mongoose from 'mongoose';

const ConnectDb = async()=>{
    try {
         const conn =  await mongoose.connect(process.env.MONGO_URL)   
      console.log('database connected')
    } catch (error) {
        
         console.error('Error connecting to the database:', error);
    }
}

export default ConnectDb;