'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var ApiLog=require('./log');
var Borrow = AV.Object.extend('Borrow');

router.get('/:id/:card/:passage', function(req, res) {
    var deviceId=req.params.id;
    var card=req.params.card;
    var passage=req.params.passage;
    var todo={"ip":req.headers['x-real-ip'],"api":"还货接口","deviceId":deviceId,"msg":"card:"+card+",passage:"+passage};
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
        var oneborrow=new Borrow();
        var passageQuery=new AV.Query('Passage');
        passageQuery.equalTo('boxId',box);
        passageQuery.equalTo('seqNo',passage);
        passageQuery.first().then(function(data){
            oneborrow.set('isDel',false);
            oneborrow.set('deviceId',deviceId);
            oneborrow.set('time',new Date());
            oneborrow.set('card',card);
            oneborrow.set('result',true);
            oneborrow.set('passage',passage);
            oneborrow.set('product',data.get('product'));
            oneborrow.set('borrow',false);
            oneborrow.save().then(function(one){
                console.log(one);
                var result={
                    status:200,
                    message:"",
                    data:true,
                    server_time:new Date()
                }
                res.jsonp(result);
            });
    });
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
module.exports = router;
