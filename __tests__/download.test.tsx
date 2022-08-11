import '@testing-library/jest-dom'
import path from 'node:path';
import { createRequest , createMocks, RequestMethod } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import handler, { Params } from 'pages/api/download';
import fs from "fs";
import fsp from 'fs/promises';
import https from 'https';
import http from 'http';
import axios from 'axios';
import { waitFor } from '@testing-library/react';


// Some requirements.
// 1. The program can accept a single URI or a list of URIs to download
// 2. It should be possible to configure download location as well as number of retries.
// 2. It should support HTTP/HTTPS, FTP and SFTP
// 3. It should be extensible. Please pay attention to how new protocols can be added
// 4. It should handle retries and partial downloads. If a file fails to fully download then the partial files must be deleted
// 5. It should support parallel downloads
// 6. It should handle name clashes. If two different resources have the same name, both should download correctly. If the same resource is downloaded twice, it should overwrite the previous one
// 7. Program architecture is important.
// 8. Don't forget about tests.

const httpURL = 'http://techslides.com/demos/sample-videos/small.mp4';
const httpsURL = 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg';
const ftpURL = 'ftp://ftp.dlptest.com/';
const sftpURL = 'sftp://itcsubmit.wustl.edu';
const fileURL = 'file:///home/user/Downloads/small.mp4';

let retries = 0;
let location = '__tests__/bin';
let options = {retries , location};

jest.setTimeout(15000);
jest.useFakeTimers();
// jest.mock('https');
jest.mock('axios');
const mockAxiosGet = jest.spyOn(axios, "get");

// const httpsGet = (https.get as unknown) as jest.Mock<unknown>;
// const axiosMock = (axios.get as unknown) as jest.Mock<unknown>;


describe('Download test', () => {

  const mockRequestResponse = (method:RequestMethod = 'POST', body:Params ) =>  {
    const { req, res }: { req: NextApiRequest; res: NextApiResponse } = createMocks({ method });
    req.headers = {
      'Content-Type': 'application/json',
    };
    req.body = body;
    return { req , res };
  }


  it('should return 405 if not POST', async () => {
    let urls = [httpURL];
    let body = {urls, options};
    const { req  , res } = mockRequestResponse("GET", body );
    await handler(req, res);
    expect(res.statusCode).toBe(405)
  })

  it('should failed if not protocol not supported', async () => {
    let urls = [fileURL];
    let body = {urls, options};
    const { req, res } = mockRequestResponse("POST", body);
    await handler(req, res);
    expect(res.statusCode).toBe(500)
  })

  it('download https url', async () => {
    // should download file to location
    // should respond with a 200 status code

    let urls = [httpsURL];
    let uri = path.join(location, 'pexels-photo-3184418.jpeg');
    let body = {urls, options};
    const { req, res } = mockRequestResponse("POST", body);

    handler(req, res);
    // mockAxiosGet.mockResolvedValue(true)

    // Check if download success
    expect(res.statusCode).toBe(200);
    expect(res.statusMessage).toEqual('OK');

    // Check if file exists
    // const access_res = await fs.accessSync(uri, fs.constants.F_OK);
    // expect(access_res).toEqual(undefined); // denotes success
  })

  // it('download http url', async () => {
  //   const urls = [httpURL];
  //   const body = {urls, options};
  //   const uri = path.join(location, 'small.mp4');
  //   const { req, res } = mockRequestResponse("POST", body);

  //   await handler(req, res);

  //   // Check if download success
  //   expect(res.statusCode).toBe(200);
  //   expect(res.statusMessage).toEqual('OK');

  //   // Check if file exists
  //   // const access_res = await fs.accessSync(fileDownloadPath, fs.constants.F_OK);
  //   // expect(access_res).toEqual(undefined); // denotes success
  // })

  // it('download ftp url', async () => {
  //   let urls = [ftpURL];
  //   let body = {urls, options};
  //   const { req, res } = mockRequestResponse("POST", body);
  //   await handler(req, res);

  //   // Check if download success
  //   expect(res.statusCode).toBe(200);
  //   expect(res.statusMessage).toEqual('OK');

  //   // Check if file exists
  //   // const access_res = await fs.access(fileDownloadPath, fs.constants.F_OK);
  //   // expect(access_res).toEqual(undefined); // denotes success
  // })
})