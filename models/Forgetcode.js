const {Schema, model} = require("mongoose");



const forgetCodeSchema = new Schema({
    identityOfCodes: String,
    theCodes: String,
    used: Boolean,
    codeSendTime: Number,
    expireTime: Number,
    wrongTryTime: Number
    
}, {
    timestamps: true
});

const ForgetCode = model("ForgetCode", forgetCodeSchema);

module.exports = ForgetCode;