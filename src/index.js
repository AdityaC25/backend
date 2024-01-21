import dotenv from "dotenv"
import connectDb from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path:"./.env"
})



connectDb()
.then(()=>{
     
    app.on("Error",(error)=>{
        console.log("ERRR" ,error);
        throw error;
    })

    app.listen(process.env.PORT || 3000 , ()=>{
        console.log(`App is listening on Port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGODb Connection failed !!",err);
})
  
