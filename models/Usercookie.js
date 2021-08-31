
const {Schema, model} = require("mongoose");


const usercookieSchema = new Schema({
    userObject_idAsCookieIdentity: {
        type: String,
        trim: true,
        required: true
    },
    cookieName: {
        type: String,
        trim: true,
        required: true
    },
    cookieValue: {
        type: String,
        trim: true,
        required: true
    },
    login: {
        type: Boolean,
        required: true
    }
}, {
    timestamps: true
});

const Usercookie = model("Usercookie", usercookieSchema);

module.exports = Usercookie;