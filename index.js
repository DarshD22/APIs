import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import routes from "./routes.js"; 
import jwt from 'jsonwebtoken';
dotenv.config();

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL);
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});


const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String // 'student' or 'professor'
});

const availabilitySchema = new mongoose.Schema({
  professorId: mongoose.Schema.Types.ObjectId,
  date: String,
  timeSlots: [String] // Array of available time slots
});

const appointmentSchema = new mongoose.Schema({
  professorId: mongoose.Schema.Types.ObjectId,
  studentId: mongoose.Schema.Types.ObjectId,
  date: String,
  time: String
});

export function authenticateToken(req,res,next){
    const token=req.headers['authorization']?.split(' ')[1];
    if(!token) return res.sendStatus(401);

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
        if(err) return res.sendStatus(403);
        req.user=user;
        next();
    });
}

// Use the routes from routes.js
app.use("/", routes); // Mount all routes on the root path

// Start the server
app.listen(process.env.PORT, () => 
    console.log(`Server running on http://localhost:${process.env.PORT}`)
);

export { app };
export const User=mongoose.model('User',userSchema);
export const Availability=mongoose.model('Availability',availabilitySchema);
export const Appointment=mongoose.model('Appointment',appointmentSchema);

