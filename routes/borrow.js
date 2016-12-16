'use strict';
var router = require('express').Router();
var ApiLog=require('./log');
var AV = require('leanengine');
var async = require('async');
var Borrow = AV.Object.extend('Borrow');

function doWork(cus,box,deviceId,card,passage,res){
    var flag=false;
    var resdata={};
    resdata["result"]=flag;
    function promise1(callback){
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
        console.log(power.get('boxId').get('id')+" "+box.get('id'));
        console.log(power.get('product').get('id')+" "+product.get('id'));
        if(power.get('boxId').get('id')==box.get('id')&&power.get('product').get('id')==product.get('id')){
            flag=true;
            var oneborrow=new Borrow();
            oneborrow.set('isDel',false);
            oneborrow.set('deviceId',deviceId);
            oneborrow.set('time',new Date());
            oneborrow.set('card',card);
            oneborrow.set('result',false);
            oneborrow.set('passage',passage);
            oneborrow.set('product',product);
            oneborrow.set('borrow',false);
            oneborrow.save().then(function(one){
                resdata["result"]=flag;
                resdata["objectId"]=one.id;
                return callback(null,resdata);
            });
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
    var todo={"ip":req.headers['x-real-ip'],"api":"借货判断接口","deviceId":deviceId,"msg":"card:"+card+",passage:"+passage};
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

router.get('/success/:id', function(req, res) {
    var result={
      status:200,
      message:"",
      data:false,
      server_time:new Date()
    }
    var todo={"ip":req.headers['x-real-ip'],"api":"借货成功回调接口","deviceId":"","msg":"objectId:"+req.params.id};
    ApiLog.WorkOn(todo);
    var borrow=AV.Object.createWithoutData('Borrow',req.params.id);
    borrow.set('result',true);
    borrow.set('borrow',true);
    borrow.save().then(function(data){
        var result={
          status:200,
          message:"",
          data:true,
          server_time:new Date()
        }
        res.jsonp(result);
        var deviceId=takeout.get('deviceId');
        var seqNo=takeout.get('passage');
        var boxQuery=new AV.Query('BoxInfo');
        boxQuery.equalTo('deviceId',deviceId);
        boxQuery.first().then(function(box){
            if(typeof(box)=="undefined"){
                return res.jsonp(result);
            }
            var passageQuery=new AV.Query('Passage');
            passageQuery.equalTo('boxId',box);
            passageQuery.equalTo('seqNo',seqNo);
            passageQuery.first().then(function(passage){
                passage.set('borrowState',data.borrow);
                passage.save();
            });
        });
    },function(error){
        res.jsonp(result);
    });
});
module.exports = router;
