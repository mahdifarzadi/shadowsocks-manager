const manager = appRequire('services/manager');
const serverManager = appRequire('plugins/flowSaver/server');
const webguiTag = appRequire('plugins/webgui_tag');
const knex = appRequire('init/knex').knex;

exports.getServers = (req, res) => {
  serverManager.list({
    status: !!req.query.status,
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};

exports.getOneServer = (req, res) => {
  const serverId = req.params.serverId;
  const noPort = req.query.noPort;
  let result = null;
  knex('server').select().where({
    id: +serverId,
  }).then(success => {
    if(success.length) {
      result = success[0];
      if(noPort) { return; }
      return manager.send({
        command: 'list',
      }, {
        host: success[0].host,
        port: success[0].port,
        password: success[0].password,
      });
    }
    res.status(404).end();
  }).then(success => {
    if(success) { result.ports = success; }
    res.send(result);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};

exports.addServer = async (req, res) => {
  try {
    req.checkBody('type', 'Invalid type').notEmpty();
    req.checkBody('name', 'Invalid name').notEmpty();
    req.checkBody('address', 'Invalid address').notEmpty();
    req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
    req.checkBody('password', 'Invalid password').notEmpty();
    req.checkBody('method', 'Invalid method').notEmpty();
    req.checkBody('scale', 'Invalid scale').notEmpty();
    req.checkBody('shift', 'Invalid shift').isInt();
    const result = await req.getValidationResult();
    if(!result.isEmpty()) { return Promise.reject(result.array()); }
    const type = req.body.type;
    const isWG = type === 'WireGuard';
    const isTj = type === 'Trojan';
    const name = req.body.name;
    const comment = req.body.comment;
    const address = req.body.address;
    const port = +req.body.port;
    const password = req.body.password;
    const method = req.body.method;
    const scale = req.body.scale;
    const shift = isWG ? 0 : req.body.shift;
    const key = isWG ? req.body.key : null;
    const net = isWG ? req.body.net: null;
    const wgPort = isWG ? req.body.wgPort : null;
    const tjPort = isTj ? req.body.tjPort : null;
    const pluginOptions = req.body.pluginOptions;
    await manager.send({
      command: 'flow',
      options: { clear: false, },
    }, {
      host: address,
      port,
      password,
    });
    const [ serverId ] = await serverManager.add({
      type,
      name,
      host: address,
      port,
      password,
      method,
      scale,
      comment,
      shift,
      key,
      net,
      wgPort,
      tjPort,
      pluginOptions,
    });
    res.send({ serverId });
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.editServer = async (req, res) => {
  try {
    req.checkBody('type', 'Invalid type').notEmpty();
    req.checkBody('name', 'Invalid name').notEmpty();
    req.checkBody('address', 'Invalid address').notEmpty();
    req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
    req.checkBody('password', 'Invalid password').notEmpty();
    req.checkBody('method', 'Invalid method').notEmpty();
    req.checkBody('scale', 'Invalid scale').notEmpty();
    req.checkBody('shift', 'Invalid shift').isInt();
    const result = await req.getValidationResult();
    if(!result.isEmpty()) { return Promise.reject(result.array()); }
    const serverId = req.params.serverId;
    const type = req.body.type;
    const isWG = type === 'WireGuard';
    const isTj = type === 'Trojan';
    const name = req.body.name;
    const comment = req.body.comment;
    const address = req.body.address;
    const port = +req.body.port;
    const password = req.body.password;
    const method = req.body.method;
    const scale = req.body.scale;
    const shift = isWG ? 0 : req.body.shift;
    const key = isWG ? req.body.key : null;
    const net = isWG ? req.body.net: null;
    const wgPort = isWG ? req.body.wgPort : null;
    const tjPort = isTj ? req.body.tjPort : null;
    const pluginOptions = req.body.pluginOptions;
    const check = +req.body.check;
    await manager.send({
      command: 'flow',
      options: { clear: false, },
    }, {
      host: address,
      port,
      password,
    });
    await serverManager.edit({
      id: serverId,
      type,
      name,
      host: address,
      port,
      password,
      method,
      scale,
      comment,
      shift,
      key,
      net,
      wgPort,
      tjPort,
      pluginOptions,
      check,
    });
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.deleteServer = (req, res) => {
  const serverId = req.params.serverId;
  serverManager.del(serverId)
  .then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getTags = async (req, res) => {
  try {
    const type = req.query.type;
    const key = +req.query.key;
    const tags = await webguiTag.getTags(type, key);
    res.send(tags);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.setTags = async (req, res) => {
  try {
    const type = req.body.type;
    const key = +req.body.key;
    const tags = req.body.tags;
    await webguiTag.setTags(type, key, tags);
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};
