// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as ftp from "basic-ftp"
import https from "https";
import http from "http";
import fs from "fs";
import path from 'node:path';


type Options = {
    retries?: number;
    location?: string;
}

type Params = {
    urls:string[]
    options:Options
}

type Data = {
  data?: any
  message?: string
  error?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    const { urls , options  } = req.body as Params;
    const location = options.location || "Downloads";

    if(urls.length <= 0){
        res.status(400).json({
            error: 'urls is empty'
        })
        return;
    }

    const downloadFTP = async (url:URL, folder:string , fileName:string ) => {
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
                    uri: url.href,
                    message:"ftp download complete"
                })
            }
            catch(err) {
                console.log(err)
                reject()
            }finally{
                client.close();
            }
        })
    }

    const downloadFile = (res:http.IncomingMessage , folder:string , fileName:string, callback:() => void) => {
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
            res.pipe(writeStream);

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
        res.pipe(writeStream);

        writeStream.on("finish", () => {
            writeStream.close(callback);
           
        });
    }

    const downloadHTTPS = async (url:URL, folder:string , fileName:string ) => {
        return new Promise((resolve, reject) => {
            try{
                https.get(url, (res) => downloadFile(res, folder, fileName, () =>resolve({
                    uri: url.href,
                    message:"http download complete"
                })))
                  
            }catch(err) {
                console.log(err)
                reject()
            }
        })
    }

    const downloadHTTP = async (url:URL, folder:string , fileName:string ) => {
        return new Promise((resolve, reject) => {
            try{
                http.get(url, (res) => {
                    downloadFile(res, folder, fileName, () =>resolve({
                        uri: url.href,
                        message:"http download complete"
                    }))
                })
            }catch(err) {
                console.log(err)
                reject()
            }
        })
    }
        
 
    const actions = urls.map(async (url:string) => {
        let u = new URL(url);
        const fileName = path.basename(url);

        switch(u.protocol){
            case "ftp:": return await downloadFTP(u , location , fileName) ;
            case "https:": return await downloadHTTPS(u , location , fileName) ; 
            case "http:": return await downloadHTTP(u , location , fileName) ; 
            case "sftp": return await downloadHTTPS(u , location , fileName) ; 
            default: return new Promise(rejects => rejects({
                error: 'protocol is not supported'
            }))
        }

       
    })

    let tries = options.retries || 0;
    Promise.all(actions).then(data => {
        res.status(200).json({ 
            data,
            message: 'download completed'
        })
    }).catch(err => {
        if(tries > 0){
            tries--;
            return handler(req, res);
        }else{
            res.status(500).json({
                error: 'download failed' + err
            })
        }
        
    })  
}
