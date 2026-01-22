module.exports=(Sequelize,sequelize,DataTypes)=>
{
    return sequelize.define(
        "bookingTable",
       { 
         ...require('./core')(Sequelize,DataTypes),
         userId:
         {
            type:Sequelize.UUID,
            allowNull:true,
            references:
            {
                model:"userTable",
                key:"id"
            },
            onUpdate:"CASCADE",
            onDelete:"CASCADE"
         },
             providerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "userTable",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
         activityID:
         {
            type:Sequelize.UUID,
            allowNull:true,
            references:
            {
                model:"activityTable",
                key:"id"
            },
            onUpdate:"CASCADE",
            onDelete:"CASCADE"
         },
       
         DateandTime:
         {
            type:DataTypes.STRING(225),
            allowNull:true
         },
         duration:
         {
            type:DataTypes.STRING(225),
            allowNull:true
         },
         meetingType:
         {
            type:DataTypes.INTEGER,
            allowNull:true,
            defaultValue:0  //1 for office and 2 from online
         },
         location:
         {
            type:DataTypes.STRING(225),
            allowNull:true
         },
         comment:
         {
            type:DataTypes.STRING(225),
            allowNull:true
         },
         latitude:
         {
            type:DataTypes.STRING(225),
            allowNull:true,
            defaultValue:null
         },
         longitude:
         {
            type:DataTypes.STRING(225),
            allowNull:true,
            defaultValue:null
         },
         status:
         {
            type:DataTypes.INTEGER,
            allowNull:true,
            defaultValue:1  //1 for pending 2 for accepted 3 for completed 4 for rejected 5 for cancelled
         },
         isBookingCompleted:
         {
            type:DataTypes.INTEGER,
            allowNull:true,
            defaultValue:0  //0 for not and 1 for yes
         }
    },
    {
        tableName:"bookingTable"
    }
       
    )
}