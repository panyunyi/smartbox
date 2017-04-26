'use strict';
var router = require('express').Router();
var ApiLog=require('./log');
var AV = require('leanengine');
var async = require('async');
var moment=require('moment');
var TakeOut = AV.Object.extend('TakeOut');

function doWork(cus,box,deviceId,card,passage,res,getCount){
    let flag=false;
    let resdata={};
    let message="无权限";
    resdata["result"]=flag;
    let onetake=new TakeOut();
    function promise1(callback){
        let cardQuery=new AV.Query('EmployeeCard');
        let num=card*1;
        let tempCard=num.toString(16).slice(2);
        cardQuery.contains('card',tempCard);
        cardQuery.equalTo('cusId',cus);
        cardQuery.equalTo('isDel',false);
        cardQuery.include('emp');
        cardQuery.first().then(function(cardObj){
            if (typeof(cardObj) == "undefined") {
                let admincardQuery=new AV.Query('AdminCard');
                admincardQuery.equalTo('isDel',false);
                admincardQuery.equalTo('card',card);
                admincardQuery.count().then(function(count){
                    if(count>0){
                        message="管理卡取货成功";
                        resdata["result"]=true;
                        resdata["objectId"]="123";
                        let result={
                            status:200,
                            message:message,
                            data:resdata,
                            server_time:new Date()
                        }
                        return res.jsonp(result);
                    }else {
                        return callback(null,0,null);
                    }
                });
            }else{
                onetake.set('isDel',false);
                onetake.set('box',box);
                onetake.set('time',new Date());
                onetake.set('card',cardObj);
                if(cardObj.get('oldCard')==null){
                    cardObj.set('oldCard',PrefixInteger(card,10));
                    cardObj.save();
                }
                onetake.set('cardNo',card);
                onetake.set('result',false);
                onetake.set('count',getCount*1);
                onetake.set('emp',cardObj.get('emp'));
                onetake.save();
                return callback(null,1,cardObj.get('emp'));
            }
        },function(error){
            message="卡号异常";
            return callback(error);
        });
    }
    function promise2(arg1,emp,callback){
        if(arg1==0){
            return callback(null,false,null);
        }
        let passageQuery=new AV.Query('Passage');
        passageQuery.equalTo('isDel',false);
        passageQuery.equalTo('isSend',true);
        passageQuery.include('product');
        if(passage.length==3){
            passageQuery.equalTo('flag',passage.substr(0,1));
            passageQuery.equalTo('seqNo',passage.substr(1,2));
        }else{
            passageQuery.equalTo('seqNo',passage);
        }
        passageQuery.equalTo('boxId',box);
        passageQuery.first().then(function(passageObj){
            onetake.set('passage',passageObj);
            onetake.set('passageNo',passage);
            onetake.set('product',passageObj.get('product'));
            onetake.save();
            return callback(null,passageObj,emp);
        },function(error){
            message="货道异常";
            return callback(error);
        });
    }
    function promise3(passageObj,emp,callback){
        if (typeof(passageObj) == "undefined"||passageObj==false||emp==null) {
            return callback(null,false);
        }
        let product=passageObj.get('product');
        let powerQuery=new AV.Query('EmployeePower');
        powerQuery.equalTo('isDel',false);
        powerQuery.equalTo('product',product);
        powerQuery.equalTo('emp',emp);
        powerQuery.first().then(function(power){
            if(typeof(power)!="undefined"){
                verifyPower(emp,power,product,getCount,callback);
            }else if(emp.get('super')>0){
                onetake.set('result',true);
                onetake.save().then(function(one){
                    flag=true;
                    message="成功";
                    resdata["result"]=flag;
                    resdata["objectId"]=one.id;
                    let passagedata=onetake.get('passage');
                    passagedata.increment('stock',-getCount);
                    passagedata.save().then(function(){
                        callback(null,true);
                    });
                });
            }else{
                message="无取货权限";
                return callback(null,false);
            }
        });
    }
    function verifyPower(emp,power,product,getCount,callback){
        let unit=power.get('unit');
        let period=power.get('period');
        let count=power.get('count');
        let units;
        switch (unit) {
            case "month":
                units="months";
                break;
            case "day":
                units="days";
                break;
            case "week":
                units="weeks";
                break;
            default:
                units="days";
        }
        let begin=moment().subtract(period-1,units).startOf(unit);
        let takeoutQuery=new AV.Query('TakeOut');
        takeoutQuery.equalTo('isDel',false);
        takeoutQuery.equalTo('result',true);
        takeoutQuery.equalTo('emp',emp);
        takeoutQuery.equalTo('product',product);
        takeoutQuery.limit(1000);
        takeoutQuery.greaterThanOrEqualTo('time',begin.toDate());
        takeoutQuery.lessThanOrEqualTo('time',new Date());
        takeoutQuery.find().then(function(takeouts){
            let takecount=0;
            //console.log(takeouts.length);
            async.map(takeouts,function(tk,callback1){
                takecount+=tk.get('count');
                callback1(null,1);
            },function(err,tks){
                //console.log(takecount);
                power.set('used',takecount);
                takecount=takecount*1+getCount*1;
                if (count>=takecount) {
                    flag=true;
                    onetake.set('result',true);
                    onetake.save().then(function(one){
                        message="成功";
                        resdata["result"]=flag;
                        resdata["objectId"]=one.id;
                        let passagedata=onetake.get('passage');
                        passagedata.increment('stock',-getCount);
                        power.increment('used',getCount);
                        power.save();
                        passagedata.save().then(function(){
                            callback(null,true);
                        });
                    });
                }else{
                    message="已取"+product.get('name')+"："+(takecount-getCount*1)+"次，超过领取次数";
                    resdata["result"]=flag;
                    callback(null,false);
                }
            });
        });
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
        let result={
            status:200,
            message:message,
            data:resdata,
            server_time:new Date()
        }
        res.jsonp(result);
    });
}

