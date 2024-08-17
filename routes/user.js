import express from "express"
import { acceptRequest, getMyFriends, getMyNotifications, getMyProfile, loginUser, logoutUser, registerUser, searchUser, sendFriendRequest } from "../controllers/userControllers.js"
import { singleAvatar } from "../middlewares/multer.js"
import { isAuthenticatedUser } from "../middlewares/auth.js"
import { acceptRequestValidator, loginValidator, registerValidator, sendRequestValidator, validateHandler } from "../lib/validators.js"
const app = express.Router()

app.post("/new" , singleAvatar , registerValidator() , validateHandler ,  registerUser)
app.post("/login" , loginValidator() , validateHandler , loginUser)
app.get("/me" , isAuthenticatedUser , getMyProfile)
app.get("/logout" , isAuthenticatedUser , logoutUser)
app.get("/search" , isAuthenticatedUser , searchUser)
app.put("/sendrequest" , isAuthenticatedUser , sendRequestValidator() , validateHandler,  sendFriendRequest)
app.get("/getNotifications" , isAuthenticatedUser ,  getMyNotifications)
app.put("/acceptRequest" , isAuthenticatedUser , acceptRequestValidator() , validateHandler, acceptRequest)
app.get("/getFriends" , isAuthenticatedUser , getMyFriends)

export default app