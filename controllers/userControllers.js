import bcrypt from "bcrypt";
import { User } from "../models/user.js";
import { cookieOptions, emitEvent, sendToken, uploadFilesToCloudinary } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import {Request} from "../models/request.js"
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { otherPerson } from "../lib/helper.js";

const registerUser = TryCatch(
    async(req,res , next)=>{
       
        const file = req.file;
        console.log(file , "file");
        if(!file){
          return next(new ErrorHandler("Please Upload Avatar" , 400))
        }

        const result = await uploadFilesToCloudinary([file]);
        console.log(result, "result")
        const avatar = {
          public_id: result[0].public_id,
          url: result[0].url,
        };
        console.log(avatar, "avatar")
        
            const {name , username , password , bio} = req.body;

        

            const user = await User.create({name , username , password , avatar , bio});
        
            // res.status(201).json({
            //     success:true
            // })
        
            sendToken(res , user , 201 , "User Created Successfully")
        }
)

const loginUser = TryCatch(
    async(req,res,next)=>{

        const {username , password} = req.body;
    
        const user = await User.findOne({username}).select("+password");
        if(!user){
            // return res.status(404).json({
            //     success:false,
            //     message:"Invalid Username"
            // })
    
            // return next(new Error("Invalid Username"));
    
            return next(new ErrorHandler("Invalid Username or Password" , 404));
        }
    
        const isMatch = await bcrypt.compare(password , user.password);
        console.log(isMatch);
    
        if(!isMatch){
            // return res.status(404).json({
            //     success:false,
            //     message:"Invalid Password"
            // })
    
            // return next(new Error("Invalid Password"));
    
            return next(new ErrorHandler("Invalid Username or Password" , 404));
        }
         
        sendToken(res , user , 200 , "Logged in successfully")
    
        
    }
)

const getMyProfile = TryCatch(
    async(req,res,next)=>{
        const user = await User.findById(req.user)
    
        res.status(200).json({
            success:true,
            user
        })
    }
) 


const logoutUser = TryCatch(
    async(req,res,next)=>{
    
        res.status(200).cookie("token" , "" , {...cookieOptions , maxAge:0}).json({
            success:true,
            message:"Logged out successfully."
        })
    }
) 


const searchUser = TryCatch(async (req, res) => {
    const { name = "" } = req.query;
  
    // Finding All my chats
    const myChats = await Chat.find({ groupChat: false, members: req.user });
  console.log(myChats,"mc")
    //  extracting All Users from my chats means friends or people I have chatted with
    const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);
    console.log(allUsersFromMyChats,"aufmc")
  
    // Finding all users except me and my friends
    const allUsersExceptMeAndFriends = await User.find({
      _id: { $nin: allUsersFromMyChats },
      name: { $regex: name, $options: "i" },
    });
    console.log(allUsersExceptMeAndFriends,"auemamf")
  
    // Modifying the response
    const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar.url,
    }));
  
    return res.status(200).json({
      success: true,
      users,
    });
  });

  const sendFriendRequest = TryCatch(
    async(req,res,next)=>{
      const {userId} = req.body;

      const request = await Request.findOne({
        $or : [
            {sender:req.user , receiver:userId},
            {sender:userId , receiver:req.user}
        ]
      })
      if(request){
        return next(new ErrorHandler("Request already sent." , 400))
      }
      console.log(request,"request")

      await Request.create({
        sender:req.user,
        receiver:userId,
      })
      emitEvent(req , NEW_REQUEST , [userId]);

      res.status(200).json({
        success:true,
        message:"Request sent successfully."
      })
    }
) 

const getMyNotifications = TryCatch(
    async(req,res,next)=>{
        
      const requests = await Request.find({
            receiver:req.user
      }).populate("sender" , "name avatar");


    const allRequests = requests.map(({_id , sender})=>({
        _id,
        sender:{
            _id:sender._id,
            name:sender.name,
            avatar:sender.avatar.url
        } 
    }))


      res.status(200).json({
        success:true,
        allRequests
      })
    }
) 

const acceptRequest = TryCatch(
    async(req,res,next)=>{
        const {requestId , accept} = req.body;

        const request = await Request.findById(requestId).populate("sender" , "name").populate("receiver" , "name");

        if(!request){
            return next(new ErrorHandler("Request not found." , 400))
        }

        if(request.receiver._id.toString() !== req.user.toString()){
            return next(new ErrorHandler("You are not authorised to accept or reject this request."))
        }

        if(!accept){
            await request.deleteOne();
            res.status(200).json({
                success:true,
                message:"Friend Request Rejected."
            })
        }
        else{
            const members = [request.sender._id , request.receiver._id];

            await Promise.all([
                Chat.create({members , name:`${request.sender.name}`}),
                request.deleteOne()
            ])
            emitEvent(req, REFETCH_CHATS, members);
            res.status(200).json({
                success:true,
                message:"Friend Request Accepted",
                senderId:request.sender._id
            })
        }
   
    }
) 

// const getMyFriends= TryCatch(
//     async(req,res,next)=>{
//      const {chatId} = req.query;

//      const chats = await Chat.find({members:req.user , groupChat:false}).populate("members" , "name avatar")
//      console.log(chats, "Chats")
//      const friends = chats.map(({members})=>{
//         const otherMember = otherPerson(members , req.user)
//         console.log(otherPerson, "op")
//         return{
//             _id:otherMember._id,
//             name:otherMember.name,
//             avatar:otherMember.avatar
//         }

//      })
//      if(chatId){
//         const chat = await Chat.findById(chatId);
//         if(!chat){
//             return next(new ErrorHandler("Chat does not exist" ,400))
//         }
//         const availableFriends = friends.filter((friend)=>!chat.members.includes(friend._id))
//     return res.status(200).json({
//         success:true,
//         friends:availableFriends
//     }) 
//     }
//      return res.status(200).json({
//         success:true,
//         friends
//      })
//     }
// ) 

const getMyFriends = TryCatch(async (req, res) => {
    const chatId = req.query.chatId;
  
    const chats = await Chat.find({
      members: req.user,
      groupChat: false,
    }).populate("members", "name avatar");
  
    const friends = chats.map(({ members }) => {
      const otherUser = otherPerson(members, req.user);
  
      return {
        _id: otherUser._id,
        name: otherUser.name,
        avatar: otherUser.avatar.url,
      };
    });
  
    if (chatId) {
      const chat = await Chat.findById(chatId);
  
      const availableFriends = friends.filter(
        (friend) => !chat.members.includes(friend._id)
      );
  
      return res.status(200).json({
        success: true,
        friends: availableFriends,
      });
    } else {
      return res.status(200).json({
        success: true,
        friends,
      });
    }
  });



export {registerUser , loginUser , getMyProfile , logoutUser , searchUser, sendFriendRequest, getMyNotifications, acceptRequest , getMyFriends}