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
        Email: Joi.string().required(),
        password: Joi.string().required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { Email, password } = payload;
      const hash = await argon2.hash(password);
      const admin = await Models.userModel.create({ Email, password: hash });
      const adminUpdate = await Models.userModel.update(
        { role: 3 },
        { where: { id: admin.id } },
      );
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
      const file = req.files?.profileImage;
      const path = await commonHelper.fileUpload(file);
      const admin = await Models.userModel.create({
        name,
        Email,
        password: hash,
        phoneNumber,
        location,
        profileImage: path,
      });
      const phone = `+91${phoneNumber}`;
      const otp = await otpManager.sendOTP(phone);
      console.log(otp);
      const token = jwt.sign({ id: admin.id }, process.env.SECRET_KEY);
      const updateadmin = await Models.userModel.update(
        { role: 3 },
        { where: { id: admin.id } },
      );
      return res
        .status(200)
        .json({ message: "ADMIN PROFILE", updateadmin, token, admin });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "admin profile", error });
    }
  },
  EditAdminProfile: async (req, res) => {
    try {
      const adminId = req.admin.id;
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
  subscriptionEdit: async (req, res) => {
    try {
      const { subscriptionId, title, Amount, description, subscriptionType } =
        req.body;
      const sub = await Models.subscriptionModel.findOne({
        where: { id: subscriptionId },
      });
      if (!sub) {
        return res.status(200).json({ message: "SUBSCRIPTION NOT FOUND!" });
      }
      await Models.subscriptionModel.update(
        { title, Amount, description, subscriptionType },
        { where: { id: subscriptionId } },
      );
      const updatedSubscription = await Models.subscriptionModel.findOne({
        where: { id: subscriptionId },
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
      const { subscriptionId } = req.body;
      const sub = await Models.subscriptionModel.findOne({
        where: { id: subscriptionId },
      });
      if (!sub) {
        return res.status(404).json({ message: "SUBSCRIPTION NOT FOUND!" });
      }
      const deleteSub = await Models.subscriptionModel.destroy({
        where: { id: subscriptionId },
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
      const userId = req.user.id;
      const { name, email, phoneNumber, location } = req.body;
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      await Models.userModel.update(
        { name, email, phoneNumber, location },
        { where: { id: userId } },
      );
      const userUpdate = await Models.userModel.findOne({
        where: { id: userId },
      });
      return res.status(200).json({ message: "USER EDIT", userUpdate });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  deleteUserProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND" });
      }
      const deleteUser = await Models.userModel.destroy({
        where: { id: userId },
      });
      return res
        .status(200)
        .json({ message: "USER DELETED BY ADMIN", deleteUser });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
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
        const{bookingId}=req.body;
        const booking=await Models.bookingModel.findOne({where:{id:bookingId}})
        if(!booking)
        {
            return res.status(404).json({message:"BOOKING NOT FOUND"})
        }
        const deleteBooking=await Models.bookingModel.destroy({where:{id:bookingId}})
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
     const{bookingId,activityID,
        DateandTime,
        duration,
        meetingType,
        location,
        comment,
        latitude,
        longitude}=req.body;
        const booking=await Models.bookingModel.findOne({where:{id:bookingId}})
        if(!booking)
        {
            return res.status(404).json({message:"BOOKING NOT FOUND"})
        }
        const activity=await Models.activityModel.findOne({where:{id:activityID}})
        if(!activity)
        {
            return res.status(404).json({message:"ACTIVITY NOT FOUND"})
        }
        await Models.bookingModel.update({activityID,
        DateandTime,
        duration,
        meetingType,
        location,
        comment,
        latitude,
        longitude},{where:{id:bookingId}})
        const update=await Models.bookingModel.findOne({where:{id:bookingId}})
        return res.status(200).json({message:"BOOKING UPDATED!",update})
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({message:"ERROR",error})
    }
  }
};
