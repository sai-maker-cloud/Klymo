const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    bio:{
        type: String,
        required: true
    },
    gender:{
        type: String,
        enum: ['Male','Female'],
        required: true
    },
    image:{
        url: { type: String, required: true }
    },
    intrests: {
        type: String,
        enum: ['Male','Female','Any'],
        default: 'Any'
    }
}, {timestamps: true});

module.exports = mongoose.model('users',userSchema);