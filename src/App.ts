import { Worker } from 'worker_threads';
import { Workers } from './WorkersPath';
import { WorkState } from './WorkState';

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
    return new Promise<number>((resolve, reject) => {
        const startedAt: number = performance.now();
        chunks.forEach((data: number[], i:number) => {
            console.log(`Creating worker ${i + 1}`);
            const worker: Worker = new Worker(Workers.COUNT_WORKER);
            worker.postMessage({ jobs: data, id: i + 1});        
            worker.on('message', msg => {
                if (msg === WorkState.DONE) {
                    console.log(`Worker ${i + 1} is done.`);
                    if (++completedWorkers === concurrentWorkers) {
                        const elapsedTime = performance.now() - startedAt;
                        console.log(`${concurrentWorkers} took ${elapsedTime}`);
                        resolve(elapsedTime);
                    }
                }
            });
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
    return Array.from({length:jobSizes.length}, () => {
        const job:number[] = Array.from({length:100}, () => jobSizes[count]);
        count++;
        return job;
    });    
}

async function execute(config:Config): Promise<void> {
    const jobs:number[][] = createJobs(config.jobSizes);
    const executionResults:ExecutionResult[] = [];
    for (let i = 0; i < config.cores.length; i++) {    
        console.log('-------------------------------------------');
        console.log(`Initiating execution for cores: ${config.cores[i]}`);
        for (let j = 0; j < jobs.length; j++) {
            const result:ExecutionResult = new ExecutionResult(config.cores[i], jobs[j][0]);
            executionResults.push(result);
            for (let executionCount = 0; executionCount < config.executions; executionCount++) {
                const job:number[] = Array.from(jobs[j]);
                console.log('#######################################');
                console.log(`Cores ${config.cores[i]}, Job Size ${job.length} x ${job[0]} Running execution ${executionCount + 1}`);
                const duration: number = await run(job, config.cores[i]);
                result.times.push(duration);
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
    public readonly times:number[] = [];

    constructor(
        public readonly cores:number,
        public readonly  jobSize:number
    ) {}

    public get averageTime():number {
        if (this.times.length === 0) {
            return 0;
        }
        return this.times.reduce((partialSum, value) => partialSum + value, 0);
    }
}

const config:Config = {
    cores:[1, 2, 4, 8, 16],
    jobSizes:[1e9],
    executions:1
};

execute(config);