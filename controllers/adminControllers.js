import { TryCatch } from "../middlewares/error.js";
import { User } from "../models/user.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";

const getAllUsers = TryCatch(
    async(req,res,next)=>{
        const users = await User.find();

        const transformedUsers = await Promise.all(
            users.map(async({_id , name ,username ,avatar})=>{
                const [groups , friends] = await Promise.all([
                     Chat.countDocuments({members:_id , groupChat:true}),
                     Chat.countDocuments({members:_id , groupChat:false})
                ])

            return{
                _id,
                name,
                username,
                avatar:avatar.url,
                groups,
                friends
            }
            })
        )
        res.status(200).json({
            success:true,
            users:transformedUsers
        })
    }
)

const getAllChats = TryCatch(
    async(req,res,next)=>{
        const chats = await Chat.find().populate("members" , "name avatar").populate("creator" , "name avatar");

        const transformedChats = await Promise.all(
            chats.map(async({_id , name ,groupChat , members, creator})=>{
                const totalMessages = await Message.countDocuments({chat:_id})

            return{
                _id,
                name,
                groupChat,
                avatar:members.slice(0,3).map(({avatar})=>avatar.url),
                members: members.map(({ _id, name, avatar }) => ({
                    _id,
                    name,
                    avatar: avatar.url,
                  })),
                totalMembers:members.length,
                totalMessages,
                creator:{
                    name:creator?.name || "-",
                    avatar:creator?.avatar.url || ""
                }
                
            }
            })
        )
        res.status(200).json({
            success:true,
            chats:transformedChats
        })
    }
)


const getAllMessages = TryCatch(
    async(req,res,next)=>{
        const messages = await Message.find().populate("sender" , "name avatar").populate("chat" , "groupChat");
         console.log(messages,"hurhur")
        const transformedMessages = 
            messages.map(({_id , content , attachments , sender, chat, createdAt})=>{
         console.log(chat,"chat")
            return{
                _id,
                content,
                attachments,
                createdAt,
                groupChat:chat.groupChat,
                chat:chat._id,
                sender:{
                    _id:sender._id,
                    name:sender.name,
                    avatar:sender.avatar.url
                },
                
            }
            }
        )
        res.status(200).json({
            success:true,
            messages:transformedMessages
        })
    }
)

const getDashboardStats = TryCatch(
    async(req,res,next)=>{
        const [groupsCount, usersCount, messagesCount, totalChatsCount] =
    await Promise.all([
      Chat.countDocuments({ groupChat: true }),
      User.countDocuments(),
      Message.countDocuments(),
      Chat.countDocuments(),
    ]);

    const today = new Date();

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
  
    const last7DaysMessages = await Message.find({
      createdAt: {
        $gte: last7Days,
        $lte: today,
      },
    }).select("createdAt");
    console.log(last7DaysMessages,"lsdm")
  
    const messages = new Array(7).fill(0);
    const dayInMiliseconds = 1000 * 60 * 60 * 24;
  
    last7DaysMessages.forEach((message) => {
      const indexApprox =
        (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds;
      const index = Math.floor(indexApprox);
  
      messages[6 - index]++;
    });
  
    const stats = {
      groupsCount,
      usersCount,
      messagesCount,
      totalChatsCount,
      messagesChart: messages,
    };
    
      return res.status(200).json({
        success: true,
        stats,
      });
    }
)


const adminLogin = TryCatch(
    async(req,res,next)=>{
       const {secretKey} = req.body;
       const adminKey = process.env.ADMIN_KEY || "jjjjjjjjja"

       const isMatched = secretKey===adminKey
       if (!isMatched) return next(new ErrorHandler("Invalid Admin Key", 401));

       const token = jwt.sign(secretKey, process.env.JWT_SECRET);

       return res
         .status(200)
         .cookie("admin-token", token, {
           ...cookieOptions,
           maxAge: 1000 * 60 * 15,
         })
         .json({
           success: true,
           message: "Authenticated Successfully, Welcome BOSS",
         });
    }
)


const adminLogout = TryCatch(
  async(req,res,next)=>{
      res.status(200).cookie("admin-token" , "" , {
        ...cookieOptions,
        maxAge:0
      }).json({
        success:true,
        message:"Logged out Successfully"
      })
  }
)

const getAdminInfo = TryCatch(
  async(req,res,next)=>{
      res.status(200).json({
        success:true,
        admin:true
      })
  }
)

export {getAllUsers , getAllChats , getAllMessages , getDashboardStats , adminLogin, adminLogout , getAdminInfo}