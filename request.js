const axios = require('axios');
const fs = require('fs');
// const url = "https://api.bilibili.com/x/space/arc/search";
const url = 'https://api.bilibili.com/x/space/acc/info';

function getResult(id) {
    axios.get(url, {params: {
        mid: +id,
        jsonp: 'jsonp'
    }})
        .then(res => {
            let result = id + ": " + res.data.data.name + '\n';
            fs.writeFileSync('test.txt', result)            
            // console.log(res.data.data.page)
            // res.data.data.page // count:一共有多少视频  pn:第几页（从1开始） ps:一页显示多少个视频
        })
        .catch(err => console.log(err))
}
module.exports = getResult