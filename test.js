import request from "supertest";
import mongoose from "mongoose";
import { app, User, Availability, Appointment } from "./index.js";

describe("E2E Test for Appointment System", () => {
    let professorToken;
    let studentToken;
    let professorId;

    beforeAll(async () => {
        console.log("--->   Clearing the database...");
        await User.deleteMany({});
        await Availability.deleteMany({});
        await Appointment.deleteMany({});

        console.log("--->   Setting up test data...");
        // Create a professor
        const professor = await User.create({
            username: "professor1",
            password: "password",
            role: "professor",
        });
        professorId = professor._id;

        console.log("--->   Professor created with ID:", professorId);

        // Create a student
        const student = await User.create({
            username: "student1",
            password: "password",
            role: "student",
        });

        console.log("--->   Student created with ID:", student._id);

        // Login as professor
        const professorLogin = await request(app).post("/login").send({
            username: "professor1",
            password: "password",
        });
        professorToken = professorLogin.body.token;
        console.log("--->   Professor logged in. Token acquired.");

        // Login as student
        const studentLogin = await request(app).post("/login").send({
            username: "student1",
            password: "password",
        });
        studentToken = studentLogin.body.token;
        console.log("--->   Student logged in. Token acquired.");
    });

    it("Student books an appointment", async () => {
        console.log("--->   Test: Student books an appointment");
        jest.setTimeout(10000);

        console.log("--->   Professor updates availability...");
        const availabilityResponse = await request(app)
            .post("/professor/availability")
            .set("Authorization", `Bearer ${professorToken}`)
            .send({ date: "2024-12-25", timeSlots: ["10:00", "11:00"] })
            .expect(200);
        console.log("--->   Availability updated:", availabilityResponse.body.message);

        console.log("--->   Student books an appointment...");
        const appointmentResponse = await request(app)
            .post("/appointments")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({ professorId: professorId.toString(), date: "2024-12-25", time: "10:00" })
            .expect(200);

        console.log("--->   Appointment booked:", appointmentResponse.body.message);
    });

    afterAll(async () => {
        console.log("--->   Cleaning up database...");
        await mongoose.connection.close();
        console.log("--->   Database connection closed.");
    });
});
