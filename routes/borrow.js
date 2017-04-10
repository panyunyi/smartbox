'use strict';
var router = require('express').Router();
var ApiLog=require('./log');
var AV = require('leanengine');
var async = require('async');
var Borrow = AV.Object.extend('Borrow');

function doWork(cus,box,deviceId,card,passage,res){
    let flag=false;
    let resdata={};
    let message="无权限";
    resdata["result"]=flag;
    let oneborrow=new Borrow();

    function promise1(callback){
        let cardQuery=new AV.Query('EmployeeCard');
        let num=card*1;
        let tempCard=num.toString(16).slice(2);
        cardQuery.contains('card',tempCard);
        cardQuery.equalTo('isDel',false);
        cardQuery.equalTo('cusId',cus);
        cardQuery.first().then(function(cardObj){
            if (typeof(cardObj) == "undefined") {
                message="未找到此卡号";
                return callback(null,0,null);
            }
            oneborrow.set('isDel',false);
            oneborrow.set('box',box);
            oneborrow.set('time',new Date());
            oneborrow.set('card',cardObj);
            oneborrow.set('result',false);
            oneborrow.set('borrow',true);
            oneborrow.set('emp',cardObj.get('emp'));
            oneborrow.save();
            return callback(null,1,cardObj.get('emp'));
        },function(error){
            return callback(error);
        });
    }
    function promise2(arg1,arg2,callback){
        if(arg1==0){
            return callback(null,false,null);
        }
        let passageQuery=new AV.Query('Passage');
        passageQuery.equalTo('isDel',false);
        passageQuery.equalTo('flag',passage.substr(0,1));
        passageQuery.equalTo('isSend',false);
        passageQuery.equalTo('seqNo',passage.substr(1,2));
        passageQuery.equalTo('boxId',box);
        passageQuery.first().then(function(passageObj){
            oneborrow.set('passage',passageObj);
            oneborrow.set('product',passageObj.get('product'));
            oneborrow.save();
            if(passageObj.get('borrowState')||passageObj.get('used')!=null){
                message="格子柜为借出状态";
                return callback(null,false,null);
            }
            return callback(null,passageObj,arg2);
        },function(error){
            return callback(error);
        });
    }
    function promise3(arg1,arg2,callback){
        if (typeof(arg1) == "undefined"||arg1==false||arg2==null) {
            message="未找到格子柜";
            return callback(null,false);
        }
        //let product=arg1.get('product');
        /*let powerQuery=new AV.Query('EmployeePower');
        powerQuery.equalTo('isDel',false);
        powerQuery.equalTo('product',product);
        powerQuery.equalTo('emp',arg2);
        powerQuery.first().then(function(power){
            if(typeof(power)!="undefined"){
                verifyPower(arg2,callback);
            }else {
                message="无取货权限";
                return callback(null,false);
            }
        });*/
        verifyPower(arg2,callback);
    }
    function verifyPower(emp,callback){
        flag=true;
        oneborrow.set('result',true);
        oneborrow.save().then(function(one){
            message="";
            resdata["result"]=flag;
            resdata["objectId"]=one.id;
            let passage=one.get('passage');
            passage.set('borrowState',true);
            passage.increment('stock',-1);
            passage.set('used',emp);
            passage.save().then(function(){
                callback(null,true);
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

router.get('/:id/:card/:passage', function(req, res) {
    let deviceId=req.params.id;
    let card=req.params.card;
    let passage=req.params.passage;
    let todo={"ip":req.headers['x-real-ip'],"api":"借货判断接口","deviceId":deviceId,"msg":"card:"+card+",passage:"+passage};
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
        doWork(cus,box,deviceId,card,passage,res);
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
      message:"设备号或objectId有误",
      data:false,
      server_time:new Date()
    }
    let todo={"ip":req.headers['x-real-ip'],"api":"借货失败回调接口","deviceId":"","msg":"objectId:"+req.params.id};
    ApiLog.WorkOn(todo);
    let borrow=AV.Object.createWithoutData('Borrow',req.params.id);
    borrow.set('result',false);
    borrow.set('borrow',true);
    borrow.save();
    borrow.fetch().then(function(){
        result['message']="";
        result['data']=true;
        res.jsonp(result);
        let passage=borrow.get('passage');
        passage.fetch().then(function(){
            if(passage.get('borrowState')){
                passage.set('borrowState',false);
                passage.increment('stock',1);
                passage.set('used',null)
                passage.save();
            }
        });
    },function(error){
        res.jsonp(result);
    });
});
module.exports = router;
