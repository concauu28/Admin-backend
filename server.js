const PORT = process.env.PORT ?? 5000
const express = require ('express')
const app = express()
//postgres
const pool = require('./db')
require("dotenv").config();
const apiRoutes = require('./routes/api');
//config cors
const cors = require("cors");
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended: true}))

//route
app.use('/api/', apiRoutes);



app.listen(PORT, ()=> console.log('Server running on PORT 5000'))