
const dotenv = require('dotenv');
dotenv.config()
require('./models/connectdb');
const  express = require('express');
const  cors = require('cors');
//const  connectDB = require('./models/connectdb.js');
const  userRoutes = require('./routes/userRoutes')

const app = express()
const port = process.env.PORT

// CORS Policy
app.use(cors())

// JSON
app.use(express.json())

// Load Routes
app.use("/api/user", userRoutes)
//error handler
app.use((err, req, res, next) => {
  if(err.name === 'ValidationError')
  {
      var valErrors=[];
      Object.keys(err.errors).forEach(key =>valErrors.push(err.errors[key].message));
      res.status(200).send({status:false,msg:valErrors[0]});
  }
});
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})