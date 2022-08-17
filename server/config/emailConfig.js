const dotenv = require('dotenv');
dotenv.config()
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Admin Gmail ID
    pass: process.env.EMAIL_PASS, // Admin Gmail Password
  },
})

let readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if(err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};
const from = process.env.EMAIL_FROM;
module.exports.SendEmail = (mailOptions)=>{
  //verify connection configuration
  console.log("Server is ready to send email");
  transporter.verify(function(error, success) {
      if (error) 
      {
        console.log(error);
      } 
      else 
      {
          console.log("Server is ready to send email");
          readHTMLFile(__dirname + '/emailTemplate.html', function(err, html) {
              var template = handlebars.compile(html);
              var replacements = {
                  msg:mailOptions.msg,
                  value: mailOptions.value
              };
              var htmlToSend = template(replacements);

              mailOptions.from = from;
               mailOptions.html = htmlToSend;
               transporter.sendMail(mailOptions, function (error, info) {
                  if (error) {
                      console.log(error);
                      //return res.status(200).json({status:false,message:"Error in sending mail!"});
                  } else {
                      console.log('Email sent: ' + info.response);
                  //return res.status(200).json({status:true,message:"Email Send Successfully."});
                  }
              });
          });
      }
  });
};
