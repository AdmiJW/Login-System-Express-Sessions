const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        index: true,
        required: true
    },
    hashed_password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: ""
    },
    profile_pic: String
});

module.exports = mongoose.model('Users', userSchema);