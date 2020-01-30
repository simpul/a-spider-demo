const redis = require('redis');
const bluebird = require('bluebird');
const EventEmitter = require('events');
const handle = require('./test');
const { conInspect, conThreshold } = require('./config');

let client = redis.createClient('6379', '127.0.0.1');
// 使用bluebird将redis的API转换成Promise形式
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

client.on('error', error => {
    console.log('Consumer redis client error:', error);
    process.exit();
})
client.on('ready', () => {
    console.log('Consumer redis client ready');
    consumer.emit('run');
})

class Consumer extends EventEmitter {
    constructor() {
        super();
        this.status = 'ready'
    }
}

let consumer = new Consumer();
consumer.on('run', async () => {
    consumer.status = 'run';
    while(true) {
        let length = await getListLength();
        if (length) {
            // 缓冲区有内容时 (这里可以进行批量的爬虫行为)
            // let value = await client.rpopAsync('test');
            // handle(value);
        } else {
            // 缓冲区没有内容时，暂停消耗
            consumer.emit('pause')
            break;
        }
    }
})
consumer.on('resume', () => {
    if (consumer.status === 'pause') {
        consumer.status = 'run'
        consumer.emit('run')
    }
})
consumer.on('pause', () => {
    consumer.status = 'pause'
    console.log('consumer has paused');
})

setInterval(async () => {
    let length = await getListLength();
    if (length > conThreshold && consumer.status === 'pause') { // 等缓冲区积累到阈值的时候再继续消耗
        consumer.emit('resume')
    }
}, conInspect);

async function getListLength() {
    let length = await client.llenAsync('test');
    return length;
}