const jwt = require("jsonwebtoken");
const Joi = require("joi");
const Models = require("../models/index");
const helper = require("../helper/validation");
const commonHelper = require("../helper/commonHelper");
const argon2 = require("argon2");
const fileUpload = require("express-fileupload");
const otpManager = require("node-twillo-otp-manager")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  process.env.TWILIO_SERVICE_SID,
);
module.exports = {
  adminLogin: async (req, res) => {
    try {
      const schema = Joi.object({
       phoneNumber:Joi.string().required(),
       countryCode:Joi.string().required()
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { phoneNumber,countryCode} = payload;
      const admin = await Models.userModel.create({ phoneNumber,countryCode });
      await Models.userModel.update(
        { role: 3 },
        { where: { id: admin.id } },
      );
      const adminUpdate = await Models.userModel.findOne({where:{id:admin.id}})
      const token = jwt.sign({ id: admin.id }, process.env.SECRET_KEY);
      return res
        .status(200)
        .json({ message: "ADMIN LOGIN!", admin, adminUpdate, token });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  adminProfile: async (req, res) => {
  try {
   
    const adminId = req.user.id;
    const { name, Email, location } = req.body;

    const admin = await Models.userModel.findOne({
      where: { id: adminId, role: 3 },
    });

    if (!admin) {
      return res.status(404).json({ message: "ADMIN NOT FOUND!" });
    }
    const file=req.files?.profileImage;
    const path=await commonHelper.fileUpload(file);
    await Models.userModel.update(
      { name, Email, location , profileImage:path},
      { where: { id: adminId } }
    );

    const updatedAdmin = await Models.userModel.findOne({
      where: { id: adminId },
    });

    return res.status(200).json({
      message: "ADMIN PROFILE COMPLETED",
      updatedAdmin,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "admin profile error", error });
  }
},
  EditAdminProfile: async (req, res) => {
    try {
      const adminId = req.user.id;
      const { name, Email, phoneNumber, location } = req.body;
      const admin = await Models.userModel.findOne({ where: { id: adminId } });
      if (!admin) {
        return res.status(404).json({ message: "ADMIN NOT FOUND!" });
      }
      await Models.userModel.update(
        {
          name,
          Email,
          phoneNumber,
          location,
        },
        { where: { id: adminId } },
      );
      const adminUpdate = await Models.userModel.findOne({
        where: { id: adminId },
      });
      return res
        .status(200)
        .json({ message: "ADMIN PROFILE EDITED!", adminUpdate });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  adminAccountDeleted: async (req, res) => {
    try {
      const adminId = req.admin.id;
      const admin = await Models.userModel.findOne({ where: { id: adminId } });
      if (!admin) {
        return res.status(404).json({ message: "ADMIN NOT FOUND!" });
      }
      const deleteadmin = await Models.userModel.destroy({
        where: { id: adminId },
      });
      return res
        .status(200)
        .json({ message: "ADMIN ACCOUNT DELETED!", deleteadmin });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },

  subscriptionCreated: async (req, res) => {
    try {
      const schema = Joi.object({
        title: Joi.string().required(),
        Amount: Joi.string().required(),
        description: Joi.string().required(),
        subscriptionType: Joi.number().required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { subscriptionType } = payload;
      const startDate = new Date();
      let endDate = new Date(startDate);
      if (subscriptionType == 1) {
        endDate.setDate(startDate.getDate() + 7);
        console.log("WEEKLY SUBSCRIPTION!");
      } else if (subscriptionType == 2) {
        endDate.setDate(startDate.getMonth() + 1);
      } else {
        endDate.setDate(startDate.getFullYear() + 1);
      }
      const objToSave = {
        title: payload.title,
        Amount: payload.Amount,
        description: payload.description,
        subscriptionType,
        startDate,
        endDate,
      };
      const subCreated = await Models.subscriptionModel.create(objToSave);
      return res
        .status(200)
        .json({ message: "SUBSCRIPTION CREATED!", subCreated });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  fetchSubscription:async(req,res)=>
  {
    try
    {
      const sub=await Models.subscriptionModel.findAll()
      if(!sub)
      {
        return res.status(404).json({message:"SUBSCRIPTION NOT FOUND!"})
      }
      return res.status(200).json({message:"SUBSCRIPTION FETCH!",sub})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR"})
    }
  },
  SubscriptionView:async(req,res)=>
  {
      try
      {
        const{id}=req.body;
        const subView=await Models.subscriptionModel.findOne({where:{id}})
        if(!subView)
        {
          return res.status(404).json({message:"SUB NOT FOUND!"})
        }
        return res.status(200).json({message:"SUBSCRIPTION VIEW",subView})

      }
      catch(error)
      {
        console.log(error)
        return res.status(500).json({message:"ERROR",error})
      }
  },
  subscriptionEdit: async (req, res) => {
    try {
      const { id, title, Amount, description, subscriptionType } =
        req.body;
      const sub = await Models.subscriptionModel.findOne({
        where: { id},
      });
      if (!sub) {
        return res.status(200).json({ message: "SUBSCRIPTION NOT FOUND!" });
      }
      await Models.subscriptionModel.update(
        { title, Amount, description, subscriptionType },
        { where: { id } },
      );
      const updatedSubscription = await Models.subscriptionModel.findOne({
        where: { id },
      });
      return res
        .status(200)
        .json({ message: "SUBSCRIPTION UPDATED!", updatedSubscription });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  subscriptionDeleted: async (req, res) => {
    try {
      const {id} = req.body;
      console.log(">>",req.body)
      const sub = await Models.subscriptionModel.findOne({
        where: { id },
      });
      if (!sub) {
        return res.status(404).json({ message: "SUBSCRIPTION NOT FOUND!" });
      }
      const deleteSub = await Models.subscriptionModel.destroy({
        where: { id},
      });
      return res
        .status(200)
        .json({ message: "SUBSCRIPTION DELETED!", deleteSub });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR" });
    }
  },
  userFetch: async (req, res) => {
    try {
      const user = await Models.userModel.findAll();
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      return res.status(200).json({ message: "USER DATA:", user });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  editUserProfile: async (req, res) => {
    try {
      const {id, name, email, phoneNumber, location } = req.body;
      const user = await Models.userModel.findOne({ where: { id} });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      await Models.userModel.update(
        { name, email, phoneNumber, location },
        { where: { id } },
      );
      const userUpdate = await Models.userModel.findOne({
        where: { id },
      });
      return res.status(200).json({ message: "USER EDIT", userUpdate });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  deleteUserProfile: async (req, res) => {
    try {
      const {id} = req.body;
      const user = await Models.userModel.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND" });
      }
      const deleteUser = await Models.userModel.destroy({
        where: { id},
      });
      return res
        .status(200)
        .json({ message: "USER DELETED BY ADMIN", deleteUser });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  userView:async(req,res)=>
  {
    try
    {
      const{id}=req.body;
      const user=await Models.userModel.findOne({where:{id}})
      if(!user)
      {
        return res.status(404).json({message:"user not found!"})
      }
      return res.status(200).json({message:"USER FOUND!",user})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR!",error})
    }
  },
  fetchBooking:async(req,res)=>
  {
    try
    {
      const booking=await Models.bookingModel.findAll()
      return res.status(200).json({message:"FECTH ALL BOOKING:",booking})
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({message:"ERROR",error})
    }
  },
  viewBooking:async(req,res)=>
  {
    try
    {
       const{bookingId}=req.body;
       const booking=await Models.bookingModel.findOne({where:{id:bookingId}})
       if(!booking)
       {
        return res.status(404).json({message:"BOOKING NOT FOUND"})
       }
       return res.status(200).json({message:"BOOKING VIEW:",booking})
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({message:"ERROR",error})
    }
  },
  deleteBooking:async(req,res)=>
  {
    try
    {
        const{id}=req.body;
        const booking=await Models.bookingModel.findOne({where:{id}})
        if(!booking)
        {
            return res.status(404).json({message:"BOOKING NOT FOUND"})
        }
        const deleteBooking=await Models.bookingModel.destroy({where:{id}})
        return res.status(200).json({message:"BOOKING DELETED",deleteBooking})
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({message:"ERROR",error})
    }
  },
  updateBooking:async(req,res)=>
  {
    try
    {
     const{id,
        DateandTime,
        duration,
        meetingType,
        location,
        comment}=req.body;
        const booking=await Models.bookingModel.findOne({where:{id}})
        if(!booking)
        {
            return res.status(404).json({message:"BOOKING NOT FOUND"})
        }
        await Models.bookingModel.update({
        DateandTime,
        duration,
        meetingType,
        location,
        comment},{where:{id}})
        const update=await Models.bookingModel.findOne({where:{id}})
        return res.status(200).json({message:"BOOKING UPDATED!",update})
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({message:"ERROR",error})
    }
  },
  hostFetch:async(req,res)=>
  {
    try
    {
      const hostId=req.user.id;
      const host=await Models.userModel.findOne({where:{id:hostId}})
      if(!host)
      {
        return res.status(404).json({message:"USER NOT FOUND!"})
      }
      return res.status(200).json({message:"HOST FETCH SUCCESSFULLY!",host})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  },
   dashBoardDetails:async(req,res)=>
   {
    try
    {
       const user=await Models.userModel.count({where:{role:1}});
       const booking=await Models.bookingModel.count({where:{isBookingCompleted:1}})
       const host=await Models.userModel.count({where:{role:2}})
       return res.status(200).json({message:"DASHBOARD DETAILS:",user,booking,host})
    }
    catch(error)
    {
      console.log(error)
      return res.status(200).json({message:"ERROR!",error})
    }
   },
     faqAndHelp: async (req, res) => {
    try {
      const schema = Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { question, answer } = payload;
      const faq = await Models.faqAndHelpModel.create({ question, answer });
      return res.status(200).json({ message: "FAQANDHELP:", faq });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  faqEdit:async(req,res)=>
  {
    try
    {
     const{id,question,answer}=req.body;
      const faqCreation=await Models.faqAndHelpModel.findOne({where:{id}})
      if(!faqCreation)
      {
        return res.status(404).json({message:"FAQ NOT FOUND!"})
      }
      await Models.faqAndHelpModel.update({
        question,answer
      },{where:{id}})
      const update=await Models.faqAndHelpModel.findOne({where:{id}})
      return res.status(200).json({message:"FAQ UPDATED!",update})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  },
  faqDeleted:async(req,res)=>
  {
    try
    {
      const{id}=req.body;
      const faqDeleted=await Models.faqAndHelpModel.findOne({where:{id}})
      if(!faqDeleted)
      {
        return res.status(404).json({message:"FAQ NOT FOUND!"})
      }
      const deleteFaq=await Models.faqAndHelpModel.destroy({where:{id}})
      return res.status(200).json({message:"FAQ DELETED!",faqDeleted,deleteFaq})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR!",error})
    }
  },
  fetchFaq:async(req,res)=>
  {
    try
    {
      const faq=await Models.faqAndHelpModel.findAll()
      if(!faq)
      {
        return res.status(404).json({message:"FAQ NOT FOUND"})
      }
      return res.status(200).json({message:"FETCH FAQ:",faq})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  },
  faqView:async(req,res)=>
  {
    try
    {
      const{id}=req.body;
      const faqView=await Models.faqAndHelpModel.findOne({where:{id}})
      if(!faqView)
      {
        return res.status(404).json({message:"FAQ NOT FOUND!"}) 
      }
      return res.status(200).json({message:"FAQ VIEW:",faqView})
   }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR!",error})
    }
  }
};
