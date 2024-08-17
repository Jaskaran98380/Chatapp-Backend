import jwt from "jsonwebtoken"
import { ErrorHandler } from "../utils/utility.js";
import { adminKey } from "../app.js";
import { TOKEN } from "../constants/config.js";
import { User } from "../models/user.js";

const isAuthenticatedUser = (req ,res,next)=>{
    const token = req.cookies[TOKEN];
    // const token = req.cookies.token;
    console.log(req.cookies , "reqcoo");
    console.log("dhindhing");
    if(!token){
        console.log("dish")
        return next(new ErrorHandler("Please login to access this resource" , 400))
    }
    

    const decodedData = jwt.verify(token , process.env.JWT_SECRET)
    console.log(decodedData , "ddata");

    req.user = decodedData._id;
    next();
}

const adminOnly = (req ,res,next)=>{
    const token = req.cookies["admin-token"];
    // const token = req.cookies.token;
    console.log(req.cookies , "reqcoo");
    if(!token){
        return next(new ErrorHandler("Only Admin can access this resource." , 401))
    }
    const secretKey = jwt.verify(token , process.env.JWT_SECRET)

    const isMatched = secretKey === adminKey

    if(!isMatched){
        return next(new ErrorHandler("Only Admin can access this resource." , 401))
    }

    next();
}

const socketAuthenticator = async(err,socket,next)=>{
   try {
    if(err){
        return next(new ErrorHandler("Please login to access this resource." , 401));
    }
    const authToken =  socket.request.cookies[TOKEN]
    if(!authToken){
        return next(new ErrorHandler("Please login to access this resource." , 401));
    }
    const decodedData = jwt.verify(authToken , process.env.JWT_SECRET)
    const user = await User.findById(decodedData._id);
    if(!user){
        return next(new ErrorHandler("Please login to access this resource." , 401));
    }
    socket.user = user;
    return next()
   } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Please login to access this resource." , 401));
   }
   
}

export {isAuthenticatedUser , adminOnly , socketAuthenticator}