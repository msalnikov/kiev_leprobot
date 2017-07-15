const Promise = require('promise');
const request = require('request');
const winston = require('winston');
const UrlShorter = require('node-url-shorter');

module.exports = class NewsGenerator {
    get() {
        winston.info('Loading news');
        return new Promise(function (fulfill, reject) {
            request({uri: 'https://www.ukr.net/news/dat/kiev/1/', method: 'GET', encoding: 'binary'},
                function (err, res, page) {
                    let result = [];
                    let json = JSON.parse(page);
                    let tops = json.tops;
                    winston.info('Start: ' + tops.length);
                    tops = tops.filter(function (top) {
                        return typeof top.Dups !== 'undefined';
                    });
                    winston.info('End: ' + tops.length);
                    tops.forEach(function (topic) {
                        UrlShorter
                            .getShortUrl(topic.Url)
                            .then(function(data){
                                console.log('getShortUrl success = ', data);
                            });
                        result.push({title: topic.Title, link: topic.Url})
                    });
                    result = result.slice(0,10);
                    winston.info(result.length);
                    fulfill(result);
                });
        });
    }
};