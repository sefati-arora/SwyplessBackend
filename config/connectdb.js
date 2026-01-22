const Sequelize=require('sequelize');
const sequelize=new Sequelize("swyplessDB","root","password",
    {
        host:"localhost",
        dialect:"mysql"
    }
);
const connectdb=async()=>
{
    await sequelize .authenticate().then(
        async()=>
        {
            await sequelize.sync({alter:false});
            console.log("Database connected and sync")
        }
    ).catch((error)=>
    {
        console.log("error while connecting DB",error)
    }
)
}

module.exports=
{
    connectdb:connectdb,
    sequelize:sequelize
}