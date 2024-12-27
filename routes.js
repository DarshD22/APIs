import express from "express";
import jwt from "jsonwebtoken";
import { User, Availability, Appointment } from "./index.js";
import { authenticateToken } from "./index.js";

const router = express.Router();

// User login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET);
    res.json({ token });
});

// Professor updates availability
router.post("/professor/availability", authenticateToken, async (req, res) => {
    if (req.user.role !== "professor") return res.sendStatus(403);

    const { date, timeSlots } = req.body;
    await Availability.findOneAndUpdate(
        { professorId: req.user.id, date },
        { timeSlots },
        { upsert: true, new: true }
    );
    res.json({ message: "Availability updated" });
});

// Student views available time slots
router.get("/availability/:professorId/:date", authenticateToken, async (req, res) => {
    const { professorId, date } = req.params;
    const availability = await Availability.findOne({ professorId, date });
    if (!availability) return res.status(404).json({ message: "No availability found" });
    res.json(availability.timeSlots);
});

// Student books an appointment
router.post("/appointments", authenticateToken, async (req, res) => {
    if (req.user.role !== "student") return res.sendStatus(403);

    const { professorId, date, time } = req.body;
    const appointmentExists = await Appointment.findOne({ professorId, date, time });
    if (appointmentExists) return res.status(400).json({ message: "Time slot already booked" });

    const appointment = new Appointment({ professorId, studentId: req.user.id, date, time });
    await appointment.save();
    res.json({ message: "Appointment booked" });
});

// Professor cancels an appointment
router.delete("/appointments/:appointmentId", authenticateToken, async (req, res) => {
    if (req.user.role !== "professor") return res.sendStatus(403);

    const { appointmentId } = req.params;
    await Appointment.findByIdAndDelete(appointmentId);
    res.json({ message: "Appointment canceled" });
});

// Student checks their appointments
router.get("/appointments", authenticateToken, async (req, res) => {
    if (req.user.role !== "student") return res.sendStatus(403);

    const appointments = await Appointment.find({ studentId: req.user.id });
    res.json(appointments);
});

export default router;
