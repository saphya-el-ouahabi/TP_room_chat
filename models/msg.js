const mongoose = require("mongoose");


const MessageSchema = mongoose.Schema({
    message : {
        type : String,
        required : false
    },
    expediteur : {
        type : String,
        required : false
    }
});

module.exports = mongoose.model('Message', MessageSchema);