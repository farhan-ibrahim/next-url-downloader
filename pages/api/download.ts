// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as ftp from "basic-ftp"
import fs from "fs";
import path from 'node:path';
import { retry } from '../lib/helper';
import axios, { AxiosResponse } from 'axios';


type Options = {
    retries?: number;
    location: string;
}

export type Params = {
    urls:string[]
    options:Options
}

type Data = {
  data?: any
  message?: string
  error?: string
}

type ActionResponse = {
    uri?:string,
    message?:string,
    status:"failed" | "success" | "pending",
}

const AcceptedProtocols = [ "http:", "https:" , "ftp:" , "sftp:"]

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
):any {
    if (req.method !== 'POST') {
        res.status(405).send({ message: 'Method not allowed' })
        return
    }

    const { urls , options  } = req.body as Params;
    const location = options.location;

    if(urls.length <= 0){
        res.status(400).json({
            error: 'urls is empty'
        })
        return;
    }

    const getFTPFile = async (url:URL, folder:string , fileName:string ):Promise<ActionResponse>=> {
        return new Promise(async (resolve, reject) => {
            const client = new ftp.Client()
            client.ftp.verbose = true;
            const destination = path.resolve(folder, fileName);

    
            try {
                await client.access({
                    'host': url.host,
                    'user': 'dlpuser' ,// url.username,
                    'password': 'rNrKYTX9g7z3RgJRmxWuGHbeu' //url.password,
                });
                await client.downloadTo(destination, fileName);
                resolve({
                    uri: destination,
                    status:"success"
                })
            }
            catch(err) {
                console.error(err)
                reject({
                    status:"failed"
                })
            }finally{
                client.close();
            }
        })
    }

    const getFile = async (url:string , folder:string , fileName:string , callback?:() => void) => {
        return new Promise(async (resolve, reject) => {
            try{
                const response = await axios.get(url, {
                    responseType: 'stream'
                })
    
                if(response && response.status === 200){
                    const destination = path.resolve(folder, fileName);
                    const folderPath = path.resolve(folder);
                    const ext = path.extname(fileName);
                    const fileNameWithoutExt = path.basename(fileName, ext);
            
                    // Check if file already exists
                    if(fs.existsSync(destination) && fs.statSync(destination).isFile()) {
                        // Download file with different name
                        const tempName = `${fileNameWithoutExt}-${Date.now()}.${ext}`;
                        const newDestination = path.resolve(folder, tempName);
                        const writeStream = fs.createWriteStream(newDestination);
                        response.data.pipe(writeStream);
            
                        // Check if it's the same file
                        writeStream.on("finish", () => {
                            const newBuf = fs.readFileSync(newDestination);
                            const oldBuf = fs.readFileSync(destination);
            
                            if(newBuf.equals(oldBuf)) {
                                // Remove file if it already exists
                                fs.unlinkSync(destination);
            
                                // Rename temporary file to destination
                                fs.renameSync(newDestination, destination);
                            }
                        })
                        
                    // Check if folder exists. If not, create it.
                    }else if (!fs.existsSync(folderPath)) {
                        fs.mkdirSync(folderPath);
                    }
                    
                    const writeStream = fs.createWriteStream(destination);
                    response.data.pipe(writeStream);
            
                    writeStream.on("finish", () => {
                        writeStream.close(callback);
                    });
                    resolve(true)
                }
            }catch(err){
                reject(false)
            }
            
        })
    }    
 
    const actions:Promise<boolean>[] = urls.map((url:string) => {
        return new Promise(async (resolve , reject) => {
            let tries = options.retries || 0;
            let u = new URL(url);
            const fileName = path.basename(url);
            
            if(!AcceptedProtocols.includes(u.protocol)){
                reject(false)
                // throw Error(`Protocol ${u.protocol} is not supported`)
            }

            if(u.protocol === "ftp:"){
                return await getFTPFile(u , location , fileName) ;
            }

            return await getFile(url , location , fileName) ;
        })
        // return getFile(u).catch((err) => retry(tries, () => getFile(u)))
    })


    return Promise.all(actions).then(data => {
        console.log("actions" , actions, data.forEach(d => console.log(d)))

        res.status(200).json({ 
            data,
            message: 'download completed'
        })
        // console.log("success" , res.statusCode, res.statusMessage)
    }).catch((err:any) => {
        res.status(500).json({
            error: 'download failed' + err
        })
        // console.log("error" , res.statusCode , res.statusMessage)
    }) 

    
}
