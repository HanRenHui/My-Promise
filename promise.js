// import { Module } from "module";
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'
function Promise(fn) {
  let self = this 
  self.status = PENDING
  self.FulfiledCallbacks = []
  self.RejectCallbacks = []
  // then里的回调时用户自己写的，不能保证是同步还是异步，为了保证测试用例结果的一致性，
  // 全部改成异步, 后边的then方法里也是
  function resolve(value) {
    setTimeout(function() {
      if(self.status === PENDING) {
        self.status = FULFILLED
        self.value = value
        self.FulfiledCallbacks.forEach(r => r(value))
      }
    })
  }
  function reject(err) {
    setTimeout(function() {
      if(self.status === PENDING) {
        self.status = REJECTED
        self.err = err 
        self.RejectCallbacks.forEach(r => r(err))
      }
    })
  }
  try {
    fn(resolve, reject)
  } catch (error) {
    reject(error)
  }
}
Promise.prototype.then = function(onFulfiled, onRejected) {
  // 如果成功或失败的回调没有传， 则表示这个then没有任何逻辑，把值往后传
  // 这就是promise中值的穿透
  onFulfiled = typeof onFulfiled == 'function' ? onFulfiled : v => v
  onRejected = typeof onRejected == 'function' ? onRejected : err => { throw err }
  let promise2 
  let self = this
  if(this.status === PENDING) {
    promise2 = new Promise((resolve, reject) => {
      this.FulfiledCallbacks.push((value) => { 
        try{
          let x = onFulfiled(value)
          resolvePromise(promise2, x, resolve, reject)
        }catch(e) {
          reject(e)
        } 
      })
      this.RejectCallbacks.push(err => {
        try{
          let x = onRejected(err)
          resolvePromise(promise2, x, resolve, reject)
        }catch(e) {
          reject(e)
        } 
      })
    })
  }
  // 若是没有异步任务的话就直接执行
  if(this.status === FULFILLED) {
    promise2 = new Promise((resolve, reject) => {
      setTimeout(() => {
        try{
          let x = onFulfiled(this.value)
          // resolve(x)
          resolvePromise(promise2, x, resolve, reject)
        }catch(e){
          reject(e)
        }
      })
    })
  }
  if(this.status === REJECTED) {
      promise2 = new Promise((resolve, reject) => {
      setTimeout(() => {
        try{
          let x = onRejected(this.err)
          // resolve(x)
          resolvePromise(promise2, x, resolve, reject)
        }catch(e) {

          reject(e)
        } 
      })
    })
  }
  return promise2
}

function resolvePromise(promise2, x, resolve, reject) {
  
  if(x === promise2) {
    return reject(new TypeError('promise2将无法执行'))
  }
  // flag如果resolve已经执行，则不要执行reject 
  var called = false
  var then
  if( (x != null) && ((typeof x === 'function') || (typeof x === 'object'))) {
    try{
      then = x.then 
      if(typeof then === 'function') {
        then.call(x, function rs(y) {
          if(called) return 
          called = true
          return resolvePromise(promise2, y, resolve, reject)
        }, function rj(err) {
          if(called) return 
          called = true
           reject(err)
        })
      }else {
        // 不是thenabale对象的话， 直接传
        resolve(x)
      }
    }catch(e) {
      if(called) return 
      called = true
       reject(e)
    }
  }else {
    resolve(x)
  }
}
// catch方法
Promise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected)
}
// all方法
Promise.all = function(promise2) {
  return new Promise((resolve, reject) => {
    let count = 0
    let dataArr
    promise2.forEach((p, index) => {
      p.then(data => {dataArr[index] = data})
      if( ++count === promise2.length) resolve(dataArr)
    }, reject)
  })
}
// race方法
Promise.race = function(promises) {
  return new Promise((resolve, reject) => {
    promises.forEach(p => {
      p.then(resolve, reject)
    })
  })
}

Promise.deferred = Promise.defer = function() {
  var defer ={}
  defer.promise = new Promise((resolve, reject) => {
    defer.resolve = resolve 
    defer.reject = reject
  })
  return defer
}
 module.exports = Promise
