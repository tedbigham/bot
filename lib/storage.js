/** A simple disk backed cache to keep stuff between runs */

var fs = require('fs');

function Storage(filename) {
    var self = this;
    this.filename = filename;
    initCache();

    /** if there's a local file, use it for the cache, otherwise make an empty one */
    function initCache() {
        try {
            var json = fs.readFileSync(self.filename);
            self.cache = JSON.parse(json);
        } catch(err) {
            self.cache = {};
        }
    };

    this.get = function(key) {
        return this.cache[key];
    };

    this.set = function(key, value) {
        this.cache[key] = value;
        fs.writeFileSync(this.filename, JSON.stringify(this.cache, null, 4));
    };
}

module.exports = Storage;