// models/User.js
import mongoose , {Schema , Types, model} from 'mongoose';

// Define the user schema
const chatSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  groupChat:{
    type:Boolean,
    default:false
  },
  creator:{
    type:Types.ObjectId,
    ref:"User"
  },
  members:[
    {
      type:Types.ObjectId,
      ref:"User"
    }
  ]
}, {
  timestamps: true
});

// Create and export the model
export const Chat = mongoose.models.Chat || model('Chat', chatSchema);

