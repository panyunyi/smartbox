'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var ApiLog=require('./log');
var ErrorLog = AV.Object.extend('ErrorLog');

router.post('/', function(req, res, next) {
  var deviceId = req.body.deviceId;
  var todo={"ip":req.headers['x-real-ip'],"api":"异常数据提记录口","deviceId":deviceId,"msg":""};
  ApiLog.WorkOn(todo);
  var errors=req.body.error;
  var objects=[];
  errors.forEach(function(error){
      var obj = new ErrorLog();
      obj.set('deviceId', deviceId);
      obj.set('passage',error.passage);
      obj.set('card',error.card);
      obj.set('node',error.node);
      obj.set('info',error.info);
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
