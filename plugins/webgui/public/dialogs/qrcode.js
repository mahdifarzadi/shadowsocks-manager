const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('qrcodeDialog', [ '$mdDialog', '$mdToast', ($mdDialog, $mdToast) => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  const toast = (delay = 3000) => {
    $mdToast.show(
      $mdToast.simple()
        .textContent('link copied')
        .position('top right')
        .hideDelay(delay)
    );
  };
  publicInfo.hide = hide;
  publicInfo.toast = toast;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/user/qrcodeDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$mdMedia', 'bind', function($scope, $mdDialog, $mdMedia, bind) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '400px' };
      };
    }],
    fullscreen: true,
    clickOutsideToClose: true,
  };
  const show = (serverName, ssAddress) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.serverName = serverName;
    publicInfo.ssAddress = ssAddress+'?plugin=v2ray-plugin';
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);
