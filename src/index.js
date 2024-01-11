import 'dotenv/config'
import connectDb from "./db/index.js";



connectDb()
.then(()=>{
    app.listen(process.env.PORT || 3000 , ()=>{
        console.log(`App is listening on Port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGODb Connection failed !!",err);
})
  
