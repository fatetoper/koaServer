/*
 * @Author: fatetoper
 * @Date: 2019-07-19 08:59:46
 * @LastEditors: fatetoper
 * @LastEditTime: 2020-09-14 20:37:35
 * @Modultype: Component
 * @Usage: import/global/prototype
 * @Description: Do not edit
 * @FilePath: \node\config.js
 */
const path=require('path');

module.exports={
  //服务器
  host: 'localhost',
  port: 8081,
  md5_key: 'SDfdfg5aO*&$O%ohlkuIYIUOR$LUI$HR(&*FHULI$HRGSDLKJFHSDILUY$*OOY$IUHILUFH*O$&TIGRgrdrgd大概多少风格士大夫敢死队风格让他如果士大夫敢死队发)',

  //数据库
  db_host: 'localhost',
  db_port: 3306,
  db_user: 'root',
  db_pass: 'root',
  db_name: 'z_blue_cars',

  //redis
  redis_host: 'localhost',
  redis_port: 6379,
  // redis_pass: '',

  //upload
  upload_dir: path.resolve(__dirname, 'upload'),
  upload_tmp: path.resolve(__dirname, 'upload\\tmp'),

  //session
  maxAge: 86400*1000,

  //key
  key_count: 1024,
  key_len: 1024,
  key_path: path.resolve(__dirname, '.keys'),

  token_len: 32,

  //static
  static_path: path.resolve(__dirname, 'static'),

  //errors
  errors_404: path.resolve(__dirname, 'errors/404.html'),
  errors_500: path.resolve(__dirname, 'errors/500.html'),
};
