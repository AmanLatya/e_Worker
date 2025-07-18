const mongoose = require("mongoose");

function connectToDB(){
    mongoose.connect(process.env.MONGO_URI).then(
        () => {console.log("MongoDB_Connected")}
    ).catch(err => {console.log(err)});
}


module.exports = connectToDB;