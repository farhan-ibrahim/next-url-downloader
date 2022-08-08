// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as ftp from "basic-ftp"
import https from "https";
import http from "http";
import fs from "fs";


type Options = {
    retries?: number
    location?: string
}

type Params = {
    urls:string[]
    options:Options
}

type Data = {
  uri?: string
  message?: string
  error?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    const { urls , options} = req.body as Params;
    const location = options.location || "./Downloads/";

    if(urls.length <= 0){
        res.status(400).json({
            error: 'urls is empty'
        })
        return;
    }

    const downloadFTP = async (url:URL, writeStream:string , fileName:string ) => {
        return new Promise(async (resolve, reject) => {
            const client = new ftp.Client()
            client.ftp.verbose = true
    
            try {
                await client.access({
                    'host': url.host,
                    'user': 'dlpuser' ,// url.username,
                    'password': 'rNrKYTX9g7z3RgJRmxWuGHbeu' //url.password,
                });
                await client.downloadTo(writeStream, fileName);
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

    const downloadHTTPS = async (url:URL, writeStream:string , fileName:string ) => {
        return new Promise((resolve, reject) => {
            try{
                https.get(url, (res) => {
                    const path = fileName;
                    const writeStream = fs.createWriteStream(path);
                    res.pipe(writeStream);
    
                    writeStream.on("finish", () => {
                        writeStream.close();
                    });
                    resolve({
                        uri: url.href,
                        message:"https download complete"
                    })
                })
            }catch(err) {
                console.log(err)
                reject()
            }
        })
    }

    const downloadHTTP = async (url:URL, writeStream:string , fileName:string ) => {
        return new Promise((resolve, reject) => {
            try{
                http.get(url, (res) => {
                    const path = fileName;
                    const writeStream = fs.createWriteStream(path);
                    res.pipe(writeStream);
    
                    writeStream.on("finish", () => {
                        writeStream.close();
                    });
                    resolve({
                        uri: url.href,
                        message:"http download complete"
                    })
                })
            }catch(err) {
                console.log(err)
                reject()
            }
        })
    }
        


    const downloadFile = async (url:string) => {
        let u = new URL(url);
        const fileName = u.pathname.split('/').pop() || "index.html";
        switch(u.protocol){
            case "ftp:": return await downloadFTP(u , location , fileName) ;
            case "https:": return await downloadHTTPS(u , location , fileName) ; 
            case "http:": return await downloadHTTP(u , location , fileName) ; 
            case "sftp": return await downloadHTTPS(u , location , fileName) ; 
            default: return new Promise(rejects => rejects({
                error: 'protocol is not supported'
            }))
        }
    }
 
    const actions = urls.map(downloadFile)

    Promise.all(actions).then(results => {
        console.log(results)
        res.status(200).json({ 
            uri: 'https://test.com' ,
            message: 'download complete'
        })
    }).catch(err => {
        console.log(err)
        res.status(500).json({
            error: 'download failed'
        })
    })
}
