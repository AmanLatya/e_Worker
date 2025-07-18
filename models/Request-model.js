const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker'
    },
    workerType: {
        type: String,
        required: true
    },
    userLocation: {
        place:{
            type: String,
            required:true
        },
        Coordinates: {
            ltd: { type: Number, required: true },
            lng: { type: Number, required: true }
        },
    }
    ,
    fare: {
        type: Number,
        // required: true
    },
    otp: {
        type: String,
        required: true,
        select: false
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    duration: {
        type: Number
    }, distance: {
        type: Number
    },
    paymentID: {
        type: String
    },
    orderID: {
        type: String
    },
    signature: {
        type: String
    }
});


module.exports = mongoose.model('Request', requestSchema);