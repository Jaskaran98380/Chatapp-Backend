import { userSocketIds } from "../app.js";


const otherPerson = (members , userId)=>{
    return  members.find((member)=> member._id.toString() !== userId.toString())
    
}

const getSockets = (users = []) => {
    const sockets = users.map((user) => userSocketIds.get(user.toString()));
  
    return sockets;
  };

  export const getBase64 = (file) =>
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export {otherPerson, getSockets}