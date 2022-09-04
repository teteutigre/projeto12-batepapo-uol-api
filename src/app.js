import express from "express";
import cors from "cors";
import joi from "joi";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db("batepapouol");
});

const participantesSchema = joi.object({
  name: joi.string().required(),
});

const messagesSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().valid("private_message", "message").required(),
});

app.post("/participants", async (req, res) => {
  try {
    const validate = participantesSchema.validate(req.body);
    const confirm = await db
      .collection("participants")
      .findOne({ name: req.body.name });

    if (confirm) {
      res.sendStatus(409);
      return;
    } else if (validate.error) {
      res.status(422).send("name deve ser strings não vazio");
      return;
    }
    await db.collection("participants").insertOne({
      name: req.body.name,
      lastStatus: Date.now(),
    });
    await db.collection("messages").insertOne({
      from: req.body.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs(new Date()).format("HH:mm:ss"),
    });
    res.sendStatus(201);
    return;
  } catch (err) {
    res.status(500).send(err);
    return;
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
  } catch {
    res.sendStatus(500);
    return;
  }
});

app.post("/messages", async (req, res) => {
  try {
    const validate = messagesSchema.validate(req.body);
    const confirm = await db
      .collection("participants")
      .findOne({ name: req.header.user });

    if (validate.error || !confirm) {
      res.sendStatus(422);
      return;
    }
    const message = {
      from: req.headers.user,
      to: req.body.to,
      text: req.body.text,
      type: req.body.type,
      time: dayjs(new Date()).format("HH:mm:ss"),
    };
    await db.collection("messages").insertOne(message);
    res.sendStatus(201);
    return;
  } catch {
    res.sendStatus(500);
    return;
  }
});

app.get("/messages", async (req, res) => {
  try {
    const user = req.headers.user;
    const limit = parseInt(req.query.limit);
    const messages = await db.collection("messages").find().toArray();

    if (limit) {
      const messagesLimit = [];
      for (let i = 0; i < limit; i++) {
        const msgPop = messages.pop();
        if (msgPop.to === user || msgPop.to === "Todos" || msgPop.to === user) {
          messagesLimit.push(msgPop);
        }
      }
      res.send(messagesLimit);
      return;
    } else {
      const messagesAll = [];
      for (let i = 0; i < messages.length; i++) {
        const msgAll = messages.pop();
        if (msgAll.to === user || msgAll.to === "Todos" || msgAll.to === user) {
          messagesAll.push(msgAll);
        }
      }
      res.send(messagesAll);
      return;
    }
    res.send(messages);
  } catch {
    res.sendStatus(500);
    return;
  }
});

app.listen(5000, () => console.log("Listening on port 5000"));
