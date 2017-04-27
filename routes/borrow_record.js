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
    async.mapSeries(records,function(record,callback){
        let obj = new Borrow();
        let seqNo=record.passage;
        let boxQuery=new AV.Query('BoxInfo');
        boxQuery.equalTo('deviceId',deviceId);
        boxQuery.first().then(function(box){
            if(typeof(box)=="undefined"){
                result['message']="无此设备号";
                return res.jsonp(result);
            }
            let passageQuery=new AV.Query('Passage');
            passageQuery.equalTo('boxId',box);
            passageQuery.equalTo('flag',seqNo.substr(0,1));
            passageQuery.equalTo('seqNo',seqNo.substr(1,2));
            passageQuery.first().then(function(passage){
                if(typeof(passage)=="undefined"){
                    result['message']="提交的货道号异常";
                    callback(null,record);
                }
                let cardQuery=new AV.Query('EmployeeCard');
                cardQuery.equalTo('isDel',false);
                let num=record.card*1;
                let tempCard=PrefixInteger(num.toString(16),6);
                cardQuery.contains('card',tempCard.length>6?tempCard.slice(2):tempCard);
                cardQuery.first().then(function(card){
                    if(typeof(passage)=="undefined"){
                        result['message']="未找到此卡";
                        callback(null,record);
                    }
                    obj.set('box', box);
                    obj.set('passage',passage);
                    obj.set('card',card);
                    obj.set('cardNo',record.card);
                    obj.set('passageNo',seqNo);
                    obj.set('emp',card.get('emp'));
                    obj.set('borrow',record.borrow);
                    obj.set('product',passage.get('product'));
                    obj.set('time',new Date(record.time));
                    obj.set('result',record.result);
                    obj.set('isDel',false);
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
                    callback(null,obj);
                });
            });
        });
    },function(error,results){
        AV.Object.saveAll(results).then(function (objects) {
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
  let deviceId = req.body.deviceId;
  let todo={"ip":req.headers['x-real-ip'],"api":"借还记录接口","deviceId":deviceId,"msg":JSON.stringify(req.body)};
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
