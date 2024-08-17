import express from "express"
import { isAuthenticatedUser } from "../middlewares/auth.js"
import { addMembers, deleteChat, getChatDetails, getMessages, groupChat, leaveGroup, makeAdmin, myChats, myGroups, removeMember, renameGroup, sendAttachments } from "../controllers/chatControllers.js"
import { files } from "../middlewares/multer.js"
import { newGroupValidator, 
    validateHandler,   
    removeMemberValidator,
    renameValidator,
    sendAttachmentsValidator, 
    addMemberValidator,
    chatIdValidator, } from "../lib/validators.js"

const app = express.Router()

app.post("/newGroup" , isAuthenticatedUser , newGroupValidator() , validateHandler, groupChat)
app.get("/my" , isAuthenticatedUser ,  myChats)
app.get("/myGroups" , isAuthenticatedUser ,  myGroups)
app.put("/add/members" , isAuthenticatedUser , addMemberValidator(), validateHandler,  addMembers)
app.put("/remove/member" , isAuthenticatedUser , removeMemberValidator(), validateHandler, removeMember)
app.delete("/leave/:id" , isAuthenticatedUser , leaveGroup)
app.post("/sendAttachments" , isAuthenticatedUser , files ,sendAttachmentsValidator(), validateHandler,  sendAttachments)
// app.post("/:id" , isAuthenticatedUser ,  getChatDetails)
app.route("/:id").get(isAuthenticatedUser , getChatDetails).delete(isAuthenticatedUser , deleteChat).put(isAuthenticatedUser ,renameValidator(), validateHandler , renameGroup)
app.get("/message/:id" , isAuthenticatedUser , getMessages)

app.put("/admin/make" , isAuthenticatedUser , makeAdmin)


export default app