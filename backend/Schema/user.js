import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  name: {
    type: String,
    default: "Bot",
  },

  email_friends: {
    type: [
      {
        name: String,
        email: String,
        image: String,
      },
    ],
    default: [],
  },

  image: {
    type: String,
    default:
      "https://ui-avatars.com/api/?name=User&background=random&color=fff",
  },

  requests: {
    type: [String],
    default: [],
  },

  sent_requests: {
    type: [String],
    default: [],
  },

  fcmToken: {
    type: String,
    default: "",
  },
});

const User = mongoose.model("User", UserSchema);

export default User;