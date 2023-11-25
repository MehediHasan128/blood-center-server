require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jmtxbp5.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const dictrictColletion = client.db("bloodCenterDB").collection("districts");
    const upazilaCollection = client.db("bloodCenterDB").collection("upazila");
    const userCollection = client.db("bloodCenterDB").collection("users");


    // Custom Middelware
    const verifyToken = (req, res, next) =>{
      if(!req.headers.authorization){
        return res.status(401).send({message: 'unauthorized access'})
      }

      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.SECREAT_TOKEN, (err, decoded) =>{
        if(err){
          return res.status(401).send({message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next();
      })
    }



    // Json web token relateld api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECREAT_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // District related api
    app.get("/districts", async (req, res) => {
      const result = await dictrictColletion.find().toArray();
      res.send(result);
    });

    app.get("/upazila/:name", async (req, res) => {
      const districtName = req.params.name;
      const query = { district_name: districtName };
      const result = await upazilaCollection.find(query).toArray();
      res.send(result);
    });

    // User related api

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The blood center server is running");
});

app.listen(port, () => {
  console.log(`This ser is running on port ${port}`);
});
