import express from "express"
import { adminLogin, adminLogout, getAdminInfo, getAllChats, getAllMessages, getAllUsers, getDashboardStats } from "../controllers/adminControllers.js";
import { adminLoginValidator, validateHandler } from "../lib/validators.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router()

app.post("/verify" ,adminLoginValidator() , validateHandler , adminLogin);
app.get("/logout" , adminLogout);

app.use(adminOnly)
app.get("/users" , getAllUsers);
app.get("/chats" , getAllChats);
app.get("/messages" , getAllMessages);
app.get("/stats" , getDashboardStats);
app.get("/" , getAdminInfo);



export default app