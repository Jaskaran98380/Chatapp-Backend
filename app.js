import express from "express"
import userRoute from "./routes/user.js"
import chatRoute from "./routes/chats.js"
import adminRoute from "./routes/admin.js"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import { connectDb } from "./utils/features.js"
import { errorMiddleware } from "./middlewares/error.js"
import { createUser } from "./seeders/user.js"
import { createGroupChats, createMessagesInAChat, createSingleChats } from "./seeders/chat.js"
import { Message } from "./models/message.js"
import { Server } from "socket.io"
import {createServer} from "http"
import { CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants/events.js"
const app = express()
import {v4 as uuid} from "uuid"
import { getSockets } from "./lib/helper.js"
import cors from "cors"
import {v2 as cloudinary} from "cloudinary"
import { corsOptions } from "./constants/config.js"
import { socketAuthenticator } from "./middlewares/auth.js"



const server = createServer(app)
const io = new Server(server , {cors:corsOptions});

app.set("io" , io)

dotenv.config({
    path:"./.env"
})

cloudinary.config({

  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
})

const adminKey = process.env.ADMIN_KEY
connectDb(process.env.URI)

const userSocketIds = new Map()
const onlineUsers = new Set();

// createUser(10);
// createSingleChats(10)
// createGroupChats(10)
// createMessagesInAChat("66b745e43a3b5c8e5397f4c8" , 50);


app.use(express.json())         //parse json(conversion from json to js object)
app.use(cookieParser())         //populates req.cookie
app.use(express.urlencoded())   //populates req.body
app.use(cors(corsOptions))
app.use("/api/v1/user" , userRoute);
app.use("/api/v1/chat" , chatRoute);
app.use("/api/v1/admin" , adminRoute);

const port = process.env.PORT || 3000
const envMode = process.env.NODE_ENV.trim() || "PRODUCTION"

io.use((socket, next) => {
      cookieParser()(socket.request , socket.request.res , async(err)=>{
        await socketAuthenticator(err , socket , next)
      })
  });

io.on("connection" , (socket)=>{
    console.log("a user connected", socket.id);

    // const user = {
    //      _id:"djjncjn",
    //      name:"Hero"
    // }
    const user = socket.user;
    console.log(user);
    userSocketIds.set(user._id.toString() , socket.id)
    console.log(userSocketIds);

        socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
            const messageForRealTime = {
              content: message,
              _id: uuid(),
              sender: {
                _id: user._id,
                name: user.name,
              },
              chat: chatId,
              createdAt: new Date().toISOString(),
            };
        
            const messageForDB = {
              content: message,
              sender: user._id,
              chat: chatId,
            };

            console.log("emitting" , messageForRealTime)
            console.log("emitting" , members)

            const membersSocket = getSockets(members);
            io.to(membersSocket).emit(NEW_MESSAGE, {
              chatId,
              message: messageForRealTime,
            });
            io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });
        
            try {
              await Message.create(messageForDB);
            } catch (error) {
              throw new Error(error);
            }

            console.log("message" , messageForRealTime)
        
    })

    socket.on(START_TYPING , ({members , chatId})=>{
      console.log("Start typing" , members , chatId)

      const membersSockets = getSockets(members);
      socket.to(membersSockets).emit(START_TYPING , ({chatId}))
    })

    socket.on(STOP_TYPING , ({members , chatId})=>{
      console.log("Stop typing" , members , chatId)

      const membersSockets = getSockets(members);
      socket.to(membersSockets).emit(STOP_TYPING , ({chatId}))
    })
    socket.on(CHAT_JOINED, ({ userId, members }) => {
      onlineUsers.add(userId.toString());
  
      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
    })
  
    socket.on(CHAT_LEAVED, ({ userId, members }) => {
      onlineUsers.delete(userId.toString());
  
      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
    });
    socket.on("disconnect",()=>{
        console.log("user disconnected" , socket.id);
        userSocketIds.delete(user._id.toString())
        onlineUsers.delete(user._id.toString());
        socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
    })
})

app.use(errorMiddleware);

// app.listen(port , ()=>{
//     console.log(`Server is running on port ${port} in ${envMode} mode.`);
// });
server.listen(port , ()=>{
    console.log(`Server is running on port ${port} in ${envMode} mode.`);
});

export {envMode , adminKey, userSocketIds}