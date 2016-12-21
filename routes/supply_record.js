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
  records.forEach(function(record){
      var obj = new Supply();
      obj.set('deviceId', deviceId);
      obj.set('passage',record.passage);
      obj.set('card',record.card);
      obj.set('count',record.count);
      obj.set('time',new Date(record.time));
      obj.set('isDel',false);
      objects.push(obj);
      var boxQuery=new AV.Query('BoxInfo');
      boxQuery.equalTo('isDel',false);
      boxQuery.equalTo('deviceId',deviceId);
      boxQuery.first().then(function(box){
        var query=new AV.Query('Passage');
        if(record.passage.length>2){
            query.equalTo('flag',record.passage.substr(0,1));
            query.equalTo('seqNo',record.passage.substr(1,2));
        }else{
            query.equalTo('seqNo',record.passage);
        }
        query.equalTo('isDel',false);
        query.equalTo('boxId',box);
        query.first().then(function(passage){
          passage.set('stock',passage.get('stock')+record.count);
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
