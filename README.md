This is a [Next.js](https://nextjs.org/) URL Downlaoder project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

Project requirements.
- [ ] 1. The program can accept a single URI or a list of URIs to download 
- [ ] 2. It should be possible to configure download location as well as number of retries.
- [ ] 3. It should support HTTP/HTTPS, FTP and SFTP 
- [ ] 4. It should be extensible. Please pay attention to how new protocols can be added
- [ ] 5. It should handle retries and partial downloads. If a file fails to fully download then the partial files must be deleted
- [ ] 6. It should support parallel downloads 
- [ ] 7. It should handle name clashes. If two different resources have the same name, both should download correctly. If the same resource is downloaded twice, it should overwrite the previous one
- [ ] 8. Program architecture is important.
- [ ] 9. Don't forget about tests.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to use
### From Webpage

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Enter url to be downloaded (ex : "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg")
Specify folder and number of retries and click download

### Using Postman

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Then run,

```bash
ngrok http 3000

Create a post request with body
```
{
    "urls":[< url1 >, < url2 >],
    "options":{
        "location":< folder name >,
        "retries:< number of retries >
    }
}

```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
