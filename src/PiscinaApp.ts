import { Worker } from 'worker_threads';
import { Workers } from './WorkersPath';
import Piscina from 'piscina';

function chunkify(array:number[], n: number): number[][] {
    console.log(`Splitting working in ${n} chunks`);
    let chunks: number[][] = [];
    for (let i = n; i > 0; i--) {
        chunks.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return chunks;
}

function run(jobs:number[], concurrentWorkers: number): Promise<number> {
    console.log('Initiating Job execution');
    const chunks: number[][] = chunkify(jobs, concurrentWorkers);    
    let completedWorkers: number = 0;
    console.log('Executing job.');    
    const startedAt: number = performance.now();        
    return new Promise<number>((resolve, reject) => {
        const startedAt: number = performance.now();
        chunks.forEach(async (data: number[], i:number) => {
            console.log(`Creating worker ${i + 1}`);
            const piscina:Piscina = new Piscina({filename:Workers.PISCINA_COUNT_WORKER});
            await piscina.run({jobs:data, id: i+1 }, {name:'executeJob'});
            if (++completedWorkers === concurrentWorkers) {
                const finisedAt: number = performance.now();
                const elapsedTime = finisedAt - startedAt;
                console.log(`${concurrentWorkers} took ${elapsedTime}`);
                resolve(elapsedTime);
            }               
        });
    });
    
}

interface Config {
    jobSizes:number[];
    cores:number[];
    executions:number;
}

function createJobs(jobSizes:number[]): number[][] {
    let count:number = 0;
    const jobs:number[][] = Array.from({length:jobSizes.length}, () => {
        const job:number[] = Array.from({length:100}, () => jobSizes[count]);
        count++;
        return job;
    });
    return jobs;
}

async function execute(config:Config): Promise<void> {
    const jobs:number[][] = createJobs(config.jobSizes);
    const executionResults:ExecutionResult[] = [];
    for (let cores of config.cores) {
        console.log('-------------------------------------------');
        console.log(`Starting execution for cores: ${cores}`);
        for (let job of jobs) {
            console.log('__________________________________________');
            console.log(`Executing for jobs ${job[0]}`);
            const result:ExecutionResult = new ExecutionResult(cores, job[0]);
            executionResults.push(result);
            for (let executionCount = 0; executionCount < config.executions; executionCount++) {
                console.log('****************************************');
                console.log(`Running execution ${executionCount + 1}`);
                const tempJob:number[] = Array.from(job);
                const duration = await run(tempJob, cores);
                result.executionTimes.push(duration);
            }
        }    
    }
    executionResults.forEach(r => printResults(r));
    process.exit();
}

function printResults(result:ExecutionResult): void {
    console.log('###################################');
    console.log(`Execution with ${result.cores} with job size ${result.jobSize} took on average ${result.averageTime}`);
    
}

class ExecutionResult {
    public readonly executionTimes:number[] = [];

    constructor(
        public readonly cores:number,
        public readonly  jobSize:number
    ) {}

    public get averageTime():number {
        if (this.executionTimes.length === 0) {
            return 0;
        }
        return this.executionTimes.reduce((partialSum, value) => partialSum + value, 0);
    }
}

const config:Config = {
    cores:[1, 2, 4, 8],
    jobSizes:[1e6],
    executions:1
};

execute(config);
