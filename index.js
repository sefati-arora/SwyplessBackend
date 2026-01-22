const express=require('express');
const app=express();
const PORT=4000;
const fileUpload= require("express-fileupload");
const path=require("path");
require('./config/connectdb').connectdb();
require('./models/index');
const socketHandler=require("socket.io");
const http=require("http");
const{Server}=require("socket.io");
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*",methods:["GET","POST"]}});
socketHandler(io);
const router=require('./router/userRouter');
const router1=require('./router/hostRouter')
 app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
app.use('/api',router1);
app.use('/api',router);
app.get('/',(req,res)=>
{
    res.send('SERVER CREATED FOR PROJECT SWYPLESS')
});
server.listen(PORT,()=>
{
    console.log(`SERVER CREATED AT http://localhost:${PORT}`)
})