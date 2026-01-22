require("dotenv").config();
const Models = require("../models/index");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const helper = require("../helper/validation");
const commonHelper = require("../helper/commonHelper");
const argon2 = require("argon2");
const fileUpload = require("express-fileupload");
const otpManager = require("node-twillo-otp-manager")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  process.env.TWILIO_SERVICE_SID,
);

Models.bookingModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
  as: "user"
});
Models.userModel.hasMany(Models.bookingModel, {
  foreignKey: "userId",
  as: "bookingDetails"
});

module.exports = {
  hostLogin: async (req, res) => {
          try {
            const schema = Joi.object({
              Email: Joi.string().required(),
              password: Joi.string().required(),
            });
            const payload = await helper.validationJoi(req.body, schema);
            const { Email, password } = payload;
            const hash = await argon2.hash(password);
            const host = await Models.userModel.create({ Email, password: hash });
            const hostUpdate = await Models.userModel.update(
              { role: 2 },
              { where: { id: host.id } },
            );
            const token = jwt.sign({ id: host.id }, process.env.SECRET_KEY);
            return res
              .status(200)
              .json({ message: "HOST LOGIN!", host, hostUpdate, token });
          } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "ERROR", error });
          }
        },
        hostProfile: async (req, res) => {
          try {
            const schema = Joi.object({
              name: Joi.string().required(),
              Email: Joi.string().required(),
              password: Joi.string().required(),
              phoneNumber: Joi.string().required(),
              location: Joi.string().required(),
            });
            const payload = await helper.validationJoi(req.body, schema);
            const { name, Email, password, phoneNumber, location } = payload;
            const hash = await argon2.hash(password);
            const file=req.files?.profileImage;
            const path=await commonHelper.fileUpload(file)
            const host = await Models.userModel.create({
              name,
              Email,
              password: hash,
              phoneNumber,
              location,
              profileImage:path
            });
            const phone = `+91${phoneNumber}`;
            const otp = await otpManager.sendOTP(phone);
            console.log(otp);
            const token = jwt.sign({ id: host.id }, process.env.SECRET_KEY);
            const updateHost = await Models.userModel.update(
              { role: 2 },
              { where: { id: host.id } },
            );
            return res
              .status(200)
              .json({ message: "HOST PROFILE", updateHost, token, host});
          } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "host profile", error });
          }
        },
        EditProfile:async(req,res)=>
        {
          try
          {
             const hostId=req.host.id;
             const{name,Email,phoneNumber,location}=req.body;
             const host=await Models.userModel.findOne({where:{id:hostId}})
             if(!host)
             {
              return res.status(404).json({message:"HOST NOT FOUND!"})
             }
             await Models.userModel.update({
              name,Email,phoneNumber,location
             },{where:{id:hostId}});
             const hostUpdate=await Models.userModel.findOne({where:{id:hostId}})
             return res.status(200).json({message:"HOST PROFILE EDITED!",hostUpdate})
          }
          catch(error)
          {
             console.log(error)
             return res.status(500).json({message:"ERROR",error})
          }
        },
        AccountDeleted:async(req,res)=>
        {
          try
           { 
             const hostId=req.host.id;
             const host=await Models.userModel.findOne({where:{id:hostId}})
             if(!host)
             {
              return res.status(404).json({message:"HOST NOT FOUND!"})
             }
             const deleteHost=await Models.userModel.destroy({where:{id:hostId}})
             return res.status(200).json({message:"HOST ACCOUNT DELETED!",deleteHost})
           }
           catch(error)
           {
            console.log(error)
            return res.status(500).json({message:"ERROR",error})
           }
        },
  fetchUser:async(req,res)=>
  {
    try
    {
       const user=await Models.userModel.findAll()
       return res.status(200).json({message:"USER DETAILS:",user})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  },
  viewUser:async(req,res)=>
  {
    try
    {
      const userId=req.user.id;
      const user=await Models.userModel.findOne({where:{id:userId}})
      if(!user)
      {
        return res.status(404).json({message:"USER NOT FOUND!"})
      }
      return res.status(200).json({message:"USER DETAIL:",user})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  },
  fetchBooking:async(req,res)=>
  {
    try
    {
      const booking=await Models.bookingModel.findAll()
      if(!booking)
      {
        return res.status(404).json({message:"BOOKING NOT FOUND"})
      }
      return res.status(200).json({message:"BOOKING DETAILS:",booking})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  },
 fetchSingleBooking:async(req,res)=>
 {
   try
   {
     const{bookingId}=req.body;
     const booking=await Models.bookingModel.findOne({id:bookingId})
     if(!booking)
     {
      return res.status(404).json({message:"BOOKING NOT FOUND"})
     }
     return res.status(200).json({message:"FETCH SINGLE BOOKING",booking})
   }
   catch(error)
   {
    console.log(error)
    return res.status(500).json({message:"ERROR",error})
   }
 },
 ActivityAdded:async(req,res)=>
 {
  try
  {
    const hostId=req.host.id;
    const{DateAndTime, Duration, hourlyRate,Tags, vibe,description,defaultCategory,fewWords,whatweDo}=req.body;
    const host=await Models.userModel.findOne({where:{id:hostId}})
    if(!host)
    { 
      return res.status(404).json({message:"HOST NOT FOUND!"})
    }
    const file=req.files?.uploadImage;
    if(!file)
    {
      return res.status(404).json({message:"FILE IS MISSING"})
    }
    const file1=req.files?.GovtId;
    if(file1)
    {
      return res.status(404).json({message:"FILE OF GOVT ID IS MISSING!"})
    }
    const path=await commonHelper.fileUpload(file);
    const path1=await commonHelper.fileUpload(file1)
    const activityAdded=await Models.activityModel.create({DateAndTime,Duration,hourlyRate,Tags,vibe,description,defaultCategory,fewWords,whatweDo})
    const activityImage=await Models.activityImages.create({activityId:activityAdded.id,uploadImage:path,GovtId:path1})
    return res.status(200).json({message:"ACTIVITY ADDED!",activityAdded,activityImage})
    
  }
  catch(error)
  {
    console.log(error);
    return res.status(500).json({message:"ERROR",error})
  }
 },
 editActivity:async(req,res)=>
 {
    try
    {
      const hostId=req.host.id;
     const{DateAndTime, Duration, hourlyRate,Tags, vibe,description,defaultCategory,fewWords,whatweDo,activityId}=req.body;
    const host=await Models.userModel.findOne({where:{id:hostId}})
    if(!host)
    { 
      return res.status(404).json({message:"HOST NOT FOUND!"})
    }
     const file=req.files?.uploadImage;
    if(!file)
    {
      return res.status(404).json({message:"FILE IS MISSING"})
    }
    const file1=req.files?.GovtId;
    if(file1)
    {
      return res.status(404).json({message:"FILE OF GOVT ID IS MISSING!"})
    }
    const path=await commonHelper.fileUpload(file);
    const path1=await commonHelper.fileUpload(file1);
    const activityUpdate=await Models.activityModel.update({DateAndTime, Duration, hourlyRate,Tags, vibe,description,defaultCategory,fewWords,whatweDo},{where:{id:activityId}})
    const activityImage=await Models.activityImages.update({uploadImage:path,GovtId:path1},{where:{id:activityId}})
    return res.status(200).json({message:"ACTIVITY UPDATED!",activityUpdate,activityImage})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
 },
 deleteActivity:async(req,res)=>
 {
  try
  {
    const{activityId}=req.body;
    const activity=await Models.activityModel.findOne({where:{id:activityId}})
    if(!activity)
    {
      return res.status(404).json({message:"ACTIVITY NOT FOUND!"})
    }
    const deleteActivity=await Models.activityModel.destroy({where:{activityId}})
    return res.status(200).json({message:"ACTIVITY DELETED!",deleteActivity})
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({message:"ERROR",error})
  }
 },
 BankDetails:async(req,res)=>
 {
  try
  {
    const hostId=req.host.id;
    const{BankName,BranchName,AccountNumber,IFSC}=req.body;
    const host=await Models.userModel.findOne({where:{id:hostId}})
    if(!host)
    {
      return res.status(404).json({message:"HOST NOT FOUND!"})
    }
    const BankDetails=await Models.transactionModel.create({BankName,BranchName,AccountNumber,IFSC,hostId})
    return res.status(200).json({message:"BANK DETAILS ADDED:",BankDetails})
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({message:"ERROR"})
  }
 },
 bookingAction:async(req,res)=>
 {
  try
  {
    const{bookingId,action}=req.body;
    const booking=await Models.bookingModel.findOne({where:{id:bookingId}})
    if(!booking)
    {
      return res.status(404).json({message:"BOOKING NOT FOUND!"})
    }
    if(booking.status==1)
    {
      return res.status(400).json({message:"BOOKING PENDING!"})
    }
    if(action==2)
    {
      booking.status=2
      await booking.save();
      return res.status(200).json({message:"BOOKING ACCEPTED"})
    }
    else if(action==5)
    {
      booking.status=5
      await booking.save();
      return res.status(400).json({message:"BOOKING CANCELLED"})
    }
    else
    {
      return res.status(400).json({message:"INVALID ACTION!"})
    }
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({message:"ERROR",error})
  }
 },
 UserDetails:async(req,res)=>
 {
  try
  {
   const userId=req.user.id;
   const userDetails=await Models.userModel.findOne({where:{id:userId},
    include:[
      {
         model: Models.bookingModel,
      as: "bookingDetails"
      }
    ]
   })
   if(!userDetails)
   {
    res.status(404).json({message:"USER NOT FOUND"})
   }
   return res.status(200).json({message:"USER DETAILS:",userDetails})
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({message:"ERROR",error})
  }
 },
 contactForm:async(req,res)=>
 {
  try
  {
    const schema=Joi.object({
      firstName:Joi.string().required(),
      email:Joi.string().required(),
      phoneNumber:Joi.string().required(),
      message:Joi.string().required()
    });
    const payload=await helper.validationJoi(req.body,schema);
    const contact=await Models.conatctUsModel.create({
      firstName:payload.firstName,
      email:payload.email,
      phoneNumber:payload.phoneNumber,
      message:payload.message
    });
    return res.status(200).json({message:"CONTACT FORM",contact})
  }
  catch(error)
  {
    console.log(error)
    return res.status(500).json({message:"ERROR",error})
  }
 }
};
