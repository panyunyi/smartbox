'use strict';
var router = require('express').Router();
var AV = require('leanengine');

var Supply = AV.Object.extend('Supply');

router.post('/', function(req, res, next) {
  var deviceId = req.body.deviceId;
  var todo={"ip":req.headers['x-real-ip'],"api":"补货数据接口","deviceId":deviceId,"msg":""};
  ApiLog.WorkOn(todo);
  var records=req.body.record;
  var objects=[];
  records.forEach(function(error){
      var obj = new Supply();
      obj.set('deviceId', deviceId);
      obj.set('passage',error.passage);
      obj.set('card',error.card);
      obj.set('count',error.count);
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
