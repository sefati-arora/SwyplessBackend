const Sequelize=require("sequelize");
const sequelize=require('../config/connectdb').sequelize;

module.exports=
{
    userModel:require('./userModel')(Sequelize,sequelize,Sequelize.DataTypes),
     activityModel:require('./activityModel')(Sequelize,sequelize,Sequelize.DataTypes),
     activityImages:require('./activityImages')(Sequelize,sequelize,Sequelize.DataTypes),
    bookingModel:require('./bookingModel')(Sequelize,sequelize,Sequelize.DataTypes),
    reviewModel:require('./reviewModel')(Sequelize,sequelize,Sequelize.DataTypes),
    notificationModel:require('./notificationModel')(Sequelize,sequelize,Sequelize.DataTypes),
    reportModel:require('./reportModel')(Sequelize,sequelize,Sequelize.DataTypes),
    disputeModel:require('./disputeModel')(Sequelize,sequelize,Sequelize.DataTypes),
    transactionModel:require('./transactionModel')(Sequelize,sequelize,Sequelize.DataTypes),
    conatctUsModel:require('./conatctUsModel')(Sequelize,sequelize,Sequelize.DataTypes),
    messageModel:require('./messageModel')(Sequelize,sequelize,Sequelize.DataTypes),
    chatModel:require('./chatModel')(Sequelize,sequelize,Sequelize.DataTypes),
    subscriptionModel:require('./subscriptionModel')(Sequelize,sequelize,Sequelize.DataTypes),
    faqAndHelpModel:require('./faqAndHelpModel')(Sequelize,sequelize,Sequelize.DataTypes)
   
}