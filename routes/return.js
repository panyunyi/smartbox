'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var ApiLog=require('./log');
var Borrow = AV.Object.extend('Borrow');

router.get('/:id/:card/:passage', function(req, res) {
    var deviceId=req.params.id;
    var card=req.params.card;
    var passage=req.params.passage;
    var todo={"ip":req.headers['x-real-ip'],"api":"还货判断接口","deviceId":deviceId,"msg":"card:"+card+",passage:"+passage};
    ApiLog.WorkOn(todo);
    var cardQuery=new AV.Query('EmployeeCard');
    cardQuery.equalTo('isDel',false);
    cardQuery.equalTo('card',card);
    cardQuery.first().then(function(cardObj){
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
	        var oneborrow=new Borrow();
	        var passageQuery=new AV.Query('Passage');
	        passageQuery.equalTo('used',cardObj);
	        passageQuery.equalTo('isDel',false);
	        passageQuery.equalTo('boxId',box);
	        passageQuery.equalTo('flag',passage.substr(0,1));
	        passageQuery.equalTo('seqNo',passage.substr(1,2));
	        passageQuery.first().then(function(data){
	        	if (typeof(data) == "undefined") {
		          var result={
		            status:200,
		            message:"请确认借货卡",
		            data:{"result":false},
		            server_time:new Date()
		          }
		          res.jsonp(result);
		          return;
		        }
	            oneborrow.set('isDel',false);
	            oneborrow.set('deviceId',deviceId);
	            oneborrow.set('time',new Date());
	            oneborrow.set('card',card);
	            oneborrow.set('result',false);
	            oneborrow.set('passage',passage);
	            oneborrow.set('product',data.get('product'));
	            oneborrow.set('borrow',false);
	            oneborrow.save().then(function(one){
	                var result={
	                    status:200,
	                    message:"",
	                    data:{"result":true,"objectId":one.id},
	                    server_time:new Date()
	                }
	                res.jsonp(result);
	            });
	    	});
	    },function (error){
	        console.log(error);
	        var result={
	          status:200,
	          message:"",
	          data:{"result":false},
	          server_time:new Date()
	        }
	        res.jsonp(result);
	    });
    });
});

router.get('/success/:id/', function(req, res) {
    var result={
      status:200,
      message:"",
      data:false,
      server_time:new Date()
    }
    var todo={"ip":req.headers['x-real-ip'],"api":"还货成功回调接口","deviceId":"","msg":"objectId:"+req.params.id};
    ApiLog.WorkOn(todo);
    var borrow=AV.Object.createWithoutData('Borrow',req.params.id);
    borrow.set('result',true);
    borrow.set('borrow',false);
    borrow.save().then(function(data){
        var result={
          status:200,
          message:"",
          data:true,
          server_time:new Date()
        }
        res.jsonp(result);
        var deviceId=borrow.get('deviceId');
        var borrowQuery=new AV.Query('Borrow');
        borrowQuery.get(data.id).then(function(borrowPassage){
            var seqNo=borrowPassage.get('passage').substr(1,2);
            var flag=borrowPassage.get('passage').substr(0,1);
            var boxQuery=new AV.Query('BoxInfo');
            boxQuery.equalTo('deviceId',deviceId);
            boxQuery.first().then(function(box){
                console.log(box);
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
                    cardQuery.equalTo('card',data.card);
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
