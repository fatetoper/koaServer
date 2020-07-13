const Koa=require('koa');
const config=require('./config');
// const opn=require('opn');
const network=require('./libs/network');
const {post, upload}=require('./libs/body');
const fs=require('promise-fs');
const ejs=require('koa-ejs');
const path=require('path');
const cors = require('koa2-cors');

let server=new Koa();


//...
(async ()=>{
  
  server.use(cors({
    origin: function (ctx) {
        if (ctx.url === '/test') {
            return "*"; // 允许来自所有域名请求
        }
        
        if(ctx.url.startsWith('/api/you')){
          return 'http://localhost'
        }
        // if(ctx.url.startsWith('/api/meta')){
        //   return 'http://localhost'
        // }
        return 'http://localhost:8081'; // 这样就能只允许 http://localhost:80
    },
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  }))
  
//   最简单的app.use(post());
//   略微灵活点的：app.use(post(), 其他中间件);
//   可以让post仅对部分东西其效果
  server.use(post())

  // 全局引入 MySQL、Redis客户端
  server.context.db=await require('./libs/mysql');
  server.context.redis=require('./libs/redis');

  //
  let error_404='';
  try{
    error_404=await fs.readFile(config.errors_404);
    error_404=error_404.toString();
  }catch(e){
    console.log('read 404 file error');
  }

  let error_500='';
  try{
    error_500=await fs.readFile(config.errors_500);
    error_500=error_500.toString();
  }catch(e){
    console.log('read 500 file error');
  }

  //全局错误处理
  server.use(async (ctx,next)=>{
    try{
      await next();

      if(!ctx.body){
        ctx.status=404;
        ctx.body=error_404||'Not Found';
      }
    }catch(e){
      ctx.status=500;
      ctx.body=error_500||'Internal Server Error';

      console.error(e);
    }
  });

  //session
  await require('./libs/session')(server);

  //router
  server.use(require('./router'));

  //ejs
  ejs(server, {
    root: path.resolve(__dirname, 'template'),
    layout: false,
    viewExt: 'ejs',
    cache: false,
    debug: false
  });

  server.listen(config.port);

  // 打印监听端口
  network.forEach(ip=>{
    if(config.port==80){
      console.log(`server running at http://${ip}`);
    }else{
      console.log(`server running at http://${ip}:${config.port}`);
    }
  });

  // opn(`http://localhost:${config.port}/`);
})();
