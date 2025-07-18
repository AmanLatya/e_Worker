const { request } = require("express");
const requestModel = require("../models/Request-model")
const workerModel = require("../models/Worker")
const crypto = require('crypto');

async function generateOTP(digits) {
    // Generate a random OTP with specified number of digits
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const otp = crypto.randomInt(min, max + 1);
    // console.log("OTP - ", otp)
    return otp.toString();
}


module.exports.createRequest = async ({
    userLocation, user, workerType
}) => {

    if (!user || !userLocation || !workerType) {
        throw new Error('All Fields required');
    }

    // const fare = await getFare(pickup, destination);
    const workerRequest = requestModel.create({
        user,
        userLocation,
        workerType,
        otp: await generateOTP(6)
    })
    return workerRequest;
}

module.exports.getWorkerInRadius = async (ltd, lng, radius) => {
    const workers = await workerModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [[ltd, lng], radius / 6371]
            }
        }
    })

    return workers;
}



module.exports.requestAccept = async ({ requestID, worker }) => {
    if (!requestID) throw new Error("Request ID is required");

    const request = await requestModel.findOne({
        _id: requestID
    })

    console.log("Services", request);
    console.log("Services", request.status);

    if (request.status !== "pending") {
        return request.status;
    }
    await requestModel.findByIdAndUpdate({
        _id: requestID
    }, {
        status: "accepted",
        worker: worker._id
    })


    const updatedRequest = await requestModel.findOne({
        _id: requestID
    }).populate("user").populate('worker').select("+otp");

    console.log("Service 50 : ", updatedRequest)

    if (!updatedRequest) {
        throw new Error("Request Not Found");
    }

    return updatedRequest;
}


module.exports.confirmRequest = async ({ requestID, otp }) => {
    if (!requestID || !otp) {
        throw new Error("All Fields Required");
    }

    const request = await requestModel.findOne({
        _id: requestID
    }).select("+otp");

    // console.log("Services : ",request);
    // console.log("Services : ",request.status);
    if (!request) {
        throw new Error("Request Not Found");
    }

    if (request.status !== "accepted") {
        throw new Error("Request Not Accepted");
    }


    if (request.otp != otp) {
        throw new Error("Invalid OTP");
    }

    await requestModel.findByIdAndUpdate({
        _id: requestID
    }, {
        status: "ongoing"
    })

    const updatedRequest = await requestModel.findOne({
        _id: requestID
    }).select("+otp").populate("worker").populate("user");
    return updatedRequest;
}

module.exports.cancelRequest = async ({ requestID }) => {
    if (!requestID) {
        throw new Error("RequestID is Required");
    }

    const req = await requestModel.findOne({ _id: requestID })

    if (req.status === "cancelled") {
        return req.status
    }

    await requestModel.findByIdAndUpdate({
        _id: requestID
    }, {
        status: "cancelled"
    })

    const request = await requestModel.findOne({
        _id: requestID
    }).populate("user").populate("worker");

    if (!request) {
        throw new Error("Request Not Found");
    }
    return request;
}


module.exports.requestComplete = async ({ requestID }) => {
    if (!requestID) {
        throw new Error("RequestID is Required");
    }

    const req = await requestModel.findOne({ _id: requestID })

    if (req.status !== "ongoing") {
        return req.status
    }
    await requestModel.findByIdAndUpdate({
        _id: requestID
    }, {
        status: "completed"
    })

    const request = await requestModel.findOne({
        _id: requestID
    }).populate("user").populate("worker");

    if (!request) {
        throw new Error("Request Not Found");
    }
    return request;
}