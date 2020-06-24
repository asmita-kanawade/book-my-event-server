const mongoose = require('mongoose');

const bookedEventsSchema = new mongoose.Schema({
    customer: {
        type: Object,
        required: true
    },
    email:{
		type:String,
		required: true
	},
	id:{
		type:String,
		required: true
	},
    title: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    from_date:{
        type:String,
        required:true
    },
    to_date:{
        type:String,
        required:true
    },
    from_time:{
        type:String,
        required:true
    },
    to_time:{
        type:String,
        required:true
    },
    occurrence:{
        type:String
    },    
    price:{
        type:Number,
        required:true
    },
    favourites_count:{
        type:Number
    },
    imageUrl:{
        type:String
    },
    showInBanner:{
        type:Boolean
    },
    isFeatured:{
        type:Boolean
    },
    artists:{
        type:String
    },
    description:{
        about:{
            type:String
        },
        venue:{
            type:String
        },
        terms:{
            type:String
        }
    },
    payment_id:{
		type:String,
		required: true
    },
    booking_date:{
		type:Date,
		required: true
	}

})

module.exports = mongoose.model('bookedEvents',bookedEventsSchema, `bookedEvents`);