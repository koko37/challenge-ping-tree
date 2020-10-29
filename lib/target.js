const targetsKey = "targets"

function Target(redisClient, cb) {
  this.redis = redisClient
  this.callback = cb
}

Target.prototype.addNew = function(data) {
  this.redis.get(targetsKey, (err, res) => {
    if(err) return this.callback(err)

    let targets = JSON.parse(res) || []
    this.redis.set(targetsKey, JSON.stringify([...targets, data]), this.callback)
  })
}

Target.prototype.all = function(cb) {
  this.redis.get(targetsKey, (err, res) => {
    if(err) return this.callback(err)
    
    cb(JSON.parse(res) || [])
  })
}

module.exports = Target
