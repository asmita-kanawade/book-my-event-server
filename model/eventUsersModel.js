const mongoose = require('mongoose');

const eventUsersSchema = new mongoose.Schema({
	firstname: {
        type: String,
        required: true
	},
	lastname: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required:true
    },
    user_type: {
        type: String,
        required:true
	}
})

module.exports = mongoose.model('eventUsers',eventUsersSchema, `eventUsers`);