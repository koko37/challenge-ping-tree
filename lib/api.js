var sendJson = require('send-data/json')
var body = require('body/json')
var redis = require('./redis')
var Target = require('./target')
const conn = new Target(redis, redis.print)

exports.index = function(req, res, opts, cb) {
  conn.all((data) => {
    sendJson(req, res, {
      data
    })
  })
}

exports.create = function(req, res, opts, cb) {
  body(req, res, function(err, data) {
    if(err) return cb(err)

    conn.addNew(data)
    sendJson(req, res, {
      result: 'OK'
    })
  })
}

exports.show = function(req, res, opts, cb) {

}

exports.update = function(req, res, opts, cb) {

}

exports.route = function(req, res, opts, cb) {

}