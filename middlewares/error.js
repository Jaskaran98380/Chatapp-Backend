import { envMode } from "../app.js";

const errorMiddleware = (err , req , res , next)=>{
    err.message ||=  "Internal server error";
    err.statusCode ||=  500;

    if(err.code === 11000){
        const error = Object.keys(err.keyPattern).join(",");
        console.log(error)
        err.message = `Duplicate Field - ${error}`;
        err.statusCode = 400;
    }

    if(err.name=== "CastError"){
        err.message = `Invalid format of ${err.path}`,
        err.statusCode = 400
    }

    const response = {
        success: false,
        message: err.message,
        stack:err.stack
      };
    
      if (envMode === "DEVELOPMENT") {
        response.error = err;
      }
    
      return res.status(err.statusCode).json(response);

//     return res.status(err.statusCode).json({
//         success:false,
//         message:envMode === "DEVELOPMENT" ? err : err.message,
//         stack:err.stack
// })
}

const TryCatch = (passedFunction)=> async(req,res,next)=>{
    try {
        await passedFunction(req,res,next)
    } catch (error) {
        next(error)
    }
}

export {errorMiddleware , TryCatch}