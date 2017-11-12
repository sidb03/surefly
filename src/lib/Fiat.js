const fetch = require('request-promise-native');
const Logger = require('./Logger');

const CACHE_AGE_LIMIT = 5 * 60 * 1000; // 5 minutes

let helpers = {};
let cachedAt = 0;

function _generateHelpers(rates) {
    for (let [code, rate] of Object.entries(rates)) {
        (function(code) {
            let fn = function(fiat) {
                if (fiat) {
                    return fiat / rates[code]
                } else {
                    return rates[code]
                }
            };
            fn.toEth = function(fiat) {
                return fiat / rates[code];
            };
            fn.fromEth = function(fiat) {
                return (fiat * rates[code]).toFixed(2);
            };
            helpers[code] = fn;
        })(code)
    }
}

class FiatService {
    constructor() {
        this.rates = {};
    }

    initialize(base_url) {
        this.base_url = base_url;

        this.getRates()
            .then(() => {
                Logger.info("Fiat: Rates initialized successfully");
            })
            .catch((err) => {
                Logger.error(err);
            });
    }

    _getUrl(path) {
        return this.base_url + path;
    }

    getRates() {

        Logger.info("Fiat: Fetching rates");
        return fetch(this._getUrl('/v1/rates/ETH'))
            .then((body) => {
                cachedAt = new Date().getTime();

                let obj = JSON.parse(body);
                for (let k in obj.rates) {
                    if (obj.rates.hasOwnProperty(k)) {
                        this.rates[k] = obj.rates[k];
                    }
                }

                _generateHelpers(this.rates);
                return helpers;
            })
            .catch((error) => {
                Logger.error("Fiat fetch error: " + error)
            })
    }

    fetch(limit=CACHE_AGE_LIMIT) {
        let now = new Date().getTime();
        if (now - cachedAt > limit) {
            return this.getRates()
        }
        else {
            Logger.debug("Fiat: Using cached rates");
            return Promise.resolve(helpers)
        }
    }
}

module.exports = new FiatService();
