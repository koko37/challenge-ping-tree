var sendJson = require('send-data/json')
var body = require('body/json')
var redis = require('./redis')
var Target = require('./target')
const conn = new Target(redis, redis.print)

exports.index = async function (req, res, opts, cb) {
  const data = await conn.all()
  if (data) return sendJson(req, res, { data })

  res.statusCode = 500
  sendJson(req, res, { error: 'redis connection' })
}

exports.create = function (req, res, opts, cb) {
  body(req, res, async function (err, data) {
    if (err) return cb(err)

    const result = await conn.addNew(data)
    sendJson(req, res, { result })
  })
}

exports.show = function (req, res, opts, cb) {
  conn.findById(opts.params.id, (data) => {
    sendJson(req, res, { data })
  })
}

exports.update = function (req, res, opts, cb) {
  body(req, res, async function (err, data) {
    if (err) return cb(err)

    const result = await conn.update(opts.params.id, data)
    sendJson(req, res, { result })
  })
}

exports.route = function (req, res, opts, cb) {
  body(req, res, async function (err, data) {
    if (err) return cb(err)

    const targets = await conn.filter(data)
    if (targets.length === 0) {
      return sendJson(req, res, { decision: 'reject' })
    }
    await conn.accept(targets[0].id, data.timestamp)
    sendJson(req, res, { url: targets[0].url })
  })
}
