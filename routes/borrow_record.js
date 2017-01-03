'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var ApiLog=require('./log');
var async = require('async');
var Borrow = AV.Object.extend('Borrow');
var result={
  status:200,
  message:"",
  data:false,
  server_time:new Date()
};
function doWork(deviceId,records,res){
    var objects=[];
    async.mapSeries(records,function(record,callback){
        var obj = new Borrow();
        var seqNo=record.passage;
        var boxQuery=new AV.Query('BoxInfo');
        boxQuery.equalTo('deviceId',deviceId);
        boxQuery.first().then(function(box){
            if(typeof(box)=="undefined"){
                result['message']="无此设备号";
                return res.jsonp(result);
            }
            var passageQuery=new AV.Query('Passage');
            passageQuery.equalTo('boxId',box);
            passageQuery.equalTo('flag',seqNo.substr(0,1));
            passageQuery.equalTo('seqNo',seqNo.substr(1,2));
            passageQuery.first().then(function(passage){
                if(typeof(passage)=="undefined"){
                    result['message']="提交的货道号异常";
                    callback(null,record);
                }
                var cardQuery=new AV.Query('EmployeeCard');
                cardQuery.equalTo('isDel',false);
                cardQuery.equalTo('card',record.card);
                cardQuery.first().then(function(card){
                    if(typeof(passage)=="undefined"){
                        result['message']="未找到此卡";
                        callback(null,record);
                    }
                    obj.set('box', box);
                    obj.set('passage',passage);
                    obj.set('card',card);
                    obj.set('borrow',record.borrow);
                    obj.set('product',passage.get('product'));
                    obj.set('time',new Date(record.time));
                    obj.set('result',record.result);
                    obj.set('isDel',false);
                    objects.push(obj);
                    callback(null,record);
                    if(record.result){
                      passage.set('borrowState',record.borrow);
                      if(record.borrow){
                        passage.set('used',card.get('emp'));
                        passage.increment('stock',-1);
                      }else{
                        passage.set('used',null);
                        passage.increment('stock',1);
                      }
                    }
                    passage.save();
                });
            });
        });
    },function(error,results){
        AV.Object.saveAll(objects).then(function (objects) {
            result['message']="";
            result['data']=true;
            res.jsonp(result);
        }, function (error) {
            console.log(error);
            result['message']=error;
            result['data']=false;
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
