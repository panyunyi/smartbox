'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ApiLog=require('./log');
var moment=require('moment');

//管理卡
router.get('/admincard', function(req, res) {
    var resdata={};
    function promise1(callback){
        var query=new AV.Query('AdminCard');
        query.equalTo('isDel',false);
        query.find().then(function (results){
            var jsondata=[];
            async.map(results,function(result,callback1){
                var arrboxes=[];
            	async.map(result.get('box'),function(boxId,callback2){
            		var box=AV.Object.createWithoutData('BoxInfo',boxId);
            		box.fetch().then(function(data){
                        var boxdata={};
                        boxdata['id']=data.id;
                        boxdata['name']=data.get('deviceId');
                        arrboxes.push(boxdata);
            			callback2(null,boxdata);
            		});
            	},function(err,boxes){
               		var one={"DT_RowId":result.id,"card":result.get('card'),
                    "box":boxes};
                	jsondata.push(one);
                	callback1(null,boxes);
            	});
            },function(err,results2){
                resdata["data"]=jsondata;
                callback(null,jsondata);
            });
        });
    }
    function promise2(callback){
        var query=new AV.Query('BoxInfo');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback1){
                result.set('label',result.get('deviceId'));
                result.set('value',result.id);
                callback1(null,result);
            },function(err,data){
                data={"box[].id":data};
                resdata["options"]=data;
                callback(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            res.jsonp(resdata);
    });
});
//增加管理卡
var AdminCard = AV.Object.extend('AdminCard');
router.post('/admincard/add',function(req,res){
    var arr=req.body;
    var admincard=new AdminCard();
    var box=[];
    var boxarr=[];
    admincard.set('card',arr['data[0][card]']);
    async.times(arr['data[0][box-many-count]']*1,function(i,callback){
        var boxdata={};
        box.push(arr['data[0][box]['+i+'][id]']);
        boxdata['id']=arr['data[0][box]['+i+'][id]'];
        var boxObj=AV.Object.createWithoutData('BoxInfo', arr['data[0][box]['+i+'][id]']);
        boxObj.fetch().then(function(){
            boxdata['name']=boxObj.get('deviceId');
            boxarr.push(boxdata);
            callback(null,boxdata);
        });
    },function(err,results){
        admincard.set('box',box);
        admincard.save().then(function(ac){
            var data=[];
            ac.set('DT_RowId',ac.id);
            ac.set('box',boxarr);
            data.push(ac);
            res.jsonp({"data":data});
        });
    });
});
//更新管理卡
router.put('/admincard/edit/:id',function(req,res){
    var arr=req.body;
    var id=req.params.id;
    var admincard = AV.Object.createWithoutData('AdminCard', id);
    var box=[];
    var boxarr=[];
    admincard.set('card',arr['data['+id+'][card]']);
    async.times(arr['data['+id+'][box-many-count]']*1,function(i,callback){
        var boxdata={};
        box.push(arr['data['+id+'][box]['+i+'][id]']);
        boxdata['id']=arr['data['+id+'][box]['+i+'][id]'];
        var boxObj=AV.Object.createWithoutData('BoxInfo', arr['data['+id+'][box]['+i+'][id]']);
        boxObj.fetch().then(function(){
            boxdata['name']=boxObj.get('deviceId');
            boxarr.push(boxdata);
            callback(null,boxdata);
        });
    },function(err,results){
        admincard.set('box',box);
        admincard.save().then(function(ac){
            var data=[];
            ac.set('DT_RowId',ac.id);
            ac.set('box',boxarr);
            data.push(ac);
            res.jsonp({"data":data});
        });
    });
});
//删除管理卡
router.delete('/admincard/remove/:id',function(req,res){
    var id=req.params.id;
    var admincard = AV.Object.createWithoutData('AdminCard', id);
    admincard.set('isDel',true);
    admincard.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//客户
router.get('/customer',function(req,res){
    var query=new AV.Query('Customer');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        async.map(results,function(result,callback){
            result.set('DT_RowId',result.id);
            result.set('name',result.get('name')?result.get('name'):"");
            result.set('connecter',result.get('connecter')?result.get('connecter'):"");
            result.set('connectPhone',result.get('connectPhone')?result.get('connectPhone'):"");
            result.set('province',result.get('province')?result.get('province'):"");
            result.set('city',result.get('city')?result.get('city'):"");
            result.set('area',result.get('area')?result.get('area'):"");
            result.set('address',result.get('address')?result.get('address'):"");
            callback(null,result);
        },function(err,data){
            res.jsonp({"data":data});
        });
    });
});
//增加客户
var Customer = AV.Object.extend('Customer');
router.post('/customer/add',function(req,res){
    var arr=req.body;
    var customer=new Customer();
    customer.set('name',arr['data[0][name]']);
    customer.set('connecter',arr['data[0][connecter]']);
    customer.set('connectPhone',arr['data[0][connectPhone]']);
    customer.set('province',arr['data[0][province]']);
    customer.set('city',arr['data[0][city]']);
    customer.set('area',arr['data[0][area]']);
    customer.set('address',arr['data[0][address]']);
    customer.set('isDel',false);
    customer.save().then(function(cus){
        var data=[];
        cus.set('DT_RowId',cus.id);
        data.push(cus);
        res.jsonp({"data":data});
    });
});
//更新客户资料
router.put('/customer/edit/:id',function(req,res){
    var arr=req.body;
    var id=req.params.id;
    var customer = AV.Object.createWithoutData('Customer', id);
    customer.set('name',arr['data['+id+'][name]']);
    customer.set('connecter',arr['data['+id+'][connecter]']);
    customer.set('connectPhone',arr['data['+id+'][connectPhone]']);
    customer.set('province',arr['data['+id+'][province]']);
    customer.set('city',arr['data['+id+'][city]']);
    customer.set('area',arr['data['+id+'][area]']);
    customer.set('address',arr['data['+id+'][address]']);
    customer.save().then(function(cus){
        var data=[];
        cus.set('DT_RowId',cus.id);
        data.push(cus);
        res.jsonp({"data":data});
    });
});
//删除客户资料
router.delete('/customer/remove/:id',function(req,res){
    var id=req.params.id;
    var customer = AV.Object.createWithoutData('Customer', id);
    customer.set('isDel',true);
    customer.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//产品
router.get('/product',function(req,res){
    var resdata={};
    function promise1(callback1){
        var query=new AV.Query('Product');
        query.equalTo('isDel',false);
        query.include('type');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('DT_RowId',result.id);
                result.set('typeId',result.get('type').id);
                result.set('type',result.get('type')?result.get('type').get('name'):"");
                result.set('price',result.get('price'));
                result.set('spec',result.get('spec')?result.get('spec'):"");
                result.set('sku',result.get('sku')?result.get('sku'):"");
                callback(null,result);
            },function(err,data){
                resdata["data"]=data;
                callback1(null,data);
            });
        });
    }
    function promise2(callback1){
        var query=new AV.Query('Assortment');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                data={"assort":data};
                resdata["options"]=data;
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            res.jsonp(resdata);
    });
});
//增加产品
var Product = AV.Object.extend('Product');
router.post('/product/add',function(req,res){
    var arr=req.body;
    var product=new Product();
    product.set('name',arr['data[0][name]']);
    product.set('unit',arr['data[0][unit]']);
    var type=AV.Object.createWithoutData('Assortment', arr['data[0][assort]']);
    product.set('type',type);
    product.set('stockDays',arr['data[0][stockDays]']?arr['data[0][stockDays]']*1:1);
    product.set('spec',arr['data[0][spec]']);
    product.set('cue',arr['data[0][cue]']?arr['data[0][cue]']*1:0);
    product.set('price',arr['data[0][price]']?arr['data[0][price]']*1:0);
    product.set('warning',arr['data[0][warning]']?arr['data[0][warning]']*1:0);
    product.set('sku',arr['data[0][sku]']);
    product.set('isDel',false);
    product.save().then(function(pro){
        var data=[];
        pro.set('DT_RowId',pro.id);
        pro.set('typeId',pro.get('type').id);
        pro.set('price',pro.get('price'));
        pro.set('spec',pro.get('spec')?pro.get('spec'):"");
        type.fetch().then(function(){
            pro.set('type',type.get('name'));
            data.push(pro);
            res.jsonp({"data":data});
        });
    },function(error){
        console.log(error);
    });
});
//更新产品资料
router.put('/product/edit/:id',function(req,res){
    var arr=req.body;
    var id=req.params.id;
    var product = AV.Object.createWithoutData('Product', id);
    product.set('name',arr['data['+id+'][name]']);
    product.set('unit',arr['data['+id+'][unit]']);
    var type=AV.Object.createWithoutData('Assortment', arr['data['+id+'][assort]']);
    product.set('type',type);
    product.set('stockDays',arr['data['+id+'][stockDays]']*1);
    product.set('spec',arr['data['+id+'][spec]']);
    product.set('cue',arr['data['+id+'][cue]']*1);
    product.set('price',arr['data['+id+'][price]']*1);
    product.set('warning',arr['data['+id+'][warning]']*1);
    product.set('sku',arr['data['+id+'][sku]']);
    product.set('isDel',false);
    product.save().then(function(pro){
        var data=[];
        pro.set('DT_RowId',pro.id);
        pro.set('typeId',pro.get('type').id);
        pro.set('price',pro.get('price'));
        pro.set('spec',pro.get('spec')?pro.get('spec'):"");
        type.fetch().then(function(){
            pro.set('type',type.get('name'));
            data.push(pro);
            res.jsonp({"data":data});
        });
    });
});
//删除产品
router.delete('/product/remove/:id',function(req,res){
    var id=req.params.id;
    var customer = AV.Object.createWithoutData('Product', id);
    customer.set('isDel',true);
    customer.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//产品分类
router.get('/category',function(req,res){
    var query=new AV.Query('Assortment');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('DT_RowId',result.id);
        });
        res.jsonp({"data":results});
    });
});
//增加产品分类
var Assortment = AV.Object.extend('Assortment');
router.post('/category/add',function(req,res){
    var arr=req.body;
    var assortment=new Assortment();
    assortment.set('name',arr['data[0][name]']);
    assortment.set('isDel',false);
    assortment.save().then(function(ass){
        var data=[];
        ass.set('DT_RowId',ass.id);
        data.push(ass);
        res.jsonp({"data":data});
    });
});
//更新产品分类
router.put('/category/edit/:id',function(req,res){
    var arr=req.body;
    var id=req.params.id;
    var assortment = AV.Object.createWithoutData('Assortment', id);
    assortment.set('name',arr['data['+id+'][name]']);
    assortment.save().then(function(ass){
        var data=[];
        ass.set('DT_RowId',ass.id);
        data.push(ass);
        res.jsonp({"data":data});
    });
});
//删除产品分类
router.delete('/category/remove/:id',function(req,res){
    var id=req.params.id;
    var assortment = AV.Object.createWithoutData('Assortment', id);
    assortment.set('isDel',true);
    assortment.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//客户产品管理
router.get('/customerProduct',function(req,res){
    var resdata={};
    var cus={};
    var pro={};
    function promise1(callback1){
        var query=new AV.Query('CustomerProduct');
        query.equalTo('isDel',false);
        query.include('product');
        query.include('cusId');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('DT_RowId',result.id);
                result.set('sku',result.get('product').get('sku'));
                result.set('productId',result.get('product').id);
                result.set('product',result.get('product').get('name'));
                result.set('cus',result.get('cusId').get('name'));
                result.set('cusId',result.get('cusId').id);
                callback(null,result);
            },function(err,data){
                resdata["data"]=data;
                callback1(null,data);
            });
        });
    }
    function promise2(callback1){
        var query=new AV.Query('Customer');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    function promise3(callback1){
        var query=new AV.Query('Product');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        },
        function (callback){
            promise3(callback);
        }],function(err,results){
            resdata["options"]=Object.assign({"cusId":results[1]},{"productId":results[2]});
            res.jsonp(resdata);
    });
});
//增加客户产品
var Product = AV.Object.extend('CustomerProduct');
router.post('/cusproduct/add',function(req,res){
    var arr=req.body;
    var product=new Product();
    console.log(arr);
    product.set('cusProductPrice',arr['data[0][cusProductPrice]']*1);
    let proobj=AV.Object.createWithoutData('Product', arr['data[0][productId]']);
    product.set('product',proobj);
    let cus=AV.Object.createWithoutData('Customer', arr['data[0][cusId]']);
    product.set('cusId',cus);
    product.set('isDel',false);
    product.save().then(function(pro){
        var data=[];
        pro.set('DT_RowId',pro.id);
        pro.set('cusId',pro.get('cusId').id);
        pro.set('productId',pro.get('product').id);
        pro.set('sku',pro.get('product').get('sku'));
        proobj.fetch().then(function(){
            pro.set('product',proobj.get('name'));
            cus.fetch().then(function(){
                pro.set('cus',cus.get('name'));
                data.push(pro);
                console.log(data);
                res.jsonp({"data":data});
            });
        });
    },function(error){
        console.log(error);
    });
});
//更新客户产品资料
router.put('/cusproduct/edit/:id',function(req,res){
    var arr=req.body;
    var id=req.params.id;
    var product = AV.Object.createWithoutData('CustomerProduct', id);
    product.set('name',arr['data['+id+'][name]']);
    product.set('unit',arr['data['+id+'][unit]']);
    var type=AV.Object.createWithoutData('Assortment', arr['data['+id+'][assort]']);
    product.set('type',type);
    product.set('stockDays',arr['data['+id+'][stockDays]']*1);
    product.set('spec',arr['data['+id+'][spec]']);
    product.set('cue',arr['data['+id+'][cue]']*1);
    product.set('price',arr['data['+id+'][price]']*1);
    product.set('warning',arr['data['+id+'][warning]']*1);
    product.set('sku',arr['data['+id+'][sku]']);
    product.set('isDel',false);
    product.save().then(function(pro){
        var data=[];
        pro.set('DT_RowId',pro.id);
        pro.set('typeId',pro.get('type').id);
        pro.set('price',pro.get('price'));
        pro.set('spec',pro.get('spec')?pro.get('spec'):"");
        type.fetch().then(function(){
            pro.set('type',type.get('name'));
            data.push(pro);
            res.jsonp({"data":data});
        });
    });
});
//删除客户产品
router.delete('/cusproduct/remove/:id',function(req,res){
    var id=req.params.id;
    var customer = AV.Object.createWithoutData('CustomerProduct', id);
    customer.set('isDel',true);
    customer.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//客户员工
router.get('/employee',function(req,res){
    var query=new AV.Query('Employee');
    query.include('cusId');
    var jsondata=[];
    query.find().then(function(results){
        async.map(results,function(result,callback1){
            result.set('isDel',result.get('isDel')?"停用":"启用");
            result.set('sex',result.get('sex')?"男":"女");
            result.set('cusId',result.get('cusId').get('name'));
            result.set('job',result.get('job')?result.get('job'):"");
            result.set('phone',result.get('phone')?result.get('phone'):"");
            result.set('notice',result.get('notice')?result.get('notice'):"");
            result.set('dept',result.get('dept')?result.get('dept'):"");
            async.map(result.get('card'),function(cardId,callback2){
                var card=AV.Object.createWithoutData('EmployeeCard',cardId);
                card.fetch().then(function(one){
                    if(!one.get('isDel')){
                        callback2(null,one.get('card'));
                    }
                });
            },function(err,cards){
                result.set('card',cards);
                jsondata.push(result);
                callback1(null,results);
            });
            //callback1(null,result);
        },function(err,data){
            res.jsonp({"data":jsondata});
        });
    });
});

//员工权限
router.get('/empPower',function(req,res){
    var query=new AV.Query('EmployeePower');
    query.include('boxId');
    query.include('boxId.cusId');
    query.include('product');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('cus',result.get('boxId').get('cusId').get('name'));
            result.set('boxId',result.get('boxId').get('deviceId'));
            result.set('product',result.get('product').get('name'));
            var unit="";
            if(result.get('unit')=="month"){
                unit="月";
            }else if(result.get('unit')=="day"){
                unit="日";
            }else if(result.get('unit')=="year"){
                unit="年";
            }
            result.set('unit',unit);
            result.set('begin',new moment(result.get('begin')).format('L'));
        });
        res.jsonp({"data":results});
    });
});

