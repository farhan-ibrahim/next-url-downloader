export async function retry(maxRetries:number, fn:()=>Promise<any>):Promise<any> {
    try {
        return await fn();
    } catch (err) {
        if (maxRetries <= 0) {
            throw err;
        }
        return await retry(maxRetries - 1, fn);
    }
}