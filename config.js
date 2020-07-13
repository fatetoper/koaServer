const path=require('path');

module.exports={
  //服务器
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
