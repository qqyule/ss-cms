﻿var $url = '/clouds/settingsAdmin';
var $urlCloud = "cms/clouds";

var data = utils.init({
  cloudType: null,
  expirationDate: null,
  uploadUrl: null,
  uploadFileList: [],
  form: {
    adminTitle: null,
    adminLogoUrl: null,
    adminLogoLinkUrl: null,
    adminWelcomeHtml: null,
  }
});

var methods = {
  apiGet: function () {
    var $this = this;

    utils.loading(this, true);
    $api.get($url).then(function (response) {
      var res = response.data;

      $this.form.adminTitle = res.adminTitle;
      $this.form.adminLogoUrl = res.adminLogoUrl;
      $this.form.adminLogoLinkUrl = res.adminLogoLinkUrl;
      $this.form.adminWelcomeHtml = res.adminWelcomeHtml || '欢迎使用 SS CMS 管理后台';

      if ($this.form.adminLogoUrl) {
        $this.uploadFileList.push({name: 'avatar', url: $this.form.adminLogoUrl});
      }
    }).catch(function (error) {
      utils.error(error);
    }).then(function () {
      utils.loading($this, false);
    });
  },

  apiSubmit: function () {
    var $this = this;

    utils.loading(this, true);
    $api.post($url, {
      adminTitle: $this.form.adminTitle,
      adminLogoUrl: $this.form.adminLogoUrl,
      adminLogoLinkUrl: $this.form.adminLogoLinkUrl,
      adminWelcomeHtml: $this.form.adminWelcomeHtml
    }).then(function (response) {
      var res = response.data;

      utils.success('管理后台设置保存成功！');
    }).catch(function (error) {
      utils.error(error);
    }).then(function () {
      utils.loading($this, false);
    });
  },

  apiCloudGet: function() {
    var $this = this;

    utils.loading(this, true);
    cloud.get($urlCloud).then(function (response) {
      var res = response.data;

      $this.cloudType = res.cloudType;
      $this.expirationDate = res.expirationDate;

      $this.apiGet();
    }).catch(function (error) {
      utils.error(error, {
        ignoreAuth: true,
      });
    }).then(function () {
      utils.loading($this, false);
    });
  },

  checkCloudType: function() {
    if (this.cloudType == 'Free') {
      alert({
        title: '后台版权设置',
        text: '系统检测到您的云助手版本为免费版，使用后台版权设置功能请升级云助手版本！',
        type: 'warning',
        confirmButtonText: '关 闭',
        showConfirmButton: true,
        showCancelButton: false,
        buttonsStyling: false,
      });
      return true;
    }
    return false;
  },

  btnSubmitClick: function () {
    if (this.checkCloudType()) return;

    var $this = this;
    this.$refs.form.validate(function(valid) {
      if (valid) {
        $this.apiSubmit();
      }
    });
  },

  uploadBefore(file) {
    if (this.checkCloudType()) {
      return false;
    }

    var re = /(\.jpg|\.jpeg|\.bmp|\.gif|\.png|\.webp)$/i;
    if(!re.exec(file.name))
    {
      utils.error('管理后台Logo只能是图片格式，请选择有效的文件上传!');
      return false;
    }

    var isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      utils.error('管理后台Logo图片大小不能超过 10MB!');
      return false;
    }
    return true;
  },

  uploadProgress: function() {
    utils.loading(this, true);
  },

  uploadSuccess: function(res, file, fileList) {
    this.form.adminLogoUrl = res.value;
    utils.loading(this, false);
    if (fileList.length > 1) fileList.splice(0, 1);
  },

  uploadError: function(err) {
    utils.loading(this, false);
    var error = JSON.parse(err.message);
    utils.error(error.message);
  },

  uploadRemove(file) {
    this.form.adminLogoUrl = null;
  },

  btnCloseClick: function() {
    utils.removeTab();
  },
};

var $vue = new Vue({
  el: '#main',
  data: data,
  methods: methods,
  created: function () {
    utils.keyPress(this.btnSubmitClick, this.btnCloseClick);
    this.uploadUrl = $apiUrl + $url + '/actions/upload';
    var $this = this;
    cloud.checkAuth(function() {
      $this.apiCloudGet();
    });
  }
});
