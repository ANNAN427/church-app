"use strict";const i=require("../utils/request.js"),e={imageConfigList:()=>i.request.get("/biz/imageconfig/list",{},{isToken:!1})};exports.imageConfigApi=e;
