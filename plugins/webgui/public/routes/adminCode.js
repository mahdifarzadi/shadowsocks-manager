const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin.code', {
      url: '/code',
      controller: 'AdminCodeController',
      templateUrl: `${ cdn }/public/views/admin/code.html`,
    })
    .state('admin.codePage', {
      url: '/code/:codeCode',
      controller: 'AdminCodePageController',
      templateUrl: `${ cdn }/public/views/admin/codePage.html`,
    })
    .state('admin.addCode', {
      url: '/addCode',
      controller: 'AdminAddCodeController',
      templateUrl: `${ cdn }/public/views/admin/addCode.html`,
    });
  }])
;
