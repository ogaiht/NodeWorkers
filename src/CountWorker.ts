import { parentPort, workerData } from "worker_threads";

parentPort?.on('message', data => {
    console.log(`Worker ${data.id} started.`);
    for (let job of data.jobs) {
        let count:number = 0;
        for (let i = 0; i < job; i++) {
            count++;
        }    
    }
    console.log(`Worker ${data.id} finished.`);
    parentPort?.postMessage('done');
});