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
            passageQuery.equalTo('isDel',false);
            passageQuery.first().then(function(passage){
                if(typeof(passage)=="undefined"){
                    result['message']="提交的货道号异常";
                    return callback(null,record);
                }
                passage.save();
                let productQuery=new AV.Query('Product');
                productQuery.equalTo('sku',record.sku);
                productQuery.first().then(function(product){
                    if(typeof(product)=="undefined"){
                        result['message']="未找到产品"+record.sku;
                        return callback(null,record);
                    }
                    obj.set('box', box);
                    obj.set('passage',passage);
                    obj.set('passageNo',seqNo);
                    obj.set('product',product);
                    obj.set('time',new Date(record.time));
                    obj.set('result',true);
                    obj.set('count',record.count*1);
                    obj.set('isDel',false);
                    let empCardQuery=new AV.Query('EmployeeCard');
                    let tempCard=PrefixInteger(record.card.toString(16),6);
                    empCardQuery.contains('card',tempCard.length>6?tempCard.slice(2):tempCard);
                    empCardQuery.equalTo('cusId',box.get('cusId'));
                    empCardQuery.first().then(function(card){
                        obj.set('card',card);
                        obj.set('cardNo',record.card);
                        obj.set('emp',card.get('emp'));
                        /*if(record.result){
                            let powerQuery=new AV.Query('EmployeePower');
                                powerQuery.equalTo('isDel',false);
                                powerQuery.equalTo('product',passage.get('product'));
                                powerQuery.equalTo('emp',card.get('emp'));
                                powerQuery.first().then(function(power){
                                    power.increment('used',record.count*1);
                                    power.save();
                                });
                        }*/
                        callback(null,obj);
                    },function(error){
                        callback(null,error);
                    });
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
function PrefixInteger(num, n) {
    var len = num.toString().length;
    while(len < n) {
        num = "0" + num;
        len++;
    }
    return num;
}
module.exports = router;
