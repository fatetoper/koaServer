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
  ctx.body='<div>嗯呐</div>';
  
})


// 获取banner	GET	/api/you/banner
router.get('/banner', async ctx=>{
  ctx.body=await ctx.db.query("SELECT name,picUrl,targetUrl FROM you_banner;");
  
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
