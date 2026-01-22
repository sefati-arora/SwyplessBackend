const express=require("express");
const hostController=require("../controller/hostController");
const {authentication}=require("../middleware/authentication")
const router=express.Router();
router.post('/hostLogin',hostController.hostLogin)
router.post('/hostProfile',hostController.hostProfile)
router.post('/EditProfile',authentication,hostController.EditProfile)
router.post('/AccountDeleted',authentication,hostController.AccountDeleted)
router.get('/fetchUser',authentication,hostController.fetchUser)
router.post('/viewUser',authentication,hostController.viewUser)
router.post('/faqAndHelp',authentication,hostController.faqAndHelp)
router.get('/fetchBooking',authentication,hostController.fetchBooking)
router.post('/ActivityAdded',authentication,hostController.ActivityAdded)
router.post('/editActivity',authentication,hostController.editActivity)
router.post('/deleteActivity',authentication,hostController.deleteActivity)
router.post('/subscriptionEdit',authentication,hostController.subscriptionEdit)
router.post('/subscriptionDeleted',authentication,hostController.subscriptionDeleted)
router.post('/BankDetails',authentication,hostController.BankDetails)
router.post('/bookingAction',authentication,hostController.bookingAction)
router.post('/UserDetails',authentication,hostController.UserDetails)
router.post('/contactForm',authentication,hostController.contactForm)
module.exports=router;