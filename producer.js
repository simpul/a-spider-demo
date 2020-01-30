const redis = require('redis');
const bluebird = require('bluebird');
const EventEmitter = require('events');
const { startId, endId, proThreshold, proInspect } = require('./config');

let client = redis.createClient('6379', '127.0.0.1');
// 使用bluebird将redis的API转换成Promise形式
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

client.on('error', error => {
    console.log('Producer redis client error:', error);
    process.exit();
})
client.on('ready', async () => {
    console.log('Producer redis client ready');
    let length = await getListLength();
    let currentID = await client.lpopAsync("mqTest");
    if (currentID) {
        producer.id = currentID
    }
    if (length < proThreshold) {
        producer.emit('run')
    }
})

class Producer extends EventEmitter { // 需要事件处理机制
    constructor() {
        super();
        this.status = 'ready';
        this.id = startId;
    }
}
let producer = new Producer();

// 暂停生产
producer.on('pause', () => {
    if (producer.status === 'run') {
        producer.status = 'pause';
        console.log('Producer will pause, current id', producer.id);
    }
});

// 恢复生产
producer.on('resume', () => {
    if (producer.status === 'pause') {
        console.log('Producer will continue');
        producer.status = 'run';
        producer.emit('run');
    }
});

// 正在进行生产
producer.on('run', async () => {
    producer.status = 'run';
    while(true) {
        if (producer.status === 'pause') {
            break;
        }
        let id = producer.id;
        await client.lpushAsync('test', id);
        producer.id++;
        if (producer.id > endId) {
            // 已完成生产指标
            console.log('Finish the producer target, will exit process')
            process.exit();
        }
    }
});

// 监听缓冲区长度，超过阈值停止生产
setInterval(async () => {
    let length = await getListLength();

    // 超出阈值则停止生产
    if (length > proThreshold && producer.status === 'run') {
        producer.emit('pause');
    }

    // 消耗完毕低于阈值则重新开始生产
    if (length < proThreshold && producer.status === 'pause') {
        producer.emit('resume')
    }

    if (length < proThreshold && producer.status === 'ready') {
        producer.emit('run')
    }

}, proInspect);

async function getListLength() {
    let length = await client.llenAsync('test');
    return length;
}