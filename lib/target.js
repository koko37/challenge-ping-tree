const targetsKey = 'targets'
const { promisify } = require('util')

function Target (redisClient, cb) {
  this.redis = redisClient
  this.callback = cb
  this.setAsync = promisify(this.redis.set).bind(this.redis)
  this.getAsync = promisify(this.redis.get).bind(this.redis)
}

module.exports = Target

Target.prototype.addNew = async function (data) {
  try {
    const res = await this.getAsync(targetsKey)
    const targets = JSON.parse(res) || []
    await this.setAsync(
      targetsKey,
      JSON.stringify(
        [...targets, { ...data, accepted: {}, id: targets.length }])
    )
    return 'OK'
  } catch (err) {
    this.callback(err)
    return 'error'
  }
}

Target.prototype.all = async function () {
  try {
    const res = await this.getAsync(targetsKey)
    return JSON.parse(res) || []
  } catch (err) {
    this.callback(err)
    return null
  }
}

Target.prototype.deleteAll = function () {
  this.redis.set(targetsKey, '[]')
}

Target.prototype.findById = function (id, cb) {
  this.redis.get(targetsKey, (err, res) => {
    if (err) return this.callback(err)

    const targets = JSON.parse(res) || []
    cb(targets[id])
  })
}

Target.prototype.update = async function (id, data) {
  try {
    const res = await this.getAsync(targetsKey)
    const targets = JSON.parse(res) || []
    targets[id] = { ...targets[id], ...data, id }
    await this.setAsync(targetsKey, JSON.stringify(targets))
    return 'OK'
  } catch (err) {
    this.callback(err)
    return 'error'
  }
}

Target.prototype.filter = async function (criteria) {
  try {
    const ts = new Date(criteria.timestamp)
    const targets = await this.all()
    const res = targets
      .filter(t => t.accept.geoState.$in.indexOf(criteria.geoState) >= 0)
      .filter(t => t.accept.hour.$in.indexOf(ts.getUTCHours().toString()) >= 0)
      .filter(t => parseInt(t.maxAcceptsPerDay) > parseInt(t.accepted[ts.toDateString('iso')] || '0'))
      .sort((x, y) => {
        if (parseFloat(x.value) < parseFloat(y.value)) return 1
        if (parseFloat(x.value) > parseFloat(y.value)) return -1
        return 0
      })
    return res
  } catch (err) {
    this.callback(err)
    return []
  }
}

/**
 * It increments accepted count in redis.
 * So in future cases, if acceptedCount is greater than maxAcceptsPerDay, then it will reject also.
 * @param {*} id
 * @param {*} timestamp
 */
Target.prototype.accept = async function (id, timestamp) {
  const ts = new Date(timestamp)
  try {
    const res = await this.getAsync(targetsKey)
    const targets = JSON.parse(res) || []
    targets[id].accepted[ts.toDateString('iso')] = parseInt(targets[id].accepted[ts.toDateString('iso')] || '0') + 1
    await this.setAsync(targetsKey, JSON.stringify(targets))
    return true
  } catch (err) {
    this.callback(err)
    return false
  }
}
