// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as ftp from "basic-ftp"
import fs from "fs";
import path from 'node:path';
import { retry } from '../lib/helper';
import axios, { AxiosResponse } from 'axios';


type Options = {
    retries?: number;
    location? : string;
}

export type Params = {
    urls:string[]
    options:Options
}

type Data = {
    status:number,
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
        res.status(405).send({ 
            status:res.statusCode,
            error:'Method not allowed' 
        })
        return
    }

    const { urls , options  } = req.body as Params;
    const location = options.location || "download";
    let retries = options.retries || 0;

    if(urls.length <= 0){
        res.status(400).json({
            status:res.statusCode,
            error: 'urls is empty'
        })
        return;
    }

    const getFTPFile = async (url:URL, folder:string , fileName:string):Promise<ActionResponse>=> {
        return new Promise(async (resolve, reject) => {
            const client = new ftp.Client()
            client.ftp.verbose = true;
            const destination = path.resolve(folder, fileName);

            try {
                await client.access({
                    'host': url.host,
                    'user': url.username,  // 'dlpuser'
                    'password': url.password, //'rNrKYTX9g7z3RgJRmxWuGHbeu',
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
 
    const actions:Promise<any>[] = urls.map((url:string) => {

        return new Promise(async (resolve , reject) => {
            let u = new URL(url);
            const fileName = path.basename(url);
            const uri = path.resolve(__dirname, location, fileName)
            const callback = () => resolve({uri, status:"success"})

            
            if(!AcceptedProtocols.includes(u.protocol)){
                reject({message:`Protocol ${u.protocol} is not supported`, status:"failed"})
            }

            if(u.protocol === "ftp:"){
                return await getFTPFile(u , location , fileName).catch((err) => 
                retry(retries, () => getFTPFile(u , location , fileName))
            )}

            return await getFile(url , location , fileName , callback ).catch((err) => 
                retry(retries, () => getFile(url , location , fileName , callback))
            );
        })
    })


    return Promise.all(actions).then(data => {
        res.status(200).json({ 
            data,
            message:res.statusMessage,
            status:res.statusCode
        })
    }).catch((err:any) => {
        res.status(500).json({
            status:res.statusCode,
            error: 'Error:' + err.message
        })
    })     
}
