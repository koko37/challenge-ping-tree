const targetsKey = "targets"

function Target(redisClient, cb) {
  this.redis = redisClient
  this.callback = cb
}

module.exports = Target

Target.prototype.addNew = function(data) {
  this.redis.get(targetsKey, (err, res) => {
    if(err) return this.callback(err)

    let targets = JSON.parse(res) || []
    this.redis.set(
      targetsKey, 
      JSON.stringify(
        [...targets, {...data, accepted: {}, id: targets.length}]), 
      this.callback
    )
  })
}

Target.prototype.all = function(cb) {
  this.redis.get(targetsKey, (err, res) => {
    if(err) return this.callback(err)
    
    cb(JSON.parse(res) || [])
  })
}

Target.prototype.deleteAll = function() {
  this.redis.set(targetsKey, '[]')
}

Target.prototype.findById = function(id, cb) {
  this.redis.get(targetsKey, (err, res) => {
    if(err) return this.callback(err)

    let targets = JSON.parse(res) || []
    cb(targets[id])
  })
}

Target.prototype.update = function(id, data) {
  this.redis.get(targetsKey, (err, res) => {
    if(err) return this.callback(err)

    let targets = JSON.parse(res) || []
    targets[id] = { ...data, id }
    this.redis.set(targetsKey, JSON.stringify(targets))
  })
}

Target.prototype.filter = function(criteria, cb) {
  this.all((targets) => {
    let ts = new Date(criteria.timestamp)
    let res = targets
      .filter(t => t.accept.geoState['$in'].indexOf(criteria.geoState) >= 0)
      .filter(t => t.accept.hour['$in'].indexOf(ts.getUTCHours().toString()) >= 0)
      .filter(t => parseInt(t['maxAcceptsPerDay']) > parseInt(t.accepted[ts.toDateString('iso')] || '0'))
      .sort((x, y) => {
        if( parseFloat(x.value) < parseFloat(y.value) ) return 1
        if( parseFloat(x.value) > parseFloat(y.value) ) return -1
        return 0
      })

    cb(res)
  })
}
