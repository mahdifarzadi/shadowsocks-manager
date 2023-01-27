const app = angular.module('app');

app.controller('AdminCodeController', ['$scope', '$state', '$stateParams', 'adminApi', '$mdMedia', '$localStorage', 'codeSortDialog', '$timeout', '$http',
  ($scope, $state, $stateParams, adminApi, $mdMedia, $localStorage, codeSortDialog, $timeout, $http) => {
    $scope.setTitle('Codes');
    $scope.setMenuSearchButton('search');
    $scope.addCode = () => {
      // add code here
      console.log("adding code ...");
      $http.post('/api/admin/code/add', {
        // email: $scope.user.email,
        // password: $scope.user.password,
        // type: $scope.user.type,
      }, {
        timeout: 15000,
      }).then(success => {
        // alertDialog.show('添加用户成功', 'confirm');
        $state.go('admin.code');
      }).catch(() => {
        alertDialog.show('Failed to add code', 'confirm');
      });

      $scope.codes = [];
      $scope.getCodes();

      // $state.go('admin.addCode');
    };

    $scope.setFabButton(() => {
      $scope.addCode();
    });

    if(!$localStorage.admin.codeSortSettings) {
      $localStorage.admin.codeSortSettings = {
        sort: 'id_asc',
        type: {
          normal: true,
          admin: true,
        },
        group: -1,
      };
    }
    $scope.codeSort = $localStorage.admin.codeSortSettings;
    $scope.setMenuRightButton('sort_by_alpha');
    $scope.currentPage = 1;
    $scope.isCodeLoading = false;
    $scope.isCodePageFinish = false;
    $scope.codes = [];
    const getPageSize = () => {
      if($mdMedia('xs')) { return 30; }
      if($mdMedia('sm')) { return 30; }
      if($mdMedia('md')) { return 60; }
      if($mdMedia('gt-md')) { return 80; }
    };
    $scope.getCodes = search => {
      $scope.isCodeLoading = true;
      adminApi.getCode({
        page: $scope.currentPage,
        pageSize: getPageSize(),
        search,
        sort: $scope.codeSort.sort,
        type: $scope.codeSort.type,
        group: $scope.codeSort.group,
      }).then(success => {
        // $scope.total = success.total;
        if($state.current.name !== 'admin.code') { return; }
        $scope.setFabNumber(success.total);
        if(!search && $scope.menuSearch.text) { return; }
        if(search && search !== $scope.menuSearch.text) { return; }
        success.codes.forEach(f => {
          $scope.codes.push(f);
        });
        if(success.maxPage > $scope.currentPage) {
          $scope.currentPage++;
        } else {
          $scope.isCodePageFinish = true;
        }
        $scope.isCodeLoading = false;
      }).catch(() => {
        if($state.current.name !== 'admin.code') { return; }
        $timeout(() => {
          $scope.getCodes(search);
        }, 5000);
      });
    };
    const codeFilter = () => {
      $scope.codes = [];
      $scope.currentPage = 1;
      $scope.isCodePageFinish = false;
      $scope.getCodes($scope.menuSearch.text);
    };
    $scope.toCode = code => {
        $state.go('admin.codePage', { codeCode: code.code });
      // if(user.type === 'normal') {
      //   $state.go('admin.userPage', { userId: user.id });
      // } else {
      //   $state.go('admin.adminPage', { userId: user.id });
      // }
    };
    $scope.$on('cancelSearch', () => {
      $scope.codes = [];
      $scope.currentPage = 1;
      $scope.isCodePageFinish = false;
      $scope.getCodes();
    });
    let timeoutPromise;
    $scope.$watch('menuSearch.text', () => {
      if(!$scope.menuSearch.text) { return; }
      timeoutPromise && $timeout.cancel(timeoutPromise);
      timeoutPromise = $timeout(() => {
        userFilter();
      }, 500);
    });
    $scope.view = (inview) => {
      if(!inview || $scope.isCodeLoading || $scope.isCodePageFinish) { return; }
      $scope.getCodes();
    };
    $scope.codeSortDialog = () => {
      codeSortDialog.show($scope.id).then(() => {
        $scope.codes = [];
        $scope.currentPage = 1;
        $scope.isCodePageFinish = false;
        $scope.getCodes();
      });
    };
    $scope.$on('RightButtonClick', () => {
      $scope.codeSortDialog();
    });
    $scope.codeColor = code => {
      if(code.used) {
        return {
          background: 'red-100', 'border-color': 'blue-300',
        };
      }
      return {};
    };
  }
])
.controller('AdminCodePageController', ['$scope', '$state', '$stateParams', '$http', 'editUserCommentDialog', 'adminApi', 'orderDialog', 'confirmDialog', 'emailDialog', 'addAccountDialog', 'setGroupDialog',
  ($scope, $state, $stateParams, $http, editUserCommentDialog, adminApi, orderDialog, confirmDialog, emailDialog, addAccountDialog, setGroupDialog) => {
    $scope.setTitle('Code Info');
    $scope.setMenuButton('arrow_back', 'admin.code');
    const codeCode = $stateParams.codeCode;
    console.log("----------",codeCode);
    $scope.code = { code: '...' };
    const getCodeData = () => {
      adminApi.getCodeData(codeCode).then(success => {
        $scope.code = success.code;
        // $scope.server = success.server;
        // $scope.alipayOrders = success.alipayOrders;
        // $scope.paypalOrders = success.paypalOrders;
        // $scope.giftCardOrders = success.giftCardOrders;
        // $scope.refOrders = success.refOrders;
        // $scope.refUsers = success.refUsers;
        // $scope.refCodes = success.refCodes;
        // $scope.code.account.forEach(f => {
        //   adminApi.getUserPortLastConnect(f.id).then(success => {
        //     f.lastConnect = success.lastConnect;
        //   });
        // });
        // $scope.user.macAccount = success.macAccount;
      }).catch(err => {
        $state.go('admin.code');
      });
    };
    getCodeData();
    console.log($scope.code, codeCode);
    // $scope.deleteUserAccount = (accountId) => {
    //   confirmDialog.show({
    //     text: '将此账号移除出该用户的列表？',
    //     cancel: 'cancel',
    //     confirm: '移除',
    //     error: '移除账号失败',
    //     fn: function () { return $http.delete(`/api/admin/user/${ userId }/${ accountId }`); },
    //   }).then(() => {
    //     getUserData();
    //   }).catch(() => {

    //   });
    // };
    // $scope.deleteMacAccount = accountId => {
    //   confirmDialog.show({
    //     text: '删除该账号？',
    //     cancel: 'cancel',
    //     confirm: 'delete',
    //     error: '删除账号失败',
    //     fn: function () { return $http.delete('/api/admin/account/mac/', {
    //       params: { id: accountId },
    //     }); },
    //   }).then(() => {
    //     getUserData();
    //   }).catch(() => {

    //   });
    // };
    // $scope.setFabButton(() => {
    //   addAccountDialog.show(userId, $scope.user.account, $scope.server, $scope.id).then(success => {
    //     getUserData();
    //   });
    // });
    // $scope.editMacAccount = account => {
    //   addAccountDialog.edit(account, $scope.user.account, $scope.server).then(success => {
    //     getUserData();
    //   });
    // };
    // $scope.toAccountPage = port => {
    //   adminApi.getAccountId(port).then(id => {
    //     $state.go('admin.accountPage', { accountId: id });
    //   });
    // };
    // $scope.showOrderInfo = order => {
    //   orderDialog.show(order);
    // };
    // $scope.deleteUser = () => {
    //   confirmDialog.show({
    //     text: '真的要删除该用户吗？',
    //     cancel: 'cancel',
    //     confirm: 'delete',
    //     error: '删除用户失败',
    //     fn: function () {
    //       return $http.delete(`/api/admin/user/${ userId }`);
    //     },
    //   }).then(() => {
    //     $state.go('admin.user');
    //   });
    // };
    // $scope.sendEmail = () => {
    //   emailDialog.show(userId);
    // };
    // $scope.setUserGroup = () => {
    //   setGroupDialog.show(userId, $scope.user.group).then(success => {
    //     getUserData();
    //   });
    // };
    // $http.get('/api/admin/group').then(success => {
    //   $scope.groups = success.data;
    //   $scope.groupInfo = {};
    //   $scope.groups.forEach(f => {
    //     $scope.groupInfo[f.id] = { name: f.name, comment: f.comment };
    //   });
    // });
    // $scope.toRefUser = userId => {
    //   $state.go('admin.userPage', { userId });
    // };
    // $scope.deleteRefUser = refUserId => {
    //   confirmDialog.show({
    //     text: '删除该邀请关系？',
    //     cancel: 'cancel',
    //     confirm: 'delete',
    //     error: '删除邀请关系失败',
    //     fn: function () { return $http.delete(`/api/admin/ref/${ userId }/${ refUserId }`); },
    //   }).then(() => {
    //     getUserData();
    //   }).catch(() => {

    //   });
    // };
    // $scope.deleteRefCode = code => {
    //   confirmDialog.show({
    //     text: '删除该邀请码？\n注意，邀请码对应的邀请关系也会一并删除',
    //     cancel: 'cancel',
    //     confirm: 'delete',
    //     error: '删除邀请码失败',
    //     fn: function () { return $http.delete(`/api/admin/ref/${ code }`); },
    //   }).then(() => {
    //     getUserData();
    //   }).catch(() => {

    //   });
    // };
    // $scope.editComment = () => {
    //   editUserCommentDialog.show($scope.user.id, $scope.user.comment).then(() => {
    //     getUserData();
    //   });
    // };
  }
])
// .controller('AdminAddCodeController', ['$scope', '$state', '$stateParams', '$http', 'alertDialog',
//   ($scope, $state, $stateParams, $http, alertDialog) => {
//     $scope.setTitle('add code');
//     $scope.setMenuButton('arrow_back', 'admin.user');
//     $scope.user = { type: 'normal' };
//     $scope.confirm = () => {
//       alertDialog.loading();
//       $http.post('/api/admin/user/add', {
//         email: $scope.user.email,
//         password: $scope.user.password,
//         type: $scope.user.type,
//       }, {
//         timeout: 15000,
//       }).then(success => {
//         alertDialog.show('添加用户成功', 'confirm');
//         $state.go('admin.user');
//       }).catch(() => {
//         alertDialog.show('添加用户失败', 'confirm');
//       });
//     };
//     $scope.cancel = () => {
//       $state.go('admin.user');
//     };
//   }
// ])
// .controller('AdminAdminPageController', ['$scope', '$state', '$stateParams', '$http', 'adminApi', 'setGroupDialog', 'confirmDialog',
//   ($scope, $state, $stateParams, $http, adminApi, setGroupDialog, confirmDialog) => {
//     $scope.setTitle('管理员信息');
//     $scope.setMenuButton('arrow_back', 'admin.user');
//     const userId = $stateParams.userId;
//     $scope.user = { username: '...' };

//     const getAdminData = () => {
//       adminApi.getAdminData(userId).then(success => {
//         $scope.user = success.user;
//       }).catch(err => {
//         $state.go('admin.user');
//       });
//     };
//     getAdminData();

//     $scope.deleteUser = () => {
//       confirmDialog.show({
//         text: '真的要删除该用户吗？',
//         cancel: 'cancel',
//         confirm: 'delete',
//         error: '删除用户失败',
//         fn: function () {
//           return $http.delete(`/api/admin/user/${ userId }`);
//         },
//       }).then(() => {
//         $state.go('admin.user');
//       });
//     };
//     $scope.setUserGroup = () => {
//       setGroupDialog.show(userId, $scope.user.group).then(success => {
//         getAdminData();
//       });
//     };

//     $http.get('/api/admin/group').then(success => {
//       $scope.groups = success.data;
//       $scope.groups.unshift({ id: 0, name: '无分组', comment: '' });
//       $scope.groupInfo = {};
//       $scope.groups.forEach(f => {
//         $scope.groupInfo[f.id] = { name: f.name, comment: f.comment };
//       });
//     });
//   }
// ])
;
