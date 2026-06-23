import  express from 'express'
import morgan from 'morgan'
import fs, { read } from 'fs'

const WORK_DIR = "/workspace"
const app = express()

app.use(morgan("dev"))
app.get('/health',(req,res)=>{
    res.status(200).json({
        message:"Ok"
    })
})

app.get('/list-files',async (req,res)=>{
    const elements  = await fs.promises.readdir(WORK_DIR)

    res.status(200).json({
        message:"All elements in the working directory",
        elements
    })
})


export default app