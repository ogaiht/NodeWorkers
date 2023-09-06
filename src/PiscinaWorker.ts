export interface JobParams {
    jobs:number[],
    id:number
}

export async function executeJob(jobParams:JobParams): Promise<void> {
    console.log(`Worker ${jobParams.id} started.`);
    for (let job of jobParams.jobs) {
        let count:number = 0;
        for (let i = 0; i < job; i++) {
            count++;
        }    
    }
    console.log(`Worker ${jobParams.id} finished.`);
}