import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState } from 'react'
import styles from '../styles/Home.module.css'
import Item from './components/Item'

const Home: NextPage = () => {
  const httpURL = 'http://techslides.com/demos/sample-videos/small.mp4';
  const httpsURL = 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg';
  const ftpURL = 'ftp://ftp.dlptest.com/';
  const sftpURL = 'sftp://itcsubmit.wustl.edu';

  const [ urls, setUrls ] = useState<string[]>(["",]);
  const [ retries , setRetries ] = useState<number>(0);
  const [ location , setLocation ] = useState<string>('downloads');
  const [ progress , setProgress] = useState<number>(0);

  const onAddNewUrl = () => {
    setUrls([...urls, '']);
  }

  const onRemoveUrl = () => {
    setUrls(urls.slice(0, urls.length - 1));
  }

  const onClickDownload = async () => { 
    try{
      const res = await fetch('/api/download',{
        method: 'POST',
        headers:{
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          urls,
          options:{
            retries,
            location,
          }
        }),
      })
  
      const data = await res.json();
    }catch(err){
      console.error(err)
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Next URL Downloader</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h3 className={styles.title}>
          Welcome to<br/>URL Downloader
        </h3>

        {urls.map((url , index) => {
          const onChange = (text:string) => {
            const newUrls = [...urls];
            newUrls[index] = text;
            setUrls(newUrls);
          }

          return(
            <Item 
              key={index.toString()}
              index={index}
              url={url}
              isLast={index === urls.length - 1}
              multiple={urls.length > 1}
              onChange={onChange} // Require regex to validate url
              onAdd={onAddNewUrl}
              onRemove={onRemoveUrl}         
            />
          )
        })}
        <div className={styles.item}>
          <label >Folder Name</label>
          <input 
            className={styles.input}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className={styles.item}>
          <label >No of retries :</label>
          <input 
            className={styles.input}
            value={retries.toString()}
            onChange={e => setRetries(Number(e.target.value))}
          />
        </div>
        <button className={styles.button} onClick={onClickDownload} >Download</button>
        <button className={styles.button} >Pause</button>
        <button className={styles.button} >Cancel</button>
       
       
    
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}

export default Home

