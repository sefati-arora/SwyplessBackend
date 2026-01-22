require("dotenv").config();
const Models = require("../models/index");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const helper = require("../helper/validation");
const commonHelper = require("../helper/commonHelper");
const argon2 = require("argon2");
const stripe = require("stripe")(process.env.STRIPE_SK);
const otpManager = require("node-twillo-otp-manager")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  process.env.TWILIO_SERVICE_SID,
);

module.exports = {
login: async (req, res) => {
  try {
    const schema = Joi.object({
      Email: Joi.string().email().required(),
      password: Joi.string().required(),
    });
    const payload = await helper.validationJoi(req.body, schema);
    const { Email, password } = payload;
    const user = await Models.userModel.findOne({
      where: { Email }
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }
    const isPasswordValid = await argon2.verify(
      user.password,
      password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }
    const token = jwt.sign(
      { id: user.id },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );
    return res.status(200).json({
      message: "Login successful",
      user,
      token
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "ERROR",
      error
    });
  }
},
  signUp: async (req, res) => {
    try {
      const schema = Joi.object({
        name: Joi.string().required(),
        Email: Joi.string().required(),
        password: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        location: Joi.string().required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { password, phoneNumber,Email } = payload;
      const hash = await argon2.hash(password);
      const file = req.files?.profileImage;
      const path = await commonHelper.fileUpload(file);
       const customer = await stripe.customers.create({
        description: "anything",
        email: Email,
      });
      const user = await Models.userModel.create({
        name: payload.name,
        Email,
        password: hash,
        phoneNumber,
        location: payload.location,
        profileImage: path,
        customerId:customer.id
      });
      const phone = `+91${phoneNumber}`;
      const otp = await otpManager.sendOTP(phone);
      console.log(otp);
      const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
      const update = await Models.userModel.update(
        { role: 1 },
        { where: { id: user.id } },
      );
      console.log(update);
      return res.status(200).json({ message: "SIGN UP:", user, token });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  profileSetUp: async (req, res) => {
    try {
      const userId = req.user.id;
      console.log(userId);
      const { age, tagLine, gender, shortBio, interests } = req.body;
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND" });
      }
      await Models.userModel.update(
        { age, tagLine, gender, shortBio, interests },
        { where: { id: userId } },
      );
      const updateUser = await Models.userModel.findOne({
        where: { id: userId },
      });
      return res.status(200).json({ message: "PROFILE SET UP!", updateUser });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  editUserProfile: async (req, res) => {
    try {
      const userId = req.user?.id; 
      console.log(">>>",req.user.id)
      const { name, Email, phoneNumber, location, age, shortBio, interests } =req.body;
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        console.log("NOT FOUND");
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      const file = req.files?.profileImage;
      const path = await commonHelper.fileUpload(file);
      await Models.userModel.update(
        {
          name,
          Email,
          phoneNumber,
          location,
          profileImage: path,
          age,
          shortBio,
          interests,
        },
        { where: { id: userId } },
      );
      const updateUser = await Models.userModel.findOne({
        where: { id: userId },
      });
      console.log(">>>",userId)
      return res.status(200).json({ message: "PROFILE UPDATED!", updateUser});
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  fetchProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      return res.status(200).json({ message: "USER PROFILE:", user });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  reSetPassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { password } = req.body;
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      const hash = await argon2.hash(password);
      await Models.userModel.update(
        { password: hash },
        { where: { id: userId } },
      );
      const userUpdate = await Models.userModel.findOne({
        where: { id: userId },
      });
      return res.status(200).json({ message: "password restored", userUpdate });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  forgetPassword: async (req, res) => {
    try {
      const schema = Joi.object({
        email: Joi.string().required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { email } = payload;
      const user = await Models.userModel.findOne({ where: { email } });
      if (!user) {
        return res.status(200).json({
          message: "If the email exists, a reset link has been sent",
        });
      }
      const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
      return res.status(200).json({ message: "FORGET PASSWORD", user, token });
    } catch (error) {
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  accountDelete: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      const userDelete = await Models.userModel.destroy({ id: userId });
      return res.status(200).json({ message: "DELETE ACCOUNT", userDelete });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  BookingCreation: async (req, res) => {
    try {
      const userId = req.user.id;
      console.log(">>",userId)
      const {
        providerId,
        activityID,
        DateandTime,
        duration,
        meetingType,
        location,
        comment,
        latitude,
        longitude,
      } = req.body;
      console.log(">>",activityID)
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      const activity = await Models.activityModel.findOne({
        where: { id: activityID },
      });
      if (!activity) {
        return res.status(404).json({ message: "ACTIVIES NOT FOUND!" });
      }
      const booking = await Models.bookingModel.create({
        userId,
        providerId,
        activityID,
        DateandTime,
        duration,
        meetingType,
        location,
        comment,
        latitude,
        longitude,
      });
      const notify = await Models.notificationModel.create({
        receiverId: user.id,
        message: "BOOKING CREATED!",
      });
      return res
        .status(200)
        .json({ message: "BOOKING CREATED!", booking, notify });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  fetchBooking: async (req, res) => {
    try {
      const { bookingId } = req.body;
      const booking = await Models.bookingModel.findOne({
        where: { id: bookingId },
      });
      if (!booking) {
        return res.status(404).json({ message: "BOOKING NOT FOUND!" });
      }
      return res.status(200).json({ message: "BOOKING DETAILS:", booking });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  activityReview: async (req, res) => {
    try {
      const userId = req.user.id;
      const { bookingId, rating, message,activityId} = req.body;
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      const booking = await Models.bookingModel.findOne({
        where: { id: bookingId },
      });
      if (!booking) {
        return res.status(404).json({ message: "BOOKING NOT FOUND" });
      }
      const activity=await Models.activityModel.findOne({where:{id:activityId}})
      if(!activity)
      {
        return res.status(404).json({message:"ACTIVITY NOT FOUND!"})
      }
      const review = await Models.reviewModel.create({
        userId,
        bookingId,
        activityId,
        rating,
        message,
      });
      return res
        .status(200)
        .json({ message: "ACTIVITY REVIEW SUBMITTED!", review });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  countReview: async (req, res) => {
    try {
      const { activityId } = req.body;
      const reviewCount = await Models.reviewModel.count({
        where: { activityId },
      });
      if (reviewCount == 0) {
        return res.status(404).json({ message: "REVIEW NOT FOUND!" });
      }
      return res.status(200).json({ message: "REVIEW COUNT:", reviewCount });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  countRating: async (req, res) => {
    try {
      const { activityId,rating } = req.body;
      const review = await Models.reviewModel.count(activityId, rating);
      if (!review) {
        return res.status(404).json({ message: "REVIEW RATING NOT FOUND!" });
      }
      return res.status(200).json({ message: "COUNT RATING:", review });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  disputeCreate: async (req, res) => {
    try {
      const userId = req.user.id;
      const { bookingId, message } = req.body;
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      const booking = await Models.bookingModel.findOne({
        where: { id: bookingId },
      });
      if (!booking) {
        return res.status(404).json({ message: "BOOKING NOT FOUND" });
      }
      const file = req.files?.file;
      const path = await commonHelper.fileUpload(file);
      const disputeCreate = await Models.disputeModel.create({
        userId,
        bookingId,
        uploadImages: path,
        message,
      });
      return res
        .status(200)
        .json({ message: "DISPUTE CREATED!", disputeCreate });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  activityCreated: async (req, res) => {
    try {
      const userId=req.user.id;
      const user=await Models.userModel.findOne({where:{id:userId}})
      if(!user)
      {
        return res.status(404).json({message:"USER NOT FOUND"})
      }
      const schema = Joi.object({
        DateAndTime: Joi.string().required(),
        Duration: Joi.string().required(),
        hourlyRate: Joi.string().required(),
        Tags: Joi.string().required(),
        vibe: Joi.string().required(),
        description: Joi.string().required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const objToSave = {
        userId,
        DateAndTime: payload.DateAndTime,
        Duration: payload.Duration,
        hourlyRate: payload.hourlyRate,
        Tags: payload.Tags,
        vibe: payload.vibe,
        description: payload.description,
      };
      const activityCreated = await Models.activityModel.create( objToSave );
      return res
        .status(200)
        .json({ message: "ACTIVITY CREATED!", activityCreated });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  activityDetails: async (req, res) => {
    try {
      const { activityId } = req.body;
      const activity = await Models.activityModel.findOne({
        where: { id: activityId },
      });
      if (!activity) {
        return res.status(404).json({ message: "ACTIVITY NOT FOUND!" });
      }
      return res.status(200).json({ message: "ACTIVITY DETAILS:", activity });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  clearNotification: async (req, res) => {
    try {
      const { notificationId } = req.body;
      const Notify = await Models.notificationModel.findOne({
        where: { id: notificationId },
      });
      if (!Notify) {
        return res.status(404).json({ message: "NOTIFICATION NOT FOUND!" });
      }
      const deleteNotification = await Models.notificationModel.destroy({
        where: { id: notificationId },
      });
      return res
        .status(200)
        .json({ message: "NOTIFICATION CLEAR", deleteNotification });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  reportCreation: async (req, res) => {
    try {
      const schema = Joi.object({
        reportTo: Joi.string().required(),
        reportFrom: Joi.string().required(),
        comment:Joi.string().required()
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { reportTo, reportFrom,comment } = payload;
      const report = await Models.reportModel.create({
        reportTo,
        reportFrom,
        comment
      });
      return res.status(200).json({ message: "REPORT CREATED:", report });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  paymentCOD: async (req, res) => {
    try {
      const userId = req.user.id;
      const { bookingId, currency, Amount } = req.body;
      console.log(">>>>",bookingId)
      const user = await Models.userModel.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      console.log("><><><><><><><>",user)
      const booking = await Models.bookingModel.findOne({
        where: { id: bookingId },
      });
      console.log(">>><<><><><>",booking)
      if (!booking) {
        return res.status(404).json({ message: "BOOKING NOT FOUND!" });
      }
      const payment = await Models.transactionModel.create({
        userId,
        bookingId,
        currency,
        Amount,
      });
      const updatePaymentCOD = await Models.transactionModel.update(
        { paymentStatus: 1, paymentMethod: 1 ,status:1},
        { where: { id: payment.id } },
      );
      const notification = await Models.notificationModel.create({
        receiverId: user.id,
        message: "PAY YOUR BOOKING AMOUNT AFTER COMPLETION ",
      });
      const update=await Models.bookingModel.update({isBookingCompleted:1},{where:{id:bookingId}})
      return res
        .status(200)
        .json({
          message: "PAYMENT COD CREATED:",
          payment,
          updatePaymentCOD,
          notification,update
        });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  createStripe:async(req,res)=>
  {
    try
    {
      let response=
      {
        SK:process.env.STRIPE_SK,
        PK:process.env.STRIPE_PK 
      }
      return res.status(200).json({message:"STRIPE CREATED:",response})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  },
  createCard:async(req,res)=>
  {
    try
    {
      let response=await commonHelper.createcard(
        req.user.customerId,
        "tok_visa"
      )
      if(!response)
      {
        return res.status(400).json({message:"ERROR WHILE CREATION"})
      }
      return res.status(200).json({message:"CARD CREATED:",response})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  },
   getToken: async (req, res) => {
    try {
      const token = { id: "tok_visa" };
      console.log("TEST CARD", token.id);
      return res.status(200).json({ message: "TOKEN", token });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR" });
    }
  },
    cardList: async (req, res) => {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: req.user.customerId,
        type: "card",
      });
      const customer = await stripe.customers.retrieve(req.user.customerId);
      const defaultpaymentMethodId =
        customer.invoice_settings.default_payment_method;
      console.log("defaultpayment", defaultpaymentMethodId);
      const cardsWithDefaultFlag = paymentMethods.data.map((card) => {
        const isDefault = card.id === defaultpaymentMethodId;
        console.log(`Card ID: ${card.id}, Is Default: ${isDefault}`);
        return {
          ...card,
          isDefault,
        };
      });
      return res
        .status(200)
        .json({ message: "CARD LIST:", cardsWithDefaultFlag });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  createPayment:async(req,res)=>
  {
    try
    {
       const{Amount,cardId}=req.body;
       const response=await stripe.paymentIntents.create({
          amount: parseInt(Amount * 100),
        currency: "usd",
        customer: req.user.customerId,
        payment_method: cardId,
        confirm: true,
        return_url: "http://localhost:3000/users/cmcUser",
       });
       return res.status(200).json({message:"PAYMENT CREATED:",response})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  },
  createPaymentIntent:async(req,res)=>
  {
    try
    {
      let userData=await Models.userModel.findOne({where:{id:req.user.id}});
      const stripeCustomerId=userData.customerId;
      const ephemeralKey = await stripe.ephemeralKeys.create(
        {
          customer: stripeCustomerId,
        },
        { apiVersion: "2023-10-16" }
      );
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(req.body.Amount) * 100,
        currency: "usd",
        customer: stripeCustomerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });
        let result=
        {
            paymentIntent:paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer:userData.customerId,
            publishableKey:process.env.STRIPE_PK,
            transactionId:paymentIntent.id,
        };
        const {bookingId}=req.body;
        const bookingDetails=await Models.bookingModel.findOne({where:{id:bookingId}})
        let objToSave=
        {
          userId:req.user.id,
          bookingId:bookingDetails.id,
          Amount:req.body.amount,
          chargeAmount: req.body.chargeAmount,
        transactionId: paymentIntent.id,
        description: `You received ${parseInt(req.body.amount)} $`,
        }
        const PaymentDetails=await Models.transactionModel.create(objToSave);
        const UpdateTransaction=await Models.transactionModel.update({paymentStatus:2,paymentMethod:2},{where:{id:PaymentDetails.id}})  
        const notification=await Models.notificationModel.create({
          receiverId:userData.id,
          message:"PAYMENT DONE!"
        })
        const bookingData=await Models.bookingModel.update({isBookingCompleted:1},{where:{id:bookingId}})
        return res.status(200).json({message:"PAYMENT DATA:",PaymentDetails,bookingData,result,notification,UpdateTransaction})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  },
  paymentHistroy:async(req,res)=>
  {
    try
    {
      const payment=await Models.transactionModel.findAll()
      return res.status(200).json({message:"TRANSACTION HISTORY",payment})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR",error})
    }
  }
};
