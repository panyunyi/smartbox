'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var ApiLog=require('./log');
var Borrow = AV.Object.extend('Borrow');
var result={
  status:200,
  message:"无权限",
  data:{"result":false},
  server_time:new Date()
};
router.get('/:id/:card/:passage', function(req, res) {
    result['data']={"result":false};
    let deviceId=req.params.id;
    let card=req.params.card;
    let passage=req.params.passage;
    let todo={"ip":req.headers['x-real-ip'],"api":"还货判断接口","deviceId":deviceId,"msg":"card:"+card+",passage:"+passage};
    ApiLog.WorkOn(todo);
    let cardQuery=new AV.Query('EmployeeCard');
    cardQuery.equalTo('isDel',false);
    let num=card*1;
    let tempCard=PrefixInteger(num.toString(16),6);
    cardQuery.contains('card',tempCard.length>6?tempCard.slice(2):tempCard);
    cardQuery.first().then(function(cardObj){
    	let boxQuery=new AV.Query('BoxInfo');
	    boxQuery.equalTo('deviceId',deviceId);
	    boxQuery.include('cusId');
	    boxQuery.first().then(function (box){
	        if (typeof(box) == "undefined") {
                result['message']="无此货柜";
                res.jsonp(result);
                return;
	        }
	        let oneborrow=new Borrow();
	        let passageQuery=new AV.Query('Passage');
	        passageQuery.equalTo('isDel',false);
	        passageQuery.equalTo('boxId',box);
	        passageQuery.equalTo('flag',passage.substr(0,1));
	        passageQuery.equalTo('seqNo',passage.substr(1,2));
	        passageQuery.first().then(function(passageObj){
                if (typeof(passageObj) == "undefined") {
                    result['message']="格子柜序号有误";
                    res.jsonp(result);
                    return;
                }
                if(passageObj.get('used')==null){
                    result['message']="格子柜无借货人";
                    res.jsonp(result);
                    return;
                }
                if(passageObj.get('used').id!=cardObj.get('emp').id){
                    result['message']="确认借货人";
                    res.jsonp(result);
                    return;
                }
                oneborrow.set('isDel',false);
                oneborrow.set('box',box);
                oneborrow.set('emp',cardObj.get('emp'));
                oneborrow.set('time',new Date());
                oneborrow.set('card',cardObj);
                oneborrow.set('result',true);
                oneborrow.set('passage',passageObj);
                oneborrow.set('product',passageObj.get('product'));
                oneborrow.set('borrow',false);
                oneborrow.save().then(function(one){
                    result['message']="";
                    result['data']={"result":true,"objectId":one.id};
                    res.jsonp(result);
                });
	            passageObj.set('borrowState',false);
                passageObj.increment('stock',1);
                passageObj.set('used',null)
                passageObj.save();
	    	});
	    },function (error){
	        console.log(error);
            result['message']=error;
	        res.jsonp(result);
	    });
    });
});

router.get('/fail/:id/', function(req, res) {
    result['message']="请求失败";
    result['data']=false;
    let todo={"ip":req.headers['x-real-ip'],"api":"还货失败回调接口","deviceId":"","msg":"objectId:"+req.params.id};
    ApiLog.WorkOn(todo);
    let borrow=AV.Object.createWithoutData('Borrow',req.params.id);
    borrow.set('result',false);
    borrow.set('borrow',false);
    borrow.save();
    borrow.fetch().then(function(){
        result['message']="";
        result['data']=true;
        res.jsonp(result);
        let passage=borrow.get('passage');
        passage.fetch().then(function(){
            if(!passage.get('borrowState')){
                passage.set('borrowState',true);
                passage.increment('stock',-1);
                borrow.get('card').fetch().then(function(){
                    passage.set('used',borrow.get('card').get('emp'));
                    passage.save();
                });
            }
        });
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
