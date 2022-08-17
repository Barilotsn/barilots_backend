const mongoose = require('mongoose');
const DB_OPTIONS = {
  // socketTimeoutMS: 30000,
  // keepAlive: true,
  // reconnectTries: 30000,
  // useNewUrlParser: true,
  // useCreateIndex:true,
  // poolSize:10,
  dbName: "barilostdb"
};

const DATABASE_URL = process.env.DATABASE_URL
mongoose.connect(DATABASE_URL, DB_OPTIONS,function(err,db){
  if(err)
  {
      //err handle
      console.log('Error in MongoDB Connection : ' +JSON.stringify(err,undefined,2));  
  }
  else
  {
      //connected successfully
      console.log("MongoDB Connection succeeded.");  
  } 
});
   
require('./User');