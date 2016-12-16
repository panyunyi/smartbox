'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var ApiLog=require('./log');
var async = require('async');
var Borrow = AV.Object.extend('Borrow');

function doWork(deviceId,records,res){
    var objects=[];
    async.map(records,function(record,callback){
        records.forEach(function(record){
            var obj = new Borrow();
            var seqNo=record.passage;
            var boxQuery=new AV.Query('BoxInfo');
            boxQuery.equalTo('deviceId',deviceId);
            boxQuery.first().then(function(box){
                var passageQuery=new AV.Query('Passage');
                passageQuery.equalTo('boxId',box);
                passageQuery.equalTo('seqNo',seqNo);
                passageQuery.first().then(function(passage){
                    passage.set('borrowState',record.borrow);
                    passage.set('stock',passage.get('stock')-1);
                    passage.save();
                    obj.set('deviceId', deviceId);
                    obj.set('passage',record.passage);
                    obj.set('card',record.card);
                    obj.set('borrow',record.borrow);
                    obj.set('product',passage.get('product'));
                    obj.set('time',new Date(record.time));
                    obj.set('result',true);
                    obj.set('isDel',false);
                    objects.push(obj);
                    callback(null,record);
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
  var todo={"ip":req.headers['x-real-ip'],"api":"借还记录接口","deviceId":deviceId,"msg":JSON.stringify(req.body)};
  ApiLog.WorkOn(todo);
  var records=req.body.record;
  doWork(deviceId,records,res);
});
module.exports = router;
