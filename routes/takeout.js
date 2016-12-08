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
    resdata["result"]=flag;
    function promise1(callback){
        console.log(1);
        var cardQuery=new AV.Query('EmployeeCard');
        cardQuery.equalTo('card',card);
        cardQuery.equalTo('isDel',false);
        cardQuery.first().then(function(cardObj){
            if (typeof(cardObj) == "undefined") {
                return callback(null,0,null);
            }
            var empQuery=new AV.Query('Employee');
            empQuery.equalTo('card',cardObj.get('id'));
            empQuery.equalTo('isDel',false);
            empQuery.first().then(function(data){
                if(typeof(data)=="undefined"){
                    return callback(null,0,null);
                }
                return callback(null,1,data);
            },function(error){
            });
        },function(error){
            return callback(error);
        });
    }
    function promise2(arg1,arg2,callback){
        console.log(2);
        if(arg1==0){
            return callback(null,false,null);
        }
        var passageQuery=new AV.Query('Passage');
        passageQuery.equalTo('isDel',false);
        passageQuery.equalTo('seqNo',passage);
        passageQuery.equalTo('boxId',box);
        passageQuery.first().then(function(passageObj){
            return callback(null,passageObj,arg2);
        },function(error){
            return callback(error);
        });
    }
    function promise3(arg1,arg2,callback){
        console.log(3);
        if (typeof(arg1) == "undefined"||arg1==false||arg2==null) {
            return callback(null,false);
        }
        var product=arg1.get('product');
        var empPower=arg2.get('power');
        for(var i=0;i<empPower.length;i++){
            var powerQuery=new AV.Query('EmployeePower');
            powerQuery.equalTo('objectId',empPower[i]);
            powerQuery.equalTo('isDel',false);
            powerQuery.first().then(function(power){
                if (typeof(power)!="undefined") {
                    verifyPower(product,power,callback);
                }
            },function(error){});
        }
    }
    function verifyPower(product,power,callback){
        console.log(4);
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
            var begin=moment().subtract(period-1,'months').startOf('month');
            console.log(begin);
            console.log(count);
            var takeoutQuery=new AV.Query('TakeOut');
            takeoutQuery.equalTo('isDel',false);
            takeoutQuery.equalTo('result',true);
            takeoutQuery.equalTo('deviceId',deviceId);
            takeoutQuery.equalTo('card',card);
            takeoutQuery.greaterThanOrEqualTo('time',begin);
            takeoutQuery.lessThanOrEqualTo('time',new Date());
            takeoutQuery.count().then(function(takecount){
                console.log(takecount);
                if (count>takecount) {
                    flag=true;
                    var onetake=new TakeOut();
                    onetake.set('isDel',false);
                    onetake.set('deviceId',deviceId);
                    onetake.set('time',new Date());
                    onetake.set('card',card);
                    onetake.set('result',false);
                    onetake.set('passage',passage);
                    onetake.save().then(function(one){
                        //resdata["result"]=flag;
                        //resdata["objectId"]=one.id;
                        console.log(one.id);
                        return callback(null,true);
                    });
                }
            });
        }
        return callback(null,false);
    }
    async.waterfall([
        function (callback){
            console.log("func1");
            promise1(callback);
        },
        function (arg1,arg2,callback){
            console.log("func2");
            promise2(arg1,arg2,callback);
        },
        function (arg1,arg2,callback){
            console.log("func3");
            promise3(arg1,arg2,callback);
        }],function(err,results){
        var result={
            status:200,
            message:"",
            data:results,
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
            data:false,
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
          data:false,
          server_time:new Date()
        }
        res.jsonp(result);
    });
});

router.get('/success/:id', function(req, res) {
    var begin=moment().subtract(0,'months').startOf('month').format("YYYY-MM-DD HH:mm:ss");
    res.jsonp(begin);
});
module.exports = router;
