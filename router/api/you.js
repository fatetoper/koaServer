const Router=require('koa-router');
const static=require('../../libs/contentStatic');
const {upload,body}=require('../../libs/body');
const CaptchaSDK = require('dx-captcha-sdk')
const Qs = require('qs')
const sendCheck=require('../../libs/sendCheck');
const makeToken=require('../../libs/maketoken');
const makeRandom=require('../../libs/makerandom');


let router=new Router();

// {
//   ok: true, data: [],{}
// }
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
      ctx.body={ok: false, msg: 'data not found:/api/you.js'};
    }
  }catch(e){
    console.log(e);
    // ctx.body={ok: false, msg: e.message};
    ctx.status=500;
    ctx.body={ok: false, msg: 'server error'};
  }
});

router.get('/',async ctx=>{
  ctx.body='<div>嗯呐</div>'
})


// 获取banner	GET	/api/you/banner
router.get('/banner', async ctx=>{
  ctx.body=await ctx.db.query("SELECT name,picUrl,targetUrl FROM you_banner;");
  
});

// 获取nav	GET	/api/you/nav
router.get('/nav/', async ctx=>{
  // console.log("ctx.url:",ctx.url)
  let index = ctx.request.url.replace('/api/you/nav/?index=','');
  console.log("index:",index)
  // console.log("ctx.url.match(/^\/api\/you/i):",ctx.url.startsWith('/api/you'));
  let sql = `SELECT * FROM you_nav where indexP=${index};`;
  let result =await ctx.db.query(sql);
  // console.log(result);

  ctx.body=result;
});

// 获取相关搜索	GET	/api/you/searchautocomplete
router.get('/searchautocomplete/', async ctx=>{

  let kw = ctx.request.url.replace('/api/you/searchautocomplete/?kw=','');
 
  let kwLike = `'%${kw}%'`;
  console.log("kwLike:",kwLike)
  let sql = `SELECT * FROM you_sword where word like ${kwLike};`;
  let result =await ctx.db.query(sql);
  // console.log(result);
  ctx.body=result;
});

router.post('/checkNum/', async ctx=>{
  let aw = Qs.parse(ctx.request.fields.data).data
  let kw = JSON.parse(aw)
  console.log("ctx.request.fields.data.data :",kw)
  // for (let prop in ctx.req) {
  //   if (ctx.req.hasOwnProperty(prop)) {
  //     console.log(`ctx.req.${prop} = ${ctx.req[prop]}`);
  //   } 
  // }
  let sql = `SELECT * FROM you_usrs where tel = ${kw.tel};`;
  let result =await ctx.db.query(sql);
  console.log("result:",result.length);
  if(result.length){
    ctx.body={ok:true};
  }else{
    // 注册临时用户  最好用个存储函数
    let sql = `INSERT INTO you_usrs(tel) VALUES(${kw.tel});`;
    let result =await ctx.db.query(sql);
    console.log(result)
    if(result.affectedRows&&result.affectedRows!==0){
      ctx.body={ok:false,errorText:'注册用户成功'};
    }else{
      ctx.body={ok:false,errorText:'注册用户失败，请重试'};
    }
    
  }
  // 发送验证码
    let makeAndSend= async (tel)=>{
      // 生成验证码
      let random = makeRandom(6)
      console.log("makeRandom(6):",random)
      // 生成token
      let tok = makeToken()
      console.log("tok:",tok)
      // 存入session
      ctx.session[`${tok}`]=random
      console.log("ctx.session.tok:",ctx.session[`${tok}`])
      // 发送验证码
      let res =await sendCheck(tel,random,true)
      // 如果发送成功,存入cookie
      if(res){
        ctx.cookies.set('cnt',tok,{maxAge:10*60*1000})
      }
    }

    // 检查token和验证码
    let checkToken = ctx.cookies.get('cnt',{maxAge:10*60*1000})
    if(checkToken){
      // 查询验证码，重新发送
      let res =ctx.session[checkToken]
      if(res!==undefined){
        console.log("cnt 仍在有效期")
        sendCheck(res)
      }else{
        makeAndSend(kw.tel)
      }
    }else{
      makeAndSend(kw.tel)
    }
    
});

/* router.options('/login',async ctx=>{
  console.log("===========================options==============================")
  console.log("set options: status")
  ctx.status=200
  ctx.set('Access-Control-Allow-Origin','*')
  ctx.set('Access-Control-Allow-Headers','*')
  ctx.set('Access-Control-Allow-Methods','*')

}) */

// ajax+跨域，cookie只能自己处理，浏览器不会帮你
router.post('/login/', async ctx=>{
  console.log("===========================post==============================")
  
  let result = {},
      check = false,
      tok = ctx.cookies.get('cnt'),
      resCheck= ctx.session[`${tok}`]
  let kw = ctx.cookies.get('_dx_uzZo5y')
  let reqData = Qs.parse(ctx.request.fields.data).data
      reqData = JSON.parse(reqData)
  
  let  checkNum = reqData.captch,
       tel = reqData.tel
  console.log("reqData:",reqData);
  console.log("tok:",tok);
  console.log("checkNum:",checkNum);
  console.log("ctx.session.tok:",ctx.session[`${tok}`])
  console.log("kw:",kw);

  // 验证图片
  const sdk = new CaptchaSDK('da7fbbcecea237308fae9e331c9351dd', '043feb6b2e934505eb4b25aa7fbef885')
  sdk.setCaptchaUrl('http://39.149.1.41')
  await sdk.verifyToken(kw,1*1000).then(() => {
    console.log('验证成功,this=',this)
    check = true
  }).catch(err => {
    console.log('验证失败')
  }) 
  if(check){
    // 验证验证码
    console.log("check:",check)
    if(resCheck&&checkNum==resCheck){
      // 生成新token
      let token = makeToken()
      // 生成用户数据--最好用存储过程
      let usrData = 'abcd'
      // 设置cookie，session,删除tok
      ctx.session[token]=usrData
      console.log("token:",token)
      delete ctx.session[`${tok}`]
      ctx.cookies.set('token',token,{maxAge:10*60*1000})
      // 返回成功
      result = {result:true}
    }else{
      result = {result:false,errorText:'登录失败,验证码无效'}
    }
  }else{
    result = {result:false,errorText:'登录失败,您是人吗'}
  }

  ctx.body={
    ...result
  };
});

module.exports=router.routes();
