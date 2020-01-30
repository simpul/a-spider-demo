const fs = require('fs');

module.exports = (data) => {
    fs.writeFileSync('test.txt', data + '\n', {flag: 'a'})
}