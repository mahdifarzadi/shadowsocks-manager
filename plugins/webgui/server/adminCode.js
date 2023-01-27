const email = appRequire('plugins/email/index');
const log4js = require('log4js');
const logger = log4js.getLogger('webgui');


exports.getCodes = async (req, res) => {
  try {
    const page = +req.query.page || 1;
    const pageSize = +req.query.pageSize || 20;
    const search = req.query.search || '';
    const sort = req.query.sort || 'time_asc';
    const type = Array.isArray(req.query.type) ? req.query.type : [req.query.type || ''];
    const group = req.adminInfo.id === 1 ? +req.query.group : req.adminInfo.group;
    let result = await email.getCodeAndPaging({
      page,
      pageSize,
      search,
      sort,
      type,
      group,
    });
    // logger.info(`[${ req }] get codes: ${ result }`);
    console.log(`[${ req }] get codes: ${ result }`);
    result.codes = result.codes.map(m => {
      return {
        code: m.code,
        email: m.email,
        used: m.used,
        time: m.time,
      };
    });
    return res.send(result);
  } catch(err) {
    logger.error(err);
    res.status(403).end();
  }
};

exports.addCode = (req, res) => {
  // req.checkBody('email', 'Invalid email').notEmpty();
  // req.checkBody('password', 'Invalid password').notEmpty();
  // req.checkBody('type', 'Invalid type').isIn(['normal', 'admin']);
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      // const email = req.body.email;
      const password = req.body.password;
      const group = req.adminInfo.id === 1 ? 0 : req.adminInfo.group;
      const type = req.adminInfo.id === 1 ? req.body.type: 'normal' ;
      return email.sendCode(
        "",
        "",
        "",
        null
      );
    }
    result.throw();
  }).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getOneCode = async (req, res) => {
  try {
    const codeCode = +req.params.codeCode;
    const codeInfo = await email.getOne(codeCode);
    // const userAccount = await account.getAccount();
    // userInfo.account = userAccount.filter(f => {
      // return f.userId === +userId;
    // });
    // const ref = await refUser.getRefSourceUser(userId);
    // userInfo.ref = ref;
    return res.send(codeInfo);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};
