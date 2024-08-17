// models/User.js
import mongoose , {Schema , model , Types} from 'mongoose';

// Define the user schema
const messageSchema = new Schema({
  content:String,
  attachments:[
    {
      public_id:{
        type:String,
        required:true
      },
      url:{
        type:String,
        required:true
      }
    }
  ],
  sender:{
    type:Types.ObjectId,
    ref:"User",
    required:true
  },
  chat:{
    type:Types.ObjectId,
    ref:"Chat",
    required:true
  },
}, {
  timestamps: true
});

// Create and export the model
export const Message = mongoose.models.Message || model('Message', messageSchema);

