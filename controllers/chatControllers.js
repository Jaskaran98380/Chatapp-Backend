import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { ALERT , NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js";
import { deleteFilesFromCloudinary, emitEvent, uploadFilesToCloudinary } from "../utils/features.js";
import { otherPerson } from "../lib/helper.js";
import { User } from "../models/user.js";
import { ErrorHandler } from "../utils/utility.js";
import { Message } from "../models/message.js";


const groupChat = TryCatch(
    async(req , res , next)=>{
        const {name , members} = req.body
        console.log(members.length,"ml");

        // if(members.length < 2){
        //     return next(new Error("Group chat must have atleast 3 members") , 400)
        // }

        const allMembers = [...members , req.user]
        
            const chat = await Chat.create({
                name,
                members:allMembers,
                creator:req.user,
                groupChat:true
            });

            emitEvent(req, ALERT, allMembers, `Welcome to ${name} group.`);
            emitEvent(req, REFETCH_CHATS, members);
          
            return res.status(201).json({
              success: true,
              message: "Group Created",
          
        })
})

const myChats = TryCatch(
    async(req,res,next)=>{
        const chats = await Chat.find({members:req.user}).populate(
            "members",
            "name avatar"
        )

        

        const transformedChats = chats.map(({_id , name , members , groupChat})=>{
            const otherMember = otherPerson(members , req.user)
            return{
                _id,
                name:groupChat ? name : otherMember.name,
                avatar:groupChat ? members.slice(0,3).map(({avatar})=>avatar.url) : [otherMember.avatar.url],
                members:members.reduce((prev , curr)=>{
                    if(curr._id.toString() !== req.user.toString()){
                        prev.push(curr._id);
                    }
                    return prev;
            }, []) , 
                groupChat
            }
        })
    
    return res.status(200).json({
        success:true,
        chats:transformedChats
    })
}
)


const myGroups = TryCatch(
    async(req,res,next)=>{
        console.log(req.user , "abhiii")
        const groups = await Chat.find({members:req.user ,groupChat:true , creator:req.user}).populate(
            "members",
            "name avatar"
        )

        

        const transformedGroups = groups.map(({_id , name ,members , groupChat})=>{
            return{
                _id,
                name: name,
                avatar:members.slice(0,3).map(({avatar})=>avatar.url), 
                groupChat
            }
        })
    
    return res.status(200).json({
        success:true,
        groups:transformedGroups
    })
}
)

const addMembers = TryCatch(
    async(req,res,next)=>{
      const {chatId , members} = req.body;

      if(!members || members.length<1){
        return next(new Error("Add members please" , 400))
      }

      const chat = await Chat.findById(chatId)
        console.log(chat.groupChat , "gc")
      if(!chat){
        return next(new Error("Chat does not exist" , 400))
      }
      if(!chat.groupChat){
        return next(new Error("It is not a group chat" , 400))
      }
      console.log(chat.creator , "cc")
      console.log(req.user , "ru")
      
      if(chat.creator.toString()!==req.user.toString()){
        return next(new Error("You are not allowed to add" , 400))
      }

      const allMembersPromise = members.map((i)=>User.findById(i , "name"))
      const allMembers = await Promise.all(allMembersPromise)
      console.log(allMembers , "am");
      console.log(allMembersPromise , "amp");
      console.log(chat.members , "bef")

      const uniqueMembers = allMembers.filter((i)=>!chat.members.includes(i._id))
    //   chat.members.push(...allMembers.map((i)=>i._id))
      chat.members.push(...uniqueMembers.map((i)=>i._id))
      console.log(uniqueMembers , "um");

      if(chat.members.length>100){
        return next(new Error("Group max limit exceeded" , 400))
      }

      await chat.save();

      console.log(chat.members , "aff")

      
        const allUsersName=allMembers.map((i)=>i.name)

        emitEvent(req , ALERT , chat.members , `${allUsersName} has been added to group` )
        emitEvent(req , REFETCH_CHATS , chat.members )
     
    
    return res.status(200).json({
        success:true,
        message:"Members added successfully"
    })
}
)

// const removeMembers = TryCatch(
//     async(req,res,next)=>{
//       const {chatId , members} = req.body;

//       if(!members || members.length<1){
//         return next(new Error("Delete members please" , 400))
//       }

//       const chat = await Chat.findById(chatId)
//         console.log(chat.groupChat , "gc")
//       if(!chat){
//         return next(new Error("Chat does not exist" , 400))
//       }
//       if(!chat.groupChat){
//         return next(new Error("It is not a group chat" , 400))
//       }
//       if(chat.creator.toString()!==req.user.toString()){
//         return next(new Error("You are not allowed to delete members" , 400))
//       }

//       const allMembersPromise = members.map((i)=>User.findById(i , "name"))
//       const allMembers = await Promise.all(allMembersPromise)
//       console.log(allMembers , "am");
//     //   console.log(allMembersPromise , "amp");
//       console.log(chat.members , "bef")

//       const uniqueMembers = allMembers.filter((i)=>chat.members.includes(i._id.toString())).map((i)=>i._id.toString())
//       console.log(uniqueMembers , "um")
//     //   chat.members.push(...allMembers.map((i)=>i._id))
    
//       const updatedMembers = chat.members.filter((i)=>!uniqueMembers.includes(i._id.toString()))
//       console.log(updatedMembers , "upm")
//       chat.members = [...updatedMembers]


//       await chat.save();

//       console.log(chat.members , "aff")

      
//         const allUsersName=allMembers.map((i)=>i.name)

//         emitEvent(req , ALERT , chat.members , `${allUsersName} has been removed from the group` )
//         emitEvent(req , REFETCH_CHATS , chat.members )
     
    
//     return res.status(200).json({
//         success:true,
//         message:"Members removed successfully"
//     })
// }
// )

const removeMember = TryCatch(
    async(req,res,next)=>{
        const {userId , chatId} = req.body;
        
         const [chat , user] = await Promise.all([
            Chat.findById(chatId),
            User.findById(userId)
         ])
         console.log(req.user , "mee");
         if(!chat){
                    return next(new Error("Chat does not exist" , 400))
                  }
                  if(!chat.groupChat){
                    return next(new Error("It is not a group chat" , 400))
                  }
                  if(chat.creator.toString()!==req.user.toString()){
                    return next(new Error("You are not allowed to delete member" , 400))
                  }

                  // if(chat.members.length<4){
                  //   return next(new Error("Group must have atleast 3 members" , 400))
                  // }

                  const allChatMembers = chat.members.map((i) => i.toString());
                  console.log(chat.members , "cm")
                  console.log(allChatMembers,"acmacm")
                chat.members = chat.members.filter((i)=> i.toString() !== userId.toString())

                await chat.save();

                emitEvent(req , ALERT , chat.members , {
                  message: `${user.name} has been removed from the group`,
                  chatId,
                })

                emitEvent(req, REFETCH_CHATS, allChatMembers);

                return res.status(200).json({
                            success:true,
                            message:"Members removed successfully"
                        })
    }
)

const leaveGroup = TryCatch(
    async(req,res,next)=>{
        const chatId = req.params.id;

        const chat = await Chat.findById(chatId)
        if(!chat){
            return next(new Error("Chat does not exist" , 400))
        }
        const remainingMembers = chat.members.filter((member)=>member.toString() !== req.user.toString())

        if(chat.creator.toString() === req.user.toString()){
            const randomElement = Math.floor(Math.random() * remainingMembers.length)
            chat.creator = remainingMembers[randomElement]
        }
        

        chat.members = remainingMembers
        const user = await User.findById(req.user)
        await chat.save();

        emitEvent(req , ALERT , chat.members , {
          chatId,
          message: `User ${user.name} has left the group`,
        })

        return res.status(200).json({
            success:true,
            message:`${user.name} has left the group`
        })
    }
)

const sendAttachments = TryCatch(
    async(req,res,next)=>{
        const {chatId} =req.body

        const files = req.files || []

        if(files.length < 1){
            return next(new Error("Please send attachments" , 400))
        }

        if(files.length > 5){
            return next(new Error("Attachments must be between 1-5" , 400))
        }

        const [chat, me] = await Promise.all([
            Chat.findById(chatId),
            User.findById(req.user, "name"),
          ]);

        const attachments= await uploadFilesToCloudinary(files);

        const messageForDb = {
            content:"",
            sender:req.user,
            attachments,
            chat:chatId
        }

        const messageForRealTime = {
            ...messageForDb,
            sender:{
                _id:me._id,
                name:me.name
            }
        }
        const message = await Message.create(messageForDb);

        emitEvent(req, NEW_MESSAGE, chat.members, {
          message: messageForRealTime,
          chatId,
        });
      
        emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });
      
        return res.status(200).json({
          success: true,
          message,
        });
      });

      const getChatDetails = TryCatch(
        async(req,res,next)=>{

            if(req.query.populate==="true"){
                const chat = await Chat.findById(req.params.id).populate("members" , "name avatar").lean()
                if(!chat){
                    return next(new ErrorHandler("Chat not found" , 404));
                }
                chat.members = chat.members.map(({_id , name , avatar})=>{
                    return{
                        _id,
                        name,
                        avatar:avatar.url
                    }
                })
                return res.status(200).json({
                    success:true,
                    chat
                })
            }
            else{
                const chat = await Chat.findById(req.params.id)
                if(!chat){
                    return next(new ErrorHandler("Chat not found" , 404));
                }
                
                return res.status(200).json({
                    success:true,
                    chat
                })
            }
        }
      )

      
      const renameGroup = TryCatch(
        async(req,res,next)=>{
            const {name} = req.body;
            console.log(name,"justNow");
         const chatId = req.params.id;
         const chat = await Chat.findById(chatId);
         if(!chat){
            return next(new ErrorHandler("Chat does not exist" , 400))
         }
         if(!chat.groupChat){
            return next(new ErrorHandler("It is not a group chat" , 400))
         }
         if(chat.creator.toString() !== req.user.toString()){
            return next(new ErrorHandler("You are not allowed to add.." , 400))
         }
         chat.name = name;
         await chat.save();

         emitEvent(req , REFETCH_CHATS , chat.members )

        res.status(200).json({
            success:true,
            message:"Group renamed successfully"
        })}
      )

      const deleteChat = TryCatch(
        async(req,res,next)=>{
         const chatId = req.params.id;
         const chat = await Chat.findById(chatId);
         if(!chat){
            return next(new ErrorHandler("Chat does not exist" , 400))
         }
         if(chat.groupChat && chat.creator.toString()!==req.user.toString()){
            return next(new ErrorHandler("You are not allowed to delete chat" , 400))
         }
         if(!chat.groupChat && !chat.members.includes(req.user)){
            return next(new ErrorHandler("You are not allowed to delete chat" , 400))
         }

         const messagesWithAttachments = await Message.find({
            chat:chatId,
            attachments:{$exists:true, $ne:[]}
         })
         const publicIds=[];

         messagesWithAttachments.forEach(({attachments})=>
            attachments.forEach(({public_id})=>publicIds.push(public_id))
         )

         await Promise.all([
            deleteFilesFromCloudinary(publicIds),
            chat.deleteOne(),
            Message.deleteMany({chat:chatId})
         ])
         emitEvent(req , REFETCH_CHATS , chat.members)

         res.status(200).json({
            success:true,
            message:"Chat deleted successfully"
         })


        }
      )

      const getMessages = TryCatch(async(req,res,next)=>{
        const chatId = req.params.id;
        const {page = 1} = req.query;
        const resultsPerPage = 20;
        const skip = (page - 1) * resultsPerPage;

        const chat = await Chat.findById(chatId);

        if (!chat) return next(new ErrorHandler("Chat not found", 404));
      
        if (!chat.members.includes(req.user.toString()))
          return next(
            new ErrorHandler("You are not allowed to access this chat", 403)
          );

         const [messages , totalMessages] = await Promise.all([
            Message.find({chat:chatId}).sort({createdAt : -1}).limit(resultsPerPage)
           .skip(skip).populate("sender" , "name").lean(),
           Message.countDocuments({chat:chatId})
         ]

         )
        const totalPages = Math.ceil(totalMessages/resultsPerPage);
         res.status(200).json({
            success:true,
            message:messages.reverse(),
            messageCount:totalMessages,
            totalPages:totalPages
         })

        })

        const makeAdmin = TryCatch(
          async(req,res,next)=>{
            const {chatId , userId} = req.body;
            console.log(chatId,"chatId")
            console.log(userId,"userId")

            const chat = await Chat.findById(chatId);
            if (!chat) return next(new ErrorHandler("Chat not found", 404));

            const user = await User.findById(userId);
            if (!user) return next(new ErrorHandler("User not found", 404));

            if(!chat.groupChat){
              return next(new ErrorHandler("This is not a Group Chat", 404));
            }

            chat.creator = userId;
            await chat.save()

            res.status(200).json({
              success:true,
              admin:userId
            })
          }
        )


      




export {groupChat , myChats , myGroups , addMembers , removeMember , leaveGroup , sendAttachments , getChatDetails, renameGroup, deleteChat , getMessages, makeAdmin}