router.get('/:id/:card/:passage/:count', function(req, res) {
    let deviceId=req.params.id;
    let card=req.params.card;
    let passage=req.params.passage;
    let count=req.params.count;
    let todo={"ip":req.headers['x-real-ip'],"api":"多次取货判断接口","deviceId":deviceId,"msg":"card:"+card+",passage:"+passage+",count:"+count};
    ApiLog.WorkOn(todo);
    let boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceId);
    boxQuery.include('cusId');
    boxQuery.first().then(function (box){
        if (typeof(box) == "undefined") {
          let result={
            status:200,
            message:"无此设备号的数据",
            data:{"result":false},
            server_time:new Date()
          }
          res.jsonp(result);
          return;
        }
        let cus=box.get('cusId');
        doWork(cus,box,deviceId,card,passage,res,count*1);
    },function (error){
        console.log(error);
        let result={
          status:200,
          message:"查询出错",
          data:{"result":false},
          server_time:new Date()
        }
        res.jsonp(result);
    });
});

router.get('/:id/:card/:passage', function(req, res) {
    let deviceId=req.params.id;
    let card=req.params.card;
    let passage=req.params.passage;
    let todo={"ip":req.headers['x-real-ip'],"api":"取货判断接口","deviceId":deviceId,"msg":"card:"+card+",passage:"+passage};
    ApiLog.WorkOn(todo);
    let boxQuery=new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId',deviceId);
    boxQuery.include('cusId');
    boxQuery.first().then(function (box){
        if (typeof(box) == "undefined") {
          let result={
            status:200,
            message:"无此设备号的数据",
            data:{"result":false},
            server_time:new Date()
          }
          res.jsonp(result);
          return;
        }
        let cus=box.get('cusId');
        doWork(cus,box,deviceId,card,passage,res,1);
    },function (error){
        console.log(error);
        let result={
          status:200,
          message:"查询出错",
          data:{"result":false},
          server_time:new Date()
        }
        res.jsonp(result);
    });
});

router.get('/fail/:id', function(req, res) {
    let result={
      status:200,
      message:"objectId有误",
      data:false,
      server_time:new Date()
    }
    let todo={"ip":req.headers['x-real-ip'],"api":"取货失败回调接口","deviceId":"","msg":"objectId:"+req.params.id};
    ApiLog.WorkOn(todo);
    let takeout=AV.Object.createWithoutData('TakeOut',req.params.id);
    takeout.fetch().then(function(){
        let flag=takeout.get('result');
        if(flag){
            takeout.set('result',false);
            takeout.save();
            result['message']="";
            result['data']=true;
            res.jsonp(result);
            let passage=takeout.get('passage');
            passage.increment('stock',takeout.get('count'));
            passage.save();
        }else{
            result['message']="操作已回滚";
            res.jsonp(result);
        }
    },function(error){
        res.jsonp(result);
    });
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
