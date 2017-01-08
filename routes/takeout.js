'use strict';
var router = require('express').Router();
var ApiLog=require('./log');
var AV = require('leanengine');
var async = require('async');
var moment=require('moment');
var TakeOut = AV.Object.extend('TakeOut');

function doWork(cus,box,deviceId,card,passage,res){
    var flag=false;
    var resdata={};
    var message="无权限";
    resdata["result"]=flag;
    var onetake=new TakeOut();
    var empcard=null;
    function promise1(callback){
        var cardQuery=new AV.Query('EmployeeCard');
        cardQuery.equalTo('card',card);
        cardQuery.equalTo('cusId',cus);
        cardQuery.equalTo('isDel',false);
        cardQuery.include('emp');
        cardQuery.first().then(function(cardObj){
            if (typeof(cardObj) == "undefined") {
                return callback(null,0,null);
            }
            empcard=cardObj;
            onetake.set('isDel',false);
            onetake.set('box',box);
            onetake.set('time',new Date());
            onetake.set('card',cardObj);
            onetake.set('result',false);
            onetake.save();
            return callback(null,1,cardObj.get('emp'));
        },function(error){
            message="卡号异常";
            return callback(error);
        });
    }
    function promise2(arg1,arg2,callback){
        if(arg1==0){
            return callback(null,false,null);
        }
        var passageQuery=new AV.Query('Passage');
        passageQuery.equalTo('isDel',false);
        passageQuery.equalTo('isSend',true);
        if(passage.length==3){
            passageQuery.equalTo('flag',passage.substr(0,1));
            passageQuery.equalTo('seqNo',passage.substr(1,2));
        }else{
            passageQuery.equalTo('seqNo',passage);
        }
        passageQuery.equalTo('boxId',box);
        passageQuery.first().then(function(passageObj){
            onetake.set('passage',passageObj);
            return callback(null,passageObj,arg2);
        },function(error){
            message="货道异常";
            return callback(error);
        });
    }
    function promise3(arg1,arg2,callback){
        if (typeof(arg1) == "undefined"||arg1==false||arg2==null) {
            return callback(null,false);
        }
        var product=arg1.get('product');
        onetake.set('product',product);
        onetake.save();
        var empPower=arg2.get('power');
        async.map(empPower,function(emppower,callback1){
            var powerQuery=new AV.Query('EmployeePower');
            powerQuery.equalTo('objectId',emppower);
            powerQuery.equalTo('isDel',false);
            powerQuery.first().then(function(power){
                if (typeof(power)!="undefined") {
                    verifyPower(product,power,callback1,callback);
                }
            },function(error){
                message="权限验证异常";
                return callback(error);
            });
        },function(error,results){
            return callback(null,flag);
        });

    }
    function verifyPower(product,power,callback,callback1){
        if(power.get('boxId').get('id')==box.get('id')&&power.get('product').get('id')==product.get('id')){
            var unit=power.get('unit');
            var period=power.get('period');
            var count=power.get('count');
            var units;
            switch (unit) {
                case "month":
                    units="months";
                    break;
                case "day":
                    units="days";
                    break;
                case "year":
                    units="years";
                    break;
                default:
                    units="months";
            }
            var begin=moment().subtract(period-1,units).startOf(unit);
            var takeoutQuery=new AV.Query('TakeOut');
            takeoutQuery.equalTo('isDel',false);
            takeoutQuery.equalTo('result',true);
            takeoutQuery.equalTo('box',box);
            takeoutQuery.equalTo('card',empcard);
            takeoutQuery.equalTo('product',product);
            takeoutQuery.greaterThanOrEqualTo('time',begin.toDate());
            takeoutQuery.lessThanOrEqualTo('time',new Date());
            takeoutQuery.count().then(function(takecount){
                if (count>takecount) {
                    flag=true;
                    onetake.set('result',true);
                    onetake.save().then(function(one){
                        message="成功";
                        resdata["result"]=flag;
                        resdata["objectId"]=one.id;
                        var passagedata=onetake.get('passage');
                        passagedata.increment('stock',-1);
                        passagedata.save().then(function(){
                            callback(null,true);
                            return callback1(null,true);
                        });
                    });
                }else{
                    message="已取货："+takecount+"，超过领取次数";
                    resdata["result"]=flag;
                    callback(null,false);
                }
            });
        }else{
            message="无取货权限";
            callback(null,false);
        }
    }
    async.waterfall([
        function (callback){
            promise1(callback);
        },
        function (arg1,arg2,callback){
            promise2(arg1,arg2,callback);
        },
        function (arg1,arg2,callback){
            promise3(arg1,arg2,callback);
        }],function(err,results){
        var result={
            status:200,
            message:message,
            data:resdata,
            server_time:new Date()
        }
        res.jsonp(result);
    });
}

router.get('/:id/:card/:passage', function(req, res) {
    var deviceId=req.params.id;
    var card=req.params.card;
    var passage=req.params.passage;
    var todo={"ip":req.headers['x-real-ip'],"api":"取货判断接口","deviceId":deviceId,"msg":"card:"+card+",passage:"+passage};
    ApiLog.WorkOn(todo);
    var boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceId);
    boxQuery.include('cusId');
    boxQuery.first().then(function (box){
        if (typeof(box) == "undefined") {
          var result={
            status:200,
            message:"无此设备号的数据",
            data:{"result":false},
            server_time:new Date()
          }
          res.jsonp(result);
          return;
        }
        var cus=box.get('cusId');
        doWork(cus,box,deviceId,card,passage,res);
    },function (error){
        console.log(error);
        var result={
          status:200,
          message:"查询出错",
          data:{"result":false},
          server_time:new Date()
        }
        res.jsonp(result);
    });
});

router.get('/fail/:id', function(req, res) {
    var result={
      status:200,
      message:"objectId有误",
      data:false,
      server_time:new Date()
    }
    var todo={"ip":req.headers['x-real-ip'],"api":"取货失败回调接口","deviceId":"","msg":"objectId:"+req.params.id};
    ApiLog.WorkOn(todo);
    var takeout=AV.Object.createWithoutData('TakeOut',req.params.id);
    takeout.fetch().then(function(){
        var flag=takeout.get('result');
        if(flag){
            takeout.set('result',false);
            takeout.save();
            result['message']="";
            result['data']=true;
            res.jsonp(result);
            var passage=takeout.get('passage');
            passage.increment('stock',1);
            passage.save();
        }else{
            result['message']="操作已回滚";
            res.jsonp(result);
        }
    },function(error){
        res.jsonp(result);
    });
});
module.exports = router;
