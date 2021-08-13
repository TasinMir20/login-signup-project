
const {Schema, model} = require("mongoose");



const verifyCodeSchema = new Schema({
    identityOfCodes: String,
    theCodes: String,
    codeSendTime: Number,
    expireTime: Number,
    wrongTryTime: Number
    
}, {
    timestamps: true
});

const VerifyCode = model("VerifyCode", verifyCodeSchema);

module.exports = VerifyCode;