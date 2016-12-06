'use strict';
var router = require('express').Router();
var AV = require('leanengine');

var Borrow = AV.Object.extend('Borrow');

router.post('/', function(req, res, next) {
  var deviceId = req.body.deviceId;
  var todo={"ip":req.headers['x-real-ip'],"api":"借还记录接口","deviceId":deviceId,"msg":""};
  ApiLog.WorkOn(todo);
  var records=req.body.record;
  var objects=[];
  records.forEach(function(error){
      var obj = new Borrow();
      obj.set('deviceId', deviceId);
      obj.set('passage',error.passage);
      obj.set('card',error.card);
      obj.set('borrow',error.borrow);
      obj.set('time',new Date(error.time));
      objects.push(obj);
  });
  AV.Object.saveAll(objects).then(function (objects) {
      var result={
        status:200,
        message:"",
        data:true,
        server_time:new Date()
      }
      res.jsonp(result);
  }, function (error) {
      console.log(error);
      var result={
        status:200,
        message:"",
        data:false,
        server_time:new Date()
      }
      res.jsonp(result);
  });
});
module.exports = router;
