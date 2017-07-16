'use strict';

/**
 *
 * @type {MessageGenerator}
 */
module.exports = class MessageGenerator {
    constructor(MessageModel, msg, Promise, MarkovGen, Sequelize, winston) {
        this.winston = winston;
        this.winston.add(winston.transports.File, {filename: 'logs/markov.log'});
        this.Sequelize = Sequelize;
        this.MarkovGen = MarkovGen;
        this.Promise = Promise;
        this.MessageModel = MessageModel;
        this.msg = msg;
    }

    /**
     *
     * @param {*} names
     * @returns {Promise}
     */
    get(names) {
        const regex = /[^a-zA-Zа-яА-я]+/g;
        const t = this;
        let constr = [];
        let debug = {msg: this.msg};
        let Message = this.MessageModel.getModel();
        let m = [];
        let words = this.msg.text.split(' ');
        words = words.filter(function (item) {
            return item.length > 3 && names.indexOf(item.toLowerCase()) === -1;
        });
        words = words.map(function (x) {
            return x.replace(regex, '');
        });
        debug.parsedWords = words;
        words.forEach(function (word) {
            constr.push({$like: '%' + word + '%'})
        });

        debug.query = constr;

        return new t.Promise(function (fulfill, reject) {
            Message.findAll({
                where: {body: {$or: constr}},
                limit: 100,
                order: t.Sequelize.literal('RAND()'),
                attributes: ['body']
            }).then(Messages => {
                Messages.forEach(function (item) {
                    m.push(item.body)
                });
                debug.messages = m;

                if (m.length > 1) {
                    let markov = new t.MarkovGen({
                        input: m,
                        minLength: 4
                    });
                    let str = markov.makeChain(4);
                    debug.result = str;
                    fulfill(str);
                } else {
                    reject(false);
                    debug.result = false;
                    t.winston.warn('Мало данных');
                }
                t.winston.log('info', debug);
            });
        });
    }
};