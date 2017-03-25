'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var ApiLog=require('./log');
var async = require('async');
var TakeOut = AV.Object.extend('TakeOut');

function doWork(deviceId,records,res){
    async.mapSeries(records,function(record,callback){
        let obj = new TakeOut();
        let seqNo=record.passage;
        let boxQuery=new AV.Query('BoxInfo');
        boxQuery.equalTo('deviceId',deviceId);
        boxQuery.first().then(function(box){
            let passageQuery=new AV.Query('Passage');
            passageQuery.equalTo('boxId',box);
            if(seqNo.length==3){
                passageQuery.equalTo('flag',seqNo.substr(0,1));
                passageQuery.equalTo('seqNo',seqNo.substr(1,2));
            }else{
                passageQuery.equalTo('seqNo',seqNo);
            }
            passageQuery.first().then(function(passage){
                if(typeof(passage)=="undefined"){
                    result['message']="提交的货道号异常";
                    callback(null,record);
                }
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
                let empCardQuery=new AV.Query('EmployeeCard');
                empCardQuery.equalTo('card',record.card);
                empCardQuery.equalTo('cusId',box.get('cusId'));
                empCardQuery.first().then(function(card){
                    obj.set('card',card);
                    obj.set('emp',card.get('emp'));
                    if(record.result){
                    let powerQuery=new AV.Query('EmployeePower');
                        powerQuery.equalTo('isDel',false);
                        powerQuery.equalTo('product',passage.get('product'));
                        powerQuery.equalTo('emp',card.get('emp'));
                        powerQuery.first().then(function(power){
                            power.increment('used',1);
                            power.save();
                        });
                    }
                    callback(null,obj);
                },function(error){
                    callback(null,error);
                });
            });
        });
    },function(error,results){
        AV.Object.saveAll(results).then(function (objects) {
            let result={
              status:200,
              message:"",
              data:true,
              server_time:new Date()
            }
            res.jsonp(result);
        }, function (error) {
            console.log(error);
            let result={
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
  let deviceId = req.body.deviceId;
  let todo={"ip":req.headers['x-real-ip'],"api":"取货数据接口","deviceId":deviceId,"msg":JSON.stringify(req.body)};
  ApiLog.WorkOn(todo);
  let records=req.body.record;
  doWork(deviceId,records,res);
});
module.exports = router;
