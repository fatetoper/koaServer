/*
 * @Author: fatetoper
 * @Date: 2019-07-19 08:59:46
 * @LastEditors: fatetoper
 * @LastEditTime: 2020-09-04 15:07:16
 * @Modultype: Component
 * @Usage: import/global/prototype
 * @Description: Do not edit
 * @FilePath: \node\libs\body.js
 */
const body=require('koa-better-body');
const convert=require('koa-convert');
const config=require('../config');

module.exports={
  post(){
    return convert(body({
      multipart: false,
      buffer: false
    }));
  },
  upload(options){
    options=options||{};

    options.uploadDir = options.uploadDir ? config.upload_dir + '\\' + options.uploadDir : config.upload_dir;
    options.maxFileSize = options.maxFileSize||20*1024*1024;
    // console.log('upload==>options',options)
    return [
      async (ctx,next)=>{
        try{
          await next();
        }catch(e){
          if(e.message.startsWith('maxFileSize exceeded')){
            if(options.sizeExceed){
              await options.sizeExceed(ctx);
            }else{
              ctx.body='文件过大';
            }
          }else{
            if(options.error){
              await options.error(ctx, e);
            }else{
              throw e;
            }
          }
        }
      },
      convert(body({
        uploadDir: options.uploadDir,
        maxFileSize: options.maxFileSize,
      })),
    ];
  }
};
