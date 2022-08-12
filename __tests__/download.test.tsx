import '@testing-library/jest-dom'
import path from 'node:path';
import { createMocks, RequestMethod, createResponse } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import download, { Params } from 'pages/api/download';
import request from 'supertest';
import axios from 'axios';


// Some requirements.
// 1. The program can accept a single URI or a list of URIs to download [/]
// 2. It should be possible to configure download location as well as number of retries.
// 2. It should support HTTP/HTTPS, FTP and SFTP
// 3. It should be extensible. Please pay attention to how new protocols can be added [/]
// 4. It should handle retries and partial downloads. If a file fails to fully download then the partial files must be deleted [/]
// 5. It should support parallel downloads
// 6. It should handle name clashes. If two different resources have the same name, both should download correctly. If the same resource is downloaded twice, it should overwrite the previous one 
// 7. Program architecture is important.
// 8. Don't forget about tests.

const httpURL = 'http://techslides.com/demos/sample-videos/small.mp4';
const httpsURL = 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg';
const ftpURL = 'ftp://ftp.dlptest.com/';

//   ftp://speedtest.tele2.net/100MB.zip
const sftpURL = 'sftp://itcsubmit.wustl.edu';
const fileURL = 'file:///home/user/Downloads/small.mp4';

let retries = 0;
let location = 'bin';
let options = {retries , location};

jest.setTimeout(15000);
jest.useFakeTimers();
// jest.mock('https');
jest.mock('axios');
const mockAxiosGet = jest.spyOn(axios, "get");

// const httpsGet = (https.get as unknown) as jest.Mock<unknown>;
// const axiosMock = (axios.get as unknown) as jest.Mock<unknown>;

describe('download API', () => {

  const mockRequestResponse = (method:RequestMethod = 'POST', body:Params ) =>  {
    const { req, res }: { req: NextApiRequest; res: NextApiResponse } = createMocks({ method });
    req.headers = {
      'Content-Type': 'application/json',
    };
    req.body = body;
    return { req , res };
  }

  afterEach(() => {
    jest.clearAllMocks();
  })


  it('should return 405 if not POST', async () => {
    let urls = [httpURL];
    let body = {urls, options};
    const { req  , res } = mockRequestResponse("GET", body );
    await download(req, res);
    expect(res.statusCode).toBe(405)
  })

  it('should failed if protocol is not supported', async () => {
    let urls = [fileURL];
    let body = {urls, options};
    const { req, res } = mockRequestResponse("POST", body);
    await download(req, res);  
    expect(res.statusCode).toBe(500)
  })

  it('download https url', async () => {
    // should download file to location
    // should respond with a 200 status code

    let urls = [httpsURL];
    let uri = path.join(location, 'pexels-photo-3184418.jpeg');
    let body = {urls, options};
    const { req, res } = mockRequestResponse("POST", body);

    download(req, res);
    // mockAxiosGet.mockResolvedValue(true)

    // Check if download success
    expect(res.statusCode).toBe(200);
    expect(res.statusMessage).toEqual('OK');

    // #TODO Check if file exists
    // const access_res = await fs.accessSync(uri, fs.constants.F_OK);
    // expect(access_res).toEqual(undefined); // denotes success
  })
  it('download https url with retries', async () => {
    // should failed in first attempt and then succeed
    // should respond with a 200 status code
    const axiosGetMock = jest.spyOn(axios,'get')


    let urls = [httpsURL];
    retries = 2;
    let uri = path.join(location, 'pexels-photo-3184418.jpeg');
    let body = {urls, options :{retries , location}};
    const { req } = mockRequestResponse("POST", body);
    const res = createResponse();

    while(retries > 1){
      res.statusCode = 500;
      res.statusMessage = 'Internal Server Error';
      download(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.statusMessage).toEqual('Internal Server Error');
      retries--;
    }

    res.statusCode = 200;
    res.statusMessage = 'OK';
    download(req, res);

    // Check if download success
    expect(res.statusCode).toBe(200);
    expect(res.statusMessage).toEqual('OK');
    expect(axiosGetMock).toHaveBeenCalledTimes(2);

    // #TODO Check if file exists
    // const access_res = await fs.accessSync(uri, fs.constants.F_OK);
    // expect(access_res).toEqual(undefined); // denotes success
  })
  it('supertest http', async () => {

    request('http://localhost:3000')
      .post('/api/download')
      .send({
        urls: [httpURL],
        options: {retries: 0, location: 'bin'}
      })
      .set('Content-Type', 'application/json')
      .expect(200)
  })

  it('supertest https', async () => {
    const root = __dirname.replace(path.basename(__dirname), '');

    console.log(root);
    console.log(require.resolve('pages/api/download'))

    let uri = path.join(root, location, 'pexels-photo-3184418.jpeg');

    const response =  await request('http://localhost:3000')
      .post('/api/download')
      .send({
        urls: [httpsURL],
        options: {retries: 0, location: 'bin'}
      })
      .set('Content-Type', 'application/json')
    
    expect(response.status).toEqual(200)
    // expect(response.body.data[0].uri).toEqual(uri);
  })

  it('supertest https', async () => {
    request('http://localhost:3000')
      .post('/api/download')
      .send({
        urls: [httpsURL],
        options: {retries: 0, location: '__tests__/bin'}
      })
      .set('Content-Type', 'application/json')
      .expect(200)
  })

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