'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var ApiLog=require('./log');
var async = require('async');
var TakeOut = AV.Object.extend('TakeOut');

function doWork(deviceId,records,res){
    var objects=[];
    async.mapSeries(records,function(record,callback){
        var obj = new TakeOut();
        var seqNo=record.passage;
        var boxQuery=new AV.Query('BoxInfo');
        boxQuery.equalTo('deviceId',deviceId);
        boxQuery.first().then(function(box){
            var passageQuery=new AV.Query('Passage');
            passageQuery.equalTo('boxId',box);
            passageQuery.equalTo('seqNo',seqNo);
            passageQuery.first().then(function(passage){
                if(record.result){
                    passage.increment('stock',-1);
                    passage.save();
                }
                obj.set('box', box);
                obj.set('passage',passage);
                obj.set('product',passage.get('product'));
                obj.set('time',new Date(record.time));
                obj.set('result',record.result);
                obj.set('isDel',false);
                var empCardQuery=new AV.Query('EmployeeCard');
                empCardQuery.equalTo('card',record.card);
                empCardQuery.first().then(function(card){
                    obj.set('card',card);
                    objects.push(obj);
                    callback(null,record);
                },function(error){
                    callback(null,error);
                });
            });
        });
    },function(error,results){
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
}

router.post('/', function(req, res, next) {
  var deviceId = req.body.deviceId;
  var todo={"ip":req.headers['x-real-ip'],"api":"取货数据接口","deviceId":deviceId,"msg":JSON.stringify(req.body)};
  ApiLog.WorkOn(todo);
  var records=req.body.record;
  doWork(deviceId,records,res);
});
module.exports = router;
