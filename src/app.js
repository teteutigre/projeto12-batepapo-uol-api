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

app.post("/participants", async (req, res) => {
  try {
    const user = req.body;

    const validate = participantesSchema.validate(user);
    const confirm = await db
      .collection("participants")
      .findOne({ name: req.body.name });

    if (confirm) {
      res.sendStatus(409);
      console.log("ta entrando");
      return;
    } else if (validate.error) {
      res.status(422).send("name deve ser strings não vazio");
      return;
    }
    await db.collection("participants").insertOne({
      name: req.body.name,
      lastStatus: Date.now(),
    });
    res.sendStatus(201);
    return;
  } catch (err) {
    res.status(500).send(err);
    return;
  }
});

app.listen(5000, () => console.log("Listening on port 5000"));
