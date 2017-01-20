rp = require('request-promise');

function register(config, next) {
    var options = {
        method: 'POST',
        uri: config.authService,
        body: {
            "firstName":"Ted",
            "lastName":"Bigham",
            "username":config.username,
            "email":"z4_" + config.username + "@tedbigham.com",
            "password":'password',
            "bot":true,
            "tester": true
        },
        json: true
    };

    console.log('registering ' + config.username + " at " + options.uri);
    rp(options)
        .then(function(response) {
            console.log(response);
            //var response = JSON.stringify(responseJson);
            if (response.status == 'ok') {
                next(null, response);
            } else {
                next(response.status);
            }
            //{"status":"ok","userID":"af1f5dc0-dc58-11e6-8a5c-56847afe9799","sessionID":"<long token string>"}
        })
        .catch(function (err) {
            console.log(err);
            next(err);
        });
}

module.exports = register;
