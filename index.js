const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ckrv9my.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const toolCollection = client.db('tools-gallery').collection('tools');
        const orderCollection = client.db('tools-gallery').collection('orders');
        const reviewCollection = client.db('tools-gallery').collection('reviews');
        const usersCollection = client.db('tools-gallery').collection('users');


        //get All users
        app.get('/user', async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
          })

          //get single user users
        app.get('/user/:email', async (req, res) => {
            const email = req?.params?.email;
            const query = { email: email };
            const users = await usersCollection.find(query).toArray(); 
            res.send(users);
          })

          // User profile update
          app.put('/user/profile/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body; 
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            // console.log("result: ", result);
            res.send( result);
          })

          //Delete user
          app.delete('/user/:id',     async (req, res) => {
            const userId = req.params.id;
            const filter = { _id: ObjectId(userId) };
            const result = await usersCollection.deleteOne(filter)
            res.send(result);
          })
      
        // user token generate by email 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ result, token });
        })

         // Check user admin or not
        app.get('/admin/:email', async (req, res) => {

            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            return res.send({ admin: isAdmin });
          })

          // Make user admin route
          app.put('/user/admin/:email', async (req, res) => {
            // console.log("Problem inside");
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
              $set: { role: 'admin' },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send({ result });
          })




        //  get all tools 
        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolCollection.find(query)
            const tools = await cursor.toArray();
            res.send(tools);
        })

        //  get single product by id 
        app.get('/tool/:id', async (req, res) => {
            const toolId = req.params.id;
            // console.log(toolId);
            const tool = await toolCollection.findOne({ _id: ObjectId(toolId) });
            res.send(tool);
        });

        // add tool client to server
        app.post('/tools', async (req, res) => {
            const tool = req.body;
            const result = await toolCollection.insertOne(tool);
            res.send(result);
        });

        // update tool quantity after user order
        app.put('/tool/:id', async (req, res) => {
            const toolId = req.params.id;
            const filter = { _id: ObjectId(toolId) }
            const quantity = req.body;
            const updateDoc = {
                $set: quantity,
            };
            const update = await toolCollection.updateOne(filter, updateDoc);
            res.send({ update, quantity });
        });


        //  Delete  tool  
        app.delete('/tool/:id', async (req, res) => {
            const toolId = req.params.id;
            const filter = { _id: ObjectId(toolId) };
            const result = await toolCollection.deleteOne(filter);
            res.send(result);
        });


        //  get all oders   
        app.get('/order', async (req, res) => {
            const query = {};
            const cursor = orderCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        //  get all oders   for single user
        app.get('/order/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const cursor = orderCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        //  Delete oder tool  for single user
        app.delete('/order/:id', async (req, res) => {
            const toolId = req.params.id;
            const filter = { _id: ObjectId(toolId) };
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        });


        // add  client order history
        app.put('/order', async (req, res) => {
            const orderInfo = req.body;
            const query = { email: orderInfo.email, tool_id: orderInfo.tool_id };
            const exists = await orderCollection.findOne(query);
            if (exists) {
                orderInfo.order_quantity = parseInt(exists.order_quantity) + parseInt(orderInfo.order_quantity);
                // console.log(exists);
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: orderInfo,
            };
            const result = await orderCollection.updateOne(query, updateDoc, options);

            res.send(result);
        });


        // get client all review to server
        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query)
            const revies = await cursor.toArray();
            res.send(revies);

        });

        // add client review to server
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        
        console.log("database Connected");
    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello From Tools Gallery')
})

app.listen(port, () => {
    console.log(`Tools Gallery listening on port ${port}`)
})