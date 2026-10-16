"use strict";
const e = require("../../common/vendor.js");
const l = {
    __name: "index",
    setup(n) {
        const o = e.ref("");
        const s = (e) => { o.value = e.detail.value };
        const v = () => {
            if (!o.value.trim()) {
                e.index.showToast({ title: "请输入数字佛ID", icon: "none" });
                return;
            }
            const id = o.value.trim();
            e.index.setStorageSync("user_buddha_id", id);
            e.index.showToast({ title: "设置成功，数字佛ID: " + id, icon: "success" });
            o.value = "";
        };
        return (t, l) => {
            return {
                a: t.t(o.value),
                b: t.o(s),
                c: t.o(v)
            };
        };
    }
};
const i = e._export_sfc(l, [["__scopeId", "data-v-invite-buddha"]]);
wx.createPage(i);
