const uuid=require('uuid/v4');
const {token_len}=require('../config');

let makeToken =(length)=>{
  let key='';
  let len = length || token_len
  while(key.length<len){
    key+=uuid().replace(/\-/g, '');
  }
  return key.substring(0,len);
}

module.exports=makeToken