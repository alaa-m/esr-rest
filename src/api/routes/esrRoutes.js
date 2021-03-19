'use strict';
module.exports = function(app) {
    var esr = require('../controllers/esrController')

    app.route('/esr')
    .get(esr.getInfo);

    app.route('/esr/decode')
    .post(esr.decodeEsr)

    app.route('/esr/encode')
    .post(esr.encodeEsr)

}