'use strict';
var router = require('express').Router();
var ApiLog=require('./log');
var AV = require('leanengine');
var async = require('async');
var Borrow = AV.Object.extend('Borrow');

function doWork(cus,box,deviceId,card,passage,res){
    var flag=false;
    var resdata={};
    var message="无权限";
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
                message="卡号";
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
        passageQuery.equalTo('flag',passage.substr(0,1));
        passageQuery.equalTo('isSend',false);
        passageQuery.equalTo('borrowState',false);
        passageQuery.equalTo('seqNo',passage.substr(1,2));
        passageQuery.equalTo('boxId',box);
        passageQuery.equalTo('used',null);
        passageQuery.first().then(function(passageObj){
            message="货道";
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
        var oneborrow=new Borrow();
        oneborrow.set('isDel',false);
        oneborrow.set('deviceId',deviceId);
        oneborrow.set('time',new Date());
        oneborrow.set('card',card);
        oneborrow.set('result',false);
        oneborrow.set('passage',passage);
        oneborrow.set('product',product);
        oneborrow.set('borrow',true);
        async.mapSeries(empPower,function(emppower,callback1){
            var powerQuery=new AV.Query('EmployeePower');
            powerQuery.equalTo('objectId',emppower);
            powerQuery.equalTo('isDel',false);
            powerQuery.first().then(function(power){
                if (typeof(power)!="undefined") {
                    verifyPower(oneborrow,product,power,callback1,callback);
                }
            },function(error){
                return callback(error);
            });
        },function(error,results){
            return callback(null,flag);
        });
    }
    function verifyPower(oneborrow,product,power,callback,callback1){
        if(power.get('boxId').get('id')==box.get('id')&&power.get('product').get('id')==product.get('id')){
            flag=true;
            oneborrow.set('result',true);
            oneborrow.save().then(function(one){
                message="";
                resdata["result"]=flag;
                resdata["objectId"]=one.id;
                var borrowQuery=new AV.Query('Borrow');
                borrowQuery.get(one.id).then(function(borrowPassage){
                    var seqNo=borrowPassage.get('passage').substr(1,2);
                    var flag=borrowPassage.get('passage').substr(0,1);
                    var passageQuery=new AV.Query('Passage');
                    passageQuery.equalTo('boxId',box);
                    passageQuery.equalTo('seqNo',seqNo);
                    passageQuery.equalTo('flag',flag);
                    passageQuery.first().then(function(passage){
                        var cardQuery=new AV.Query('EmployeeCard');
                        cardQuery.equalTo('isDel',false);
                        cardQuery.equalTo('card',one.card);
                        cardQuery.first().then(function(card){
                            passage.set('borrowState',true);
                            passage.set('stock',passage.get('stock')-1);
                            passage.set('used',card)
                            passage.save().then(function(){
                                callback(null,true);
                                return callback1(null,true);
                            });
                        });
                    });
                });
            });
        }else{
            message="无权限";
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

router.get('/fail/:id', function(req, res) {
    var result={
      status:200,
      message:"设备号或objectId有误",
      data:false,
      server_time:new Date()
    }
    var todo={"ip":req.headers['x-real-ip'],"api":"借货失败回调接口","deviceId":"","msg":"objectId:"+req.params.id};
    ApiLog.WorkOn(todo);
    var borrow=AV.Object.createWithoutData('Borrow',req.params.id);
    borrow.set('result',false);
    borrow.set('borrow',true);
    borrow.save();
    borrow.fetch().then(function(){
        var result={
          status:200,
          message:"",
          data:true,
          server_time:new Date()
        }
        res.jsonp(result);
        var deviceId=borrow.get('deviceId');
        var borrowQuery=new AV.Query('Borrow');
        borrowQuery.get(borrow.id).then(function(borrowPassage){
            var seqNo=borrowPassage.get('passage').substr(1,2);
            var flag=borrowPassage.get('passage').substr(0,1);
            var boxQuery=new AV.Query('BoxInfo');
            boxQuery.equalTo('deviceId',deviceId);
            boxQuery.first().then(function(box){
                if(typeof(box)=="undefined"){
                    return res.jsonp(result);
                }
                var passageQuery=new AV.Query('Passage');
                passageQuery.equalTo('boxId',box);
                passageQuery.equalTo('seqNo',seqNo);
                passageQuery.equalTo('flag',flag);
                passageQuery.first().then(function(passage){
                    var cardQuery=new AV.Query('EmployeeCard');
                    cardQuery.equalTo('isDel',false);
                    cardQuery.equalTo('card',borrow.card);
                    cardQuery.first().then(function(card){
                        passage.set('borrowState',false);
                        passage.set('stock',passage.get('stock')+1);
                        passage.set('used',null)
                        passage.save();
                    });
                });
            });
        });
    },function(error){
        res.jsonp(result);
    });
});
module.exports = router;
