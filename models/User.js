// Username, Email, Password, Profile

const {Schema, model} = require("mongoose");


// const Profile = require("./Profile");

const userSchema = new Schema({
    username: {
        type: String,
        trim: true,
        maxlength: 15,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    emailStatus: String,
    userCreateEpochTime: Number,
    verifyCodeResendTimes: Number,
    recoveryCodeResendTimes: Number

}, {
    timestamps: true
});

const User = model("User", userSchema);

module.exports = User;