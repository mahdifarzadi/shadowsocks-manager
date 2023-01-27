const log4js = require('log4js');
const logger = log4js.getLogger('email');

const nodemailer = require('nodemailer');
const FormData = require('form-data');
const axios = require('axios');
const config = appRequire('services/config').all();
const knex = appRequire('init/knex').knex;
const isInBlackList = appRequire('plugins/email/blackList').isInBlackList;

let emailConfig;
let transporter;

if(!config.plugins.email.type) {
  config.plugins.email.type = 'smtp';
}
if(config.plugins.email.type === 'smtp') {
  emailConfig = {
    host: config.plugins.email.host,
    port: config.plugins.email.port || 465,
    secure: config.plugins.email.hasOwnProperty('secure') ? config.plugins.email.secure : true,
    auth: {
      user: config.plugins.email.username,
      pass: config.plugins.email.password,
    },
    tls: {
      rejectUnauthorized: !config.plugins.email.allowUnauthorizedTls,
    },
    proxy: config.plugins.email.proxy || '',
  };
  transporter = nodemailer.createTransport(emailConfig);
  if(config.plugins.email.proxy && config.plugins.email.proxy.indexOf('socks') >= 0) {
    transporter.set('proxy_socks_module', require('socks'));
  }
} else if (config.plugins.email.type === 'mailgun') {
  emailConfig = {
    baseUrl: config.plugins.email.baseUrl,
    apiKey: config.plugins.email.apiKey,
  };
  config.plugins.email.email = 'mailgun@' + emailConfig.baseUrl.split('/').slice(-1);
  const uri = 'https://api:' + emailConfig.apiKey + '@' + emailConfig.baseUrl.split('https://')[1] + '/messages';
  transporter = {};
  transporter.sendMail = (options, cb) => {
    const form = new FormData();
    form.append('from', options.from);
    form.append('to', options.to);
    form.append('subject', options.subject);
    form.append('text', options.text);
    axios({
      url: uri,
      method: 'POST',
      headers: form.getHeaders(),
      data: form,
    }).then(success => {
      cb(null);
    }).catch(err => {
      cb(err);
    });
    // rp({
    //   uri,
    //   method: 'POST',
    //   form: {
    //     from: options.from,
    //     to: options.to,
    //     subject: options.subject,
    //     text: options.text,
    //   },
    // }).then(success => {
    //   cb(null);
    // }).catch(err => {
    //   cb(err);
    // });
  };
} else if (config.plugins.email.type === 'sendgrid') {
  emailConfig = {
    apiKey: config.plugins.email.apiKey,
  };
  const uri = 'https://api.sendgrid.com/v3/mail/send';
  transporter = {};
  transporter.sendMail = (options, cb) => {
    axios({
      url: uri,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ emailConfig.apiKey }`,
      },
      data: {
        personalizations: [
          {
            to: [{
              email: options.to,
            }]
          }
        ],
        from: {
          email: options.from,
        },
        subject: options.subject,
        content: [{
          type: 'text/plain',
          value: options.text,
        }]
      },
    }).then(success => {
      cb(null);
    }).catch(err => {
      cb(err);
    });
  };
}

const sendMail = async (to, subject, text, options = {}) => {
  if(isInBlackList(to)) {
    logger.error('Email in black list: ' + to);
    return Promise.reject('email in black list');
  }
  const send = (to, subject, text) => {
    return new Promise((resolve, reject) => {
      transporter.sendMail({
        from: `"${ config.plugins.email.name || '' }" <${ config.plugins.email.email || config.plugins.email.username }>`,
        to,
        subject,
        text,
      }, (error, info) => {
        if(error) {
          return reject(error);
        }
        return resolve(info);
      });
    });
  };
  const checkLimit = async (ip = '', session = '') => {
    let ipNumber = await knex('email')
    .where({ ip })
    .whereBetween('time', [Date.now() - 3600 * 1000, Date.now()])
    .count('time as count').then(success => success[0].count);
    let sessionNumber = await knex('email')
    .where({ session })
    .whereBetween('time', [Date.now() - 3600 * 1000, Date.now()])
    .count('time as count').then(success => success[0].count);
    if(ip === '127.0.0.1' || !ip) { ipNumber = 0; }
    if(!session) { sessionNumber = 0; }
    return ipNumber + sessionNumber;
  };
  const number = await checkLimit(options.ip, options.session);
  if(number >= 40) { return Promise.reject('send email out of limit'); }
  await send(to, subject, text);
  await knex('email').insert({
    to,
    subject,
    text,
    type: options.type,
    remark: options.remark,
    ip: options.ip,
    session: options.session,
    telegramId: options.telegramId,
    time: Date.now(),
  });
  return;
};

const sendCode = async (to, subject = 'subject', text, options = {}) => {
  // const sendEmailTime = 10;
  try {
    // const findEmail = await knex('email').select(['remark']).where({
    //   to,
    //   type: 'code',
    // }).whereBetween('time', [Date.now() - sendEmailTime * 60 * 1000, Date.now()]);
    // if(findEmail.length > 0) {
    //   return findEmail[0].remark;
    // }
    const code = Math.random().toString().substr(2, 6);
    if(text.indexOf('${code}') >= 0) {
      text = text.replace(/\$\{code\}/g, '[ ' + code + ' ]');
    } else {
      text += '\n[ ' + code + ' ]';
    }
    await knex('email').insert({
      code: code,
      email: to,
      used: false,
      time: Date.now(),
    });
    // await sendMail(to, subject, text, {
    //   type: 'code',
    //   remark: code,
    //   ip: options.ip,
    //   session: options.session,
    //   telegramId: options.telegramId,
    // });
    logger.info(`[${ to }] Send code: ${ code }`);
    return code;
  } catch (err) {
    logger.error(`Send code fail: ${ err }`);
    return Promise.reject(err);
  }
};

const checkCode = async (email, code) => {
  logger.info(`[${ email }] Check code: ${ code }`);
  // check code existence
  try {
    const findEmail = await knex('email').select(['code']).where({
      // to: email,
      code: code,
      used: false,
    });
    console.log(findEmail, code);
    if(findEmail.length === 0) {
      throw new Error('Email or code not found');
    }
  } catch(err) {
    logger.error(`Check code fail: ${ err }`);
    return Promise.reject(err);
  }
  // update code
  const result = await knex('email').update({ used: true, email: email, time: Date.now() }).where({ code: code });
  logger.info(`[${ email }] Update code: ${ code }`);
};

const checkCodeFromTelegram = async (telegramId, code) => {
  logger.info(`Telegram[${ telegramId }] Check code: ${ code }`);
  const sendEmailTime = 10;
  try {
    const findEmail = await knex('email').where({
      telegramId,
      remark: code,
      type: 'code',
    }).whereBetween('time', [Date.now() - sendEmailTime * 60 * 1000, Date.now()]);
    if(findEmail.length === 0) {
      throw new Error('Email or code not found');
    }
    return findEmail[0];
  } catch(err) {
    logger.error(`Check code fail: ${ err }`);
    return Promise.reject(err);
  }
};

const getCodes = async (used) => {
  const codes = await knex('email').select();
  return codes;
};

const getCodeAndPaging = async (opt = {}) => {
  console.log(opt.sort);
  console.log(opt.type);
  const search = opt.search || '';
  const filter = opt.filter || 'all';
  const sort = opt.sort || 'time_asc';
  const page = opt.page || 1;
  const pageSize = opt.pageSize || 20;
  const type = opt.type || ['true', 'false'];
  // const group = opt.hasOwnProperty('group') ? opt.group : -1;

  const used = type.map(s => {
    if (s == 'true') return true;
    if (s == 'false') return false;
    return null;
  });
  console.log({type, used});


  let count = knex('email').select()
  // .where('id', '>', 1)
  .whereIn('used', used);

  // const hasAlipay = !!config.plugins.alipay && !!config.plugins.alipay.use;
  const columns = [
    'email.code as code',
    'email.email as email',
    'email.time as time',
    'email.used as used',
  ];
  // if(hasAlipay) {
  //   columns.push('alipay.orderId as alipay');
  // }

  let codes = knex('email').select();
  // .leftJoin('user', 'code.email', 'user.email');

  // if(hasAlipay) {
  //   users.leftJoin('alipay', 'user.id', 'alipay.user');
  // }

  codes = codes
  // .where('user.id', '>', 1)
  .whereIn('email.used', used)
  .groupBy('email.code');

  // if(group >= 0) {
  //   count = count.where({ 'user.group': group });
  //   users = users.where({ 'user.group': group });
  // }
  if(search) {
    count = count.where('code', 'like', `%${ search }%`).orWhere('email', 'like', `%${ search }%`);
    codes = users.where('code', 'like', `%${ search }%`).orWhere('email', 'like', `%${ search }%`);
  }

  count = await count.count('code as count').then(success => success[0].count);
  codes = await codes.orderBy(sort.split('_')[0], sort.split('_')[1]).limit(pageSize).offset((page - 1) * pageSize);
  const maxPage = Math.ceil(count / pageSize);
  return {
    total: count,
    page,
    maxPage,
    pageSize,
    codes,
  };
};

const getOneCode = async (codeCode) => {
  const code = await knex('email').select().where({
    code: codeCode,
  });
  if(!code.length) {
    return Promise.reject('Code not found');
  }
  return code[0];
};

exports.checkCodeFromTelegram = checkCodeFromTelegram;
exports.checkCode = checkCode;
exports.sendCode = sendCode;
exports.sendMail = sendMail;
exports.getCodes = getCodes;
exports.getOne = getOneCode;
exports.getCodeAndPaging = getCodeAndPaging;