//售货机管理
router.get('/box',function(req,res){
    var query=new AV.Query('BoxInfo');
    query.equalTo('isDel',false);
    query.include('cusId');
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('cusId',result.get('cusId').get('name'));
            result.set('isLive',result.get('isLive')?"联机":"未联机");
        });
        res.jsonp({"data":results});
    });
});

//售货机货道库存
router.get('/passtock',function(req,res){
    var query=new AV.Query('Passage');
    query.equalTo('isDel',false);
    query.include('boxId');
    query.include('boxId.cusId');
    query.include('product');
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('cus',result.get('boxId').get('cusId').get('name'));
            result.set('boxId',result.get('boxId').get('deviceId'));
            result.set('type',result.get('flag')?"格子柜":"售货机");
            result.set('sku',result.get('product').get('sku')?result.get('product').get('sku'):"");
            result.set('product',result.get('product').get('name'));
            result.set('seqNo',result.get('flag')?result.get('flag')+result.get('seqNo'):result.get('seqNo'));
        });
        res.jsonp({"data":results});
    });
});

//售货机交易记录
router.get('/pasrecord',function(req,res){
    var takeoutQuery=new AV.Query('TakeOut');
    var borrowQuery=new AV.Query('Borrow');
    var jsondata=[];
    function promise1(callback){
        takeoutQuery.equalTo('isDel',false);
        takeoutQuery.equalTo('result',true);
        takeoutQuery.include('product');
        takeoutQuery.include('passage');
        takeoutQuery.include('box');
        takeoutQuery.include('card');
        takeoutQuery.include('box.cusId');
        takeoutQuery.include('card.emp');
        takeoutQuery.find().then(function(takeouts){
            async.map(takeouts,function(takeout,callback1){
                var deviceId=takeout.get('box').get('deviceId');
                var card=takeout.get('card').get('card');
                var sku=takeout.get('product').get('sku')?takeout.get('product').get('sku'):"";
                var product=takeout.get('product').get('name');
                var unit=takeout.get('product').get('unit');
                var passage=takeout.get('passage').get('falg')?takeout.get('passage').get('falg')+takeout.get('passage').get('seqNo'):takeout.get('passage').get('seqNo');
                var time=new moment(takeout.get('time')).format('YYYY-MM-DD HH:mm:ss');
                var cus=takeout.get('box').get('cusId').get('name');
                var emp=takeout.get('card').get('emp').get('name');
                var empNo=takeout.get('card').get('emp').get('empNo');
                var onetake={"time":time,"type":"领料","objectId":takeout.get('id'),
                "cus":cus,"deviceId":deviceId,"passage":passage,"count":-1,
                "product":product,"sku":sku,"unit":unit,"employee":emp,
                "empNo":empNo,"empCard":card};
                jsondata.push(onetake);
                callback1(null,onetake);
            },function(error,results){
                console.log(error);;
                return callback(null,results);
            });
        });
    }
    function promise2(callback){
        borrowQuery.equalTo('isDel',false);
        borrowQuery.equalTo('result',true);
        borrowQuery.include('product');
        borrowQuery.include('passage');
        borrowQuery.include('box');
        borrowQuery.include('card');
        borrowQuery.include('box.cusId');
        borrowQuery.include('card.emp');
        borrowQuery.find().then(function(borrows){
            async.map(borrows,function(borrow,callback1){
                var deviceId=borrow.get('box').get('deviceId');
                var card=borrow.get('card').get('card');
                var sku=borrow.get('product').get('sku')?borrow.get('product').get('sku'):"";
                var product=borrow.get('product').get('name');
                var unit=borrow.get('product').get('unit');
                var passage=borrow.get('passage').get('flag')+borrow.get('passage').get('seqNo');
                var time=new moment(borrow.get('time')).format('YYYY-MM-DD HH:mm:ss');
                var cus=borrow.get('box').get('cusId').get('name');
                var emp=borrow.get('card').get('emp').get('name');
                var empNo=borrow.get('card').get('emp').get('empNo');
                var flag=borrow.get('borrow');
                var oneborrow={"time":time,"type":flag?"借":"还",
                "objectId":borrow.get('id'),"cus":cus,"deviceId":deviceId,
                "passage":passage,"sku":sku,"product":product,"count":flag?-1:+1,
                "unit":unit,"employee":emp,"empNo":empNo,"empCard":card};
                jsondata.push(oneborrow);
                callback1(null,oneborrow);
            },function(error,results){
                console.log(error);
                return callback(null,results);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
        res.jsonp({"data":jsondata});
    });
});

//补货业务
router.get('/supply',function(req,res){
    var query=new AV.Query('Supply');
    query.equalTo('isDel',false);
    query.greaterThan('count',0);
    query.include('box');
    query.include('card');
    query.include('passage');
    query.include('passage.product');
    query.include('box.cusId');
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('product',result.get('passage').get('product').get('name'));
            result.set('time',new moment(result.get('time')).format('YYYY-MM-DD HH:mm:ss'));
            result.set('sku',result.get('passage').get('product').get('sku')?result.get('passage').get('product').get('sku'):"");
            result.set('cus',result.get('box').get('cusId').get('name'));
            result.set('deviceId',result.get('box').get('deviceId'));
            result.set('card',result.get('card').get('card'));
            result.set('passage',result.get('passage').get('flag')?
            result.get('passage').get('flag')+result.get('passage').get('seqNo'):result.get('passage').get('seqNo'));
        });
        res.jsonp({"data":results});
    });
});

//补货计划
router.get('/supplyplan',function(req,res){

});

//盘点业务
router.get('/checklist',function(req,res){

});

router.get('/checkrecord',function(req,res){

});

//仓库管理
router.get('/storehouse',function(req,res){

});

//数据报表
router.get('/charts',function(req,res){

});
module.exports = router;
