if (!global.crypto) {
    global.crypto = require('crypto').webcrypto;
}

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');

mongoose.set('bufferTimeoutMS', 30000);

const connectDB = async () => {
    console.log("Connecting to MongoDB...");

    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                family: 4,
                serverSelectionTimeoutMS: 20000,
                socketTimeoutMS: 45000
            });
            console.log("MongoDB Connected");
            return;
        } catch (err) {
            if (attempt < 5) {
                await new Promise((r) => setTimeout(r, 5000));
            } else {
                console.error("MongoDB connection failed after 5 attempts.");
                console.error("Fix: Atlas > Network Access > Add 0.0.0.0/0");
            }
        }
    }
};

module.exports = connectDB;
