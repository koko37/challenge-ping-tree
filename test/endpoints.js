process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')
var server = require('../lib/server')
var redis = require('../lib/redis')
var Target = require('../lib/target')
const conn = new Target(redis, redis.print)

const targetSample = {
  url: 'http://example.com',
  value: 0.5,
  maxAcceptsPerDay: 10,
  accept: {
    geoState: {
      $in: ['ca', 'ny']
    },
    hour: {
      $in: ['13', '14', '15']
    }
  }
}

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('create a target returns OK', function (t) {
  const url = '/api/targets'
  conn.deleteAll()

  servertest(server(), url, { encoding: 'json', method: 'POST' }, onCreateResponse)
    .end(JSON.stringify(targetSample))

  function onCreateResponse (err, res) {
    t.falsy(err, 'no error')
    t.deepEqual(res.statusCode, 200, 'correct statusCode')
    t.deepEqual(res.body.result, 'OK', 'return OK')
    t.end()
  }
})

test.serial.cb('index returns all targes', function (t) {
  const url = '/api/targets'
  conn.deleteAll()
  conn.addNew(targetSample)

  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.data.length, 1, 'contains created target')
    t.deepEqual(res.body.data[0], { ...targetSample, id: 0, accepted: {} }, 'contains target data')
    t.end()
  })
})

test.serial.cb('get returns the proper target', function (t) {
  const url = '/api/target/0'
  conn.deleteAll()
  conn.addNew(targetSample)

  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')

    t.deepEqual(res.body.data, { ...targetSample, id: 0, accepted: {} }, 'contains target data')
    t.end()
  })
})

test.serial.cb('update a target returns OK', function (t) {
  const url = '/api/target/0'
  conn.deleteAll()
  conn.addNew(targetSample)
  const updatedFields = {
    url: 'http://another.example.com',
    maxAcceptsPerDay: 20
  }

  servertest(server(), url, { encoding: 'json', method: 'POST' }, onUpdateResponse)
    .end(JSON.stringify(updatedFields))

  function onUpdateResponse (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.result, 'OK', 'return OK')
    t.end()
  }
})

test.serial.cb('route returns reject decision', function (t) {
  const url = '/route'
  conn.deleteAll()
  conn.addNew(targetSample)
  const visitorInfo = {
    geoState: 'ca',
    publisher: 'abc',
    timestamp: '2018-07-19T23:28:59.513Z'
  }

  servertest(server(), url, { encoding: 'json', method: 'POST' }, onRejectResponse)
    .end(JSON.stringify(visitorInfo))

  function onRejectResponse (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.decision, 'reject', 'return reject decision')
    t.end()
  }
})

test.serial.cb('route returns remaining url', function (t) {
  const url = '/route'
  conn.deleteAll()
  conn.addNew(targetSample)
  const visitorInfo = {
    geoState: 'ca',
    publisher: 'abc',
    timestamp: '2018-07-19T14:28:59.513Z'
  }

  servertest(server(), url, { encoding: 'json', method: 'POST' }, onDecisionResponse)
    .end(JSON.stringify(visitorInfo))

  function onDecisionResponse (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.url, targetSample.url, 'return url')
    t.end()
  }
})
