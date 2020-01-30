const child_process = require('child_process');
const numCPUs = require('os').cpus().length;

child_process.fork('./producer.js');

for (let i = 0; i < numCPUs; i++) {
    child_process.fork('./consumer.js');
}