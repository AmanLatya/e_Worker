const requestModel = require('../models/Request-model');
const requestServices = require('../services/request-services');
const { validationResult } = require('express-validator');
const { sendMessageToSocketId } = require('../socket');

module.exports.createRequest = async (req, res, next) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() })
    }

    const { userLocation, workerType } = req.body;
    // console.log("Controller - 14 ", userLocation)
    // console.log("Controller - 15 ", workerType)

    try {
        const workerRequest = await requestServices.createRequest({ userLocation, user: req.user._id, workerType });
        // console.log("Controller - 20 ", workerRequest);


        const client = await requestModel.find({ _id: workerRequest._id }).populate('user')

        const workersInRadius = await requestServices.getWorkerInRadius(
            userLocation.Coordinates.ltd,
            userLocation.Coordinates.lng,
            10
        );
        // console.log("Controller 30 : ", workersInRadius)

        workersInRadius.map(worker => {
            // console.log(worker.socketID)
            if (worker.socketID != null) {
                sendMessageToSocketId(worker.socketID, {
                    event: 'new-request',
                    data: client
                })
            }
        });

        // console.log("Controller - 41 Client : ", client);
        return res.status(200).json(workersInRadius);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err })
    }
}

module.exports.requestAccept = async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({ error: err.array() });
    }

    const { requestID } = req.body;

    try {
        // console.log(`Contorller 59 : ${requestID} and ${req.user}`);
        const requestAccepted = await requestServices.requestAccept({ requestID, worker: req.user });
        // console.log("Controller - 61 : ", requestAccepted);

        if (requestAccepted === "accepted" || requestAccepted === "ongoing" || requestAccepted === "completed" || requestAccepted === "cancelled") {
            return res.status(404).json({ message: "Request Expired" });
        }
        sendMessageToSocketId(requestAccepted.user.socketID, {
            event: 'request-accepted',
            data: requestAccepted
        })
        return res.status(200).json(requestAccepted);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message })
    }
}


module.exports.confirmRequest = async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({ error: err.array() });
    }

    const { requestID, otp } = req.query;

    try {
        const confirmRequest = await requestServices.confirmRequest({ requestID, otp });
        // console.log(confirmRequest)
        sendMessageToSocketId(confirmRequest.user.socketID, {
            event: 'request-confirm',
            data: confirmRequest
        })
        return res.status(200).json(confirmRequest);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message })
    }
}


module.exports.cancelRequest = async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({ error: err.array() });
    }

    const { requestID } = req.query;
    try {
        const cancelRequest = await requestServices.cancelRequest({ requestID });

        if (cancelRequest === "cancelled") {
            return res.status(400).json({ message: "Cancelled Already" })
        }
        // console.log(confirmRequest)
        sendMessageToSocketId(cancelRequest.user.socketID, {
            event: 'request-cancelled',
            data: "Request is cancelled"
        })
        sendMessageToSocketId(cancelRequest.worker.socketID, {
            event: 'request-cancelled',
            data: "Request is cancelled"
        })
        return res.status(200).json(cancelRequest);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message })
    }

}

module.exports.requestComplete = async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({ error: err.array() });
    }

    const { requestID } = req.query;
    try {
        const requestComplete = await requestServices.requestComplete({ requestID });
        console.log(requestComplete);
        if (requestComplete === "completed") {
            return res.status(400).json({ message: "Complete Already" })
        } else if (requestComplete.status === "completed") {
            sendMessageToSocketId(requestComplete.user.socketID, {
                event: 'request-completed',
                data: "Request is completed"
            })
            sendMessageToSocketId(requestComplete.worker.socketID, {
                event: 'request-completed',
                data: "Request is completed"
            })
            return res.status(200).json(requestComplete);
        }
        return res.status(404).json({ message: "Invalid Request" })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message })
    }

}