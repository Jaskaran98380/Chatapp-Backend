import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { v4 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";


const cookieOptions = {
    maxAge : 15 * 24 * 60 * 60 * 1000,
    sameSite:"none",
    httpOnly:true,
    secure:true
}

const connectDb = (uri)=>{
    mongoose.connect(uri , {dbName:"ChatApp"}).then((data)=>{
        console.log(`Mongodb connected on ${data.connection.host}`)
    }).catch((error)=>{
        throw error
    })
}

const sendToken = (res , user , code , message)=>{
    const token = jwt.sign({_id:user._id} , process.env.JWT_SECRET)

    return res.status(code).cookie("token" , token , cookieOptions).json({
        success:true,
        token,
        user,
        message
    })
}

const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
  };

  const uploadFilesToCloudinary = async (files = []) => {
 
    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
         cloudinary.uploader.upload(
          getBase64(file),
          {
            resource_type: "auto",
            public_id: uuid(),
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
      });
    });
    console.log(uploadPromises,"up")
    try {
      const results = await Promise.all(uploadPromises);
      console.log(results,"results")
  
      const formattedResults = results.map((result) => ({
        public_id: result.public_id,
        url: result.secure_url,
      }));
      return formattedResults;
    } catch (err) {
      throw new Error("Error uploading files to cloudinary", err);
    }
  };


// const uploadFilesToCloudinary = async (file) => {
//     try {
//       const result = await cloudinary.uploader.upload(getBase64(file), {
//         resource_type: 'auto', // Specify the resource type
//         public_id: uuid(), // Optional: Set a custom public ID
//      // Optional: Transformations
//       });
  
//       console.log('Upload Result:', result);
//       return result;
//     } catch (error) {
//       console.error('Error uploading to Cloudinary:', error);
//       throw new Error('Image upload failed');
//     }
//   };

  const deleteFilesFromCloudinary = (publicIds)=>{
    console.log("yo");
  }

export {connectDb , sendToken , cookieOptions , emitEvent , deleteFilesFromCloudinary , uploadFilesToCloudinary}