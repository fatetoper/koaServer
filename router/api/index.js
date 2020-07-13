const Router=require('koa-router');
const static=require('../../libs/contentStatic');
const {upload,body}=require('../../libs/body');


let router=new Router();



// {
//   ok: true, data: [],{}
// }
//
// {
//   ok: false, msg: '参数有误/数据不存在'
// }

router.use(async (ctx,next)=>{
  try{
    await next();

    if(ctx.body!==undefined){
      ctx.status=200;
      ctx.body={ok: true, data: ctx.body};
    }else{
      ctx.status=404;
      ctx.body={ok: false, msg: 'data not found'};
    }
  }catch(e){
    console.log(e);
    // ctx.body={ok: false, msg: e.message};
    ctx.status=500;
    ctx.body={ok: false, msg: 'api server error'};
  }
});

// 获取banner	GET	/api/banner
router.get('/banner', async ctx=>{
  ctx.body=await ctx.db.query("SELECT title,sub_title,image FROM banner_table");
  
});

const page_size=5;

function preprocess(datas){
  datas.forEach(data=>{
    //1.features
    //上牌时间,表显里程,本车排量,变速箱,车辆性质
    let arr=data.features.split(',');
    let json={};

    arr.forEach(str=>{
      let [key,value]=str.split('|');
      json[key]=value;
    });

    data['time']=parseInt(json['上牌时间']);
    data['mileage']=json['表显里程'];
    data['dispalce']=json['本车排量'];
    data['transmission']=json['变速箱'];
    data['type']=json['车辆性质'];

    delete data.features;

    //2.images
    data.image=data.images.split(',')[0];
    delete data.images;
  });

  return datas;
}

// 获取车辆列表	GET	/api/carlist/:page
router.get('/carlist/:page', async ctx=>{
  let {page}=ctx.params;

  let datas=await ctx.db.query("SELECT ID,title,price,features,description,images FROM car_table ORDER BY ID DESC LIMIT ?,?", [
    (page-1)*page_size, page_size
  ]);

  ctx.body=preprocess(datas);
});

// 获取车辆总页数	GET	/api/carpage
router.get('/carpage', async ctx=>{
  let rows=await ctx.db.query("SELECT count(*) AS c FROM car_table");
  ctx.body={
    count: Math.ceil(rows[0].c/page_size)
  };
});

// 获取车辆详情	GET	/api/car/:id
router.get('/car/:id', async ctx=>{
  let rows=await ctx.db.query("SELECT * FROM car_table WHERE ID=?", [ctx.params.id]);

  ctx.body=rows[0];
});
//
// 获取“精选好车”	GET	/api/chosencar
// 最贵的6个
router.get('/chosencar', async ctx=>{
  let datas=await ctx.db.query("SELECT ID,title,price,features,description,images FROM car_table ORDER BY price DESC LIMIT 6");

  ctx.body=preprocess(datas);
});

// 获取“最新好车”	GET	/api/latestcar
// 最新的3个
router.get('/latestcar', async ctx=>{
  let datas=await ctx.db.query("SELECT ID,title,price,features,description,images FROM car_table ORDER BY ID DESC LIMIT 3");

  ctx.body=preprocess(datas);
});

//
// 发送留言	POST	/api/msg
router.post('/msg', ...upload(), async ctx=>{
  let {name,email,title,content}=ctx.request.fields;

  await ctx.db.query("INSERT INTO msg_table (name,email,title,content) VALUES(?,?,?,?)", [name,email,title,content]);
  ctx.body='ok';
});


router.use('/db', require('./db'));
router.use('/you', require('./you'));
router.use('/list', require('./list'));
router.use('/mena', require('./mena'));
module.exports=router.routes();
