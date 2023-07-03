const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "userdetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3005, () => {
      console.log("Server Running at http://localhost:3005/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();


app.post("/create", async (req, res) => {
  await db.run(
    "CREATE TABLE userdetails(username varchar(200),password varchar(20));"
  );
  console.log("table created");
  res.send("table created");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashPass = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM userdetails WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);
  if (databaseUser === undefined) {
    const createUserQuery = `
     INSERT INTO
     userdetails (username, password)
     VALUES
      (
       '${username}',
       '${hashPass}'
      );`;
    await db.run(createUserQuery);
    res.send("User created successfully");
  } else {
    res.status(400);
    res.send({err_Msg:"User already exists"});
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `SELECT * FROM userdetails WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);

  if (databaseUser === undefined) {
    response.status(400);
    response.send({error_msg:"Invalid user"});
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwt_token = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwt_token });
    } else {
      response.status(400);
      response.send({error_msg:"Invalid password"});
    }
  }
});


app.get("/get", (req, res) => res.send("APi is working"));