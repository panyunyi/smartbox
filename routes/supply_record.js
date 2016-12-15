'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var ApiLog=require('./log');
var Supply = AV.Object.extend('Supply');

router.post('/', function(req, res, next) {
  var deviceId = req.body.deviceId;
  var todo={"ip":req.headers['x-real-ip'],"api":"补货数据接口","deviceId":deviceId,"msg":JSON.stringify(req.body)};
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
      obj.set('isDel',false);
      objects.push(obj);
      var boxQuery=new AV.Query('BoxInfo');
      boxQuery.equalTo('isDel',false);
      boxQuery.equalTo('deviceId',deviceId);
      boxQuery.first().then(function(box){
        var query=new AV.Query('Passage');
        query.equalTo('isDel',false);
        query.equalTo('boxId',box);
        query.first().then(function(passage){
          passage.set('stock',passage.get('stock')+1);
          passage.save();
        });
      });
      

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
        message:"提交失败",
        data:false,
        server_time:new Date()
      }
      res.jsonp(result);
  });
});
module.exports = router;
