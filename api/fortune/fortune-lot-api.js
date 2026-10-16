"use strict";const t=require("../../utils/request.js"),e={drawLot:e=>t.request.post("/biz/fortunelot/drawlot",e),getLotDetail:e=>t.request.get("/biz/fortunelot/detail",e)};exports.fortuneLotApi=e;
