// relationship-calculator.js
// v711-51-fix-v157 新增：同步模式 0a-1a/0a-1/0a-2（丈夫的爸爸的姐妹/兄弟/叔祖父系列）+ 模式 0j-2（丈夫的妈妈的爸爸的兄弟姐妹）+ 模式 0h-3/0h-3b（妈妈的爸爸的兄弟/姐妹）+ 模式 0h-4（妈妈的妈妈的爸爸的兄弟 - 外曾叔祖父系列）
// v711-51-fix-v156 新增：同步模式 0k 系列（丈夫的爸爸的爸爸的兄弟、妻子的爸爸的爸爸的兄弟姐妹、丈夫的爸爸的妈妈的兄弟）
//                    同步模式 0h-4（爸爸的兄弟的子女的后代 - 堂亲系列）
//                    添加对应的反向关系数据

// ========== 通用称谓计算函数（从 family-tree.js 移植 v711-51-fix-v67） ==========
  function calculateUniversalTitle(chain, sex) {
    if (!chain || chain.length === 0) return null;
    
    // v711-51-fix-v2: 纯兄弟姐妹关系（无祖先 f/m，无向下 s/d）返回 null，让原有逻辑处理
    // 修复：安文杰视角下哥哥安文东显示为远祖父的问题
    // v711-51-fix-v8: 纯后代关系链（只有 s/d）不应该返回 null，应该继续处理
    // v711-51-fix-v23: 纯兄弟姐妹关系（os/ls/ob/lb）也不应该返回 null，应该由模式 0b 处理
    // 修复付芊雨视角下姐姐显示为 null 的问题
    var hasAncestor = false;
    var hasDescendant = false;
    var hasSibling = false;
    for (var i = 0; i < chain.length; i++) {
      if (chain[i] === 'f' || chain[i] === 'm') {
        hasAncestor = true;
        break;
      }
      if (chain[i] === 's' || chain[i] === 'd') {
        hasDescendant = true;
      }
      if (chain[i] === 'os' || chain[i] === 'ls' || chain[i] === 'ob' || chain[i] === 'lb') {
        hasSibling = true;
      }
    }
    // 只有纯兄弟姐妹关系（无祖先、无后代、无兄弟姐妹）才返回 null
    // 但如果有兄弟姐妹关系（os/ls/ob/lb），应该继续由模式 0b 处理
    if (!hasAncestor && !hasDescendant && !hasSibling) return null;
    
    // 辈分称谓前缀（按向上代数）- 单字版本
    var genPrefixSingle = ['', '父', '祖', '曾', '高', '天', '烈', '太', '远'];
    // 辈分称谓前缀（按向上代数）- 完整版本
    var genPrefixFull = ['', '父', '祖', '曾祖', '高祖', '天祖', '烈祖', '太祖', '远祖'];
    
    // 分析关系链
    var genUp = 0, genDown = 0, lastGender = 'male', maternalCount = 0;
    for (var i = 0; i < chain.length; i++) {
      var rel = chain[i];
      if (rel === 'f') { genUp++; lastGender = 'male'; }
      else if (rel === 'm') { genUp++; maternalCount++; lastGender = 'female'; }
      else if (rel === 's') { genDown++; lastGender = 'male'; }
      else if (rel === 'd') { genDown++; lastGender = 'female'; }
      else if (rel === 'ob' || rel === 'lb') { lastGender = 'male'; }
      else if (rel === 'os' || rel === 'ls') { lastGender = 'female'; }
      else if (rel === 'h') { lastGender = 'male'; }
      else if (rel === 'w') { lastGender = 'female'; }
    }
    
    // 找到姐妹位置（第一个 os/ls）
    var sisterIndex = -1;
    for (var i = 0; i < chain.length; i++) {
      if (chain[i] === 'os' || chain[i] === 'ls') { sisterIndex = i; break; }
    }
    
    // 找到配偶位置（第一个 h/w）
    var spouseIndex = -1;
    for (var i = 0; i < chain.length; i++) {
      if (chain[i] === 'h' || chain[i] === 'w') { spouseIndex = i; break; }
    }
    
    // 判断是否有"姐妹的配偶"（配偶在姐妹之后）
    var hasSibSpouse = (spouseIndex >= 0 && sisterIndex >= 0 && spouseIndex > sisterIndex);
    // 判断配偶后是否有其他关系
    var spouseHasAfter = (spouseIndex >= 0 && spouseIndex < chain.length - 1);
    
    // ========== 模式 0：女性视角称谓（丈夫方亲属） ==========
    // 修复付芊雨视角：公公/婆婆/爷爷/奶奶/姐姐/姐夫/外甥/外甥女/侄子等
    // 余泽友视角特殊处理：妻子的妹妹的丈夫的儿子 = 姻侄
    if (chain.length === 4 && chain[0] === 'w' && chain[1] === 'ls' && chain[2] === 'h' && chain[3] === 's') {
      return '姻侄';
    }
    
    // 余泽友视角特殊处理：妻子的妹妹的丈夫的哥哥的儿子 = 姻侄
    if (chain.length === 5 && chain[0] === 'w' && chain[1] === 'ls' && chain[2] === 'h' && (chain[3] === 'ob' || chain[3] === 'lb') && chain[4] === 's') {
      return '姻侄';
    }
    
    // v711-51-fix-v29: 处理丈夫方亲属
    // 排除：丈夫的妈妈的亲属（由模式 0g-3 处理）
    if (chain[0] === 'h') {
      // 排除丈夫的妈妈的亲属系列（由模式 0g-3 处理）
      if (chain.length >= 2 && chain[1] === 'm') {
        // 让模式 0g-3 处理，不在此返回
      }
      // 排除丈夫的兄弟姐妹的妻子的亲属（由模式 0g 处理）
      else if (chain.length >= 3 && (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 'w') {
        // 让模式 0g 处理，不在此返回
      } else {
      // 关系链以丈夫开始，说明是女性视角看丈夫方亲属
      var afterHusbandChain = chain.slice(1); // 去掉'h'后的关系链
      
      // 分析丈夫后的关系
      var hGenUp = 0, hGenDown = 0;
      var hSisterIndex = -1, hBrotherIndex = -1, hSpouseIndex = -1;
      for (var i = 0; i < afterHusbandChain.length; i++) {
        var rel = afterHusbandChain[i];
        if (rel === 'f' || rel === 'm') hGenUp++;
        else if (rel === 's' || rel === 'd') hGenDown++;
        else if (rel === 'os' || rel === 'ls') {
          if (hSisterIndex < 0) hSisterIndex = i;
        }
        else if (rel === 'ob' || rel === 'lb') {
          if (hBrotherIndex < 0) hBrotherIndex = i;
        }
      }
      for (var i = 0; i < afterHusbandChain.length; i++) {
        if (afterHusbandChain[i] === 'h' || afterHusbandChain[i] === 'w') {
          hSpouseIndex = i; break;
        }
      }
      
      // 公公/婆婆：我的丈夫的爸爸/妈妈
      if (afterHusbandChain.length === 1) {
        if (afterHusbandChain[0] === 'f') return '公公';
        if (afterHusbandChain[0] === 'm') return '婆婆';
      }
      
      // 爷爷/奶奶：我的丈夫的爸爸的爸爸/妈妈
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'f') {
        if (afterHusbandChain[1] === 'f') return '爷爷';
        if (afterHusbandChain[1] === 'm') return '奶奶';
      }
      
      // 姐姐/妹妹/哥哥/弟弟：我的丈夫的姐姐/妹妹/哥哥/弟弟（无后代）
      if (afterHusbandChain.length === 1) {
        var firstRel = afterHusbandChain[0];
        if (firstRel === 'os') return '姐姐';
        if (firstRel === 'ls') return '妹妹';
        if (firstRel === 'ob') return '哥哥';
        if (firstRel === 'lb') return '弟弟';
      }
      
      // 姐夫/嫂子：我的丈夫的姐姐/哥哥的配偶
      if (hSpouseIndex >= 0 && hSpouseIndex === 1) {
        if (hSisterIndex === 0 && (afterHusbandChain[1] === 'h')) return '姐夫';
        if (hBrotherIndex === 0 && (afterHusbandChain[1] === 'w')) return '嫂子';
      }
      
      // 外甥/外甥女：我的丈夫的姐姐的儿子/女儿（仅姐妹的子女）
      // 关系链：h, os/ls, s/d（长度为 2：去掉 h 后是 [os/ls, s/d]）
      if (hSisterIndex === 0 && hGenDown === 1 && hGenUp === 0 && hSpouseIndex < 0 && afterHusbandChain.length === 2) {
        var childRel = afterHusbandChain[1];
        if (childRel === 's') return '外甥';
        if (childRel === 'd') return '外甥女';
      }
      
      // 侄子/侄女：我的丈夫的哥哥的儿子/女儿（仅哥哥的子女）
      // 关系链：h, ob/lb, s/d（长度为 2：去掉 h 后是 [ob/lb, s/d]）
      if (hBrotherIndex === 0 && hGenDown === 1 && hGenUp === 0 && hSpouseIndex < 0 && afterHusbandChain.length === 2) {
        var childRel = afterHusbandChain[1];
        if (childRel === 's') return '侄子';
        if (childRel === 'd') return '侄女';
      }
      } // 结束 else 块
    } // v711-51-fix-v29: 结束模式 0（丈夫方亲属）
    
    // ========== 模式 0a-1a：丈夫的爸爸的姐妹系列（姑妈系列） ==========
    // 处理：丈夫的爸爸的姐妹及其后代（h-f-[os/ls]）
    if (chain[0] === 'h' && chain.length >= 3 && chain[1] === 'f' && 
        (chain[2] === 'os' || chain[2] === 'ls')) {
      var husbandAuntRel = chain[2]; // os/ls
      var afterHusbandAuntChain = chain.slice(3); // 去掉 [h, f, os/ls] 后的关系链
      
      // 丈夫的爸爸的姐姐：姑妈
      if (afterHusbandAuntChain.length === 0 && husbandAuntRel === 'os') {
        return '姑妈';
      }
      // 丈夫的爸爸的妹妹：姑妈
      if (afterHusbandAuntChain.length === 0 && husbandAuntRel === 'ls') {
        return '姑妈';
      }
      
      // 丈夫的爸爸的姐妹的丈夫：姑父
      if (afterHusbandAuntChain.length === 1 && afterHusbandAuntChain[0] === 'h') {
        return '姑父';
      }
      
      // 丈夫的爸爸的姐妹的子女：表兄弟/表姐妹
      if (afterHusbandAuntChain.length === 1) {
        if (afterHusbandAuntChain[0] === 's') {
          return '表兄弟';
        }
        if (afterHusbandAuntChain[0] === 'd') {
          return '表姐妹';
        }
      }
      
      // 丈夫的爸爸的姐妹的子女的配偶
      if (afterHusbandAuntChain.length === 2) {
        if (afterHusbandAuntChain[0] === 's' && afterHusbandAuntChain[1] === 'w') {
          return '表兄弟媳';
        }
        if (afterHusbandAuntChain[0] === 'd' && afterHusbandAuntChain[1] === 'h') {
          return '表姐妹夫';

            // 表姐妹的子女的配偶：表外甥媳/表外甥女婿
            if (afterHusbandAuntChain.length >= 3 && afterHusbandAuntChain[0] === 'd') {
              if (afterHusbandAuntChain[1] === 's' && afterHusbandAuntChain[2] === 'w') {
                return '表外甥媳';
              }
              if (afterHusbandAuntChain[1] === 'd' && afterHusbandAuntChain[2] === 'h') {
                return '表外甥女婿';
              }
            }
        }
      }
      
      // 丈夫的爸爸的姐妹的子女的后代
      if (afterHusbandAuntChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterHusbandAuntChain.length - 1; i >= 0; i--) {
          if (afterHusbandAuntChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterHusbandAuntChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 表兄弟的子女 = 表侄/表侄女
        if (afterHusbandAuntChain[0] === 's' && afterHusbandAuntChain.length === 2) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        // 表姐妹的子女 = 表外甥/表外甥女
        if (afterHusbandAuntChain[0] === 'd' && afterHusbandAuntChain.length === 2) {
          return lastGenGender === 'male' ? '表外甥' : '表外甥女';
        }
        if (afterHusbandAuntChain.length === 3) {
          return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
        }
        if (afterHusbandAuntChain.length === 4) {
          return lastGenGender === 'male' ? '表侄曾孙' : '表侄曾孙女';
        }
        if (afterHusbandAuntChain.length === 5) {
          return lastGenGender === 'male' ? '表外甥曾孙' : '表外甥曾孙女';
        }
      }
    }
    
    // ========== 模式 0a-1：丈夫的爸爸的兄弟系列 ==========
    // 处理：丈夫的爸爸的兄弟及其后代
    if (chain[0] === 'h' && chain.length >= 3 && chain[1] === 'f' && 
        (chain[2] === 'ob' || chain[2] === 'lb')) {
      var husbandUncleRel = chain[2]; // ob/lb
      var afterHusbandUncleChain = chain.slice(3); // 去掉 [h, f, ob/lb] 后的关系链
      
      // 丈夫的爸爸的哥哥：伯父
      if (afterHusbandUncleChain.length === 0 && husbandUncleRel === 'ob') {
        return '伯父';
      }
      // 丈夫的爸爸的弟弟：叔父
      if (afterHusbandUncleChain.length === 0 && husbandUncleRel === 'lb') {
        return '叔父';
      }
      
      // 丈夫的爸爸的兄弟的妻子：伯母/叔母
      if (afterHusbandUncleChain.length === 1 && afterHusbandUncleChain[0] === 'w') {
        return husbandUncleRel === 'ob' ? '伯母' : '叔母';
      }
      
      // 丈夫的爸爸的兄弟的子女：堂兄弟/堂姐妹
      if (afterHusbandUncleChain.length === 1) {
        if (afterHusbandUncleChain[0] === 's') {
          return '堂兄弟';
        }
        if (afterHusbandUncleChain[0] === 'd') {
          return '堂姐妹';
        }
      }
      
      // 丈夫的爸爸的兄弟的子女的配偶
      if (afterHusbandUncleChain.length === 2) {
        if (afterHusbandUncleChain[0] === 's' && afterHusbandUncleChain[1] === 'w') {
          return '堂兄弟媳';
        }
        if (afterHusbandUncleChain[0] === 'd' && afterHusbandUncleChain[1] === 'h') {
          return '堂姐妹夫';
        }
      }
      
      // 丈夫的爸爸的兄弟的子女的后代
      if (afterHusbandUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterHusbandUncleChain.length - 1; i >= 0; i--) {
          if (afterHusbandUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterHusbandUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 堂兄弟的子女 = 堂侄/堂侄女
        if (afterHusbandUncleChain[0] === 's' && afterHusbandUncleChain.length === 2) {
          return lastGenGender === 'male' ? '堂侄' : '堂侄女';
        }
        // 堂姐妹的子女 = 堂外甥/堂外甥女
        if (afterHusbandUncleChain[0] === 'd' && afterHusbandUncleChain.length === 2) {
          return lastGenGender === 'male' ? '堂外甥' : '堂外甥女';
        }
        if (afterHusbandUncleChain.length === 3) {
          return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
        }
        if (afterHusbandUncleChain.length === 4) {
          return lastGenGender === 'male' ? '堂侄曾孙' : '堂侄曾孙女';
        }
        if (afterHusbandUncleChain.length === 5) {
          return lastGenGender === 'male' ? '堂外甥曾孙' : '堂外甥曾孙女';
        }
      }
    }
    
    // ========== 模式 0a-2：丈夫的爸爸的爸爸的兄弟系列 ==========
    // 处理：丈夫的爸爸的爸爸的兄弟及其后代（h-f-f-[ob/lb]）
    if (chain[0] === 'h' && chain.length >= 4 && chain[1] === 'f' && 
        chain[2] === 'f' && 
        (chain[3] === 'ob' || chain[3] === 'lb')) {
      var husbandGreatUncleRel = chain[3]; // ob/lb
      var afterHusbandGreatUncleChain = chain.slice(4); // 去掉 [h, f, f, ob/lb] 后的关系链
      
      // 丈夫的爸爸的爸爸的哥哥：伯祖父
      if (afterHusbandGreatUncleChain.length === 0 && husbandGreatUncleRel === 'ob') {
        return '伯祖父';
      }
      // 丈夫的爸爸的爸爸的弟弟：叔祖父
      if (afterHusbandGreatUncleChain.length === 0 && husbandGreatUncleRel === 'lb') {
        return '叔祖父';
      }
      
      // 丈夫的爸爸的爸爸的兄弟的妻子：伯祖母/叔祖母
      if (afterHusbandGreatUncleChain.length === 1 && afterHusbandGreatUncleChain[0] === 'w') {
        return husbandGreatUncleRel === 'ob' ? '伯祖母' : '叔祖母';
      }
      
      // 丈夫的爸爸的爸爸的兄弟的子女（堂伯父/堂叔父/堂姑母系列）
      if (afterHusbandGreatUncleChain.length === 1) {
        if (afterHusbandGreatUncleChain[0] === 's') {
          return husbandGreatUncleRel === 'ob' ? '堂伯父' : '堂叔父';
        }
        if (afterHusbandGreatUncleChain[0] === 'd') {
          return '堂姑母';
        }
      }
      
      // 丈夫的爸爸的爸爸的兄弟的子女的配偶
      if (afterHusbandGreatUncleChain.length === 2) {
        if (afterHusbandGreatUncleChain[0] === 's' && afterHusbandGreatUncleChain[1] === 'w') {
          return husbandGreatUncleRel === 'ob' ? '堂伯母' : '堂叔母';
        }
        if (afterHusbandGreatUncleChain[0] === 'd' && afterHusbandGreatUncleChain[1] === 'h') {
          return '堂姑父';
        }
      }
      
      // 丈夫的爸爸的爸爸的兄弟的子女的后代（堂兄弟姐妹/表兄弟姐妹系列）
      if (afterHusbandGreatUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterHusbandGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterHusbandGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterHusbandGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 儿子的子女：堂兄弟/堂姐妹
        if (afterHusbandGreatUncleChain[0] === 's' && afterHusbandGreatUncleChain.length === 2) {
          return lastGenGender === 'male' ? '堂兄弟' : '堂姐妹';
        }
        // 女儿的子女：表兄弟/表姐妹（因为女儿嫁出去了）
        if (afterHusbandGreatUncleChain[0] === 'd' && afterHusbandGreatUncleChain.length === 2) {
          return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
        }
        
        // 更深后代
        if (afterHusbandGreatUncleChain.length === 3) {
          return lastGenGender === 'male' ? '堂侄' : '堂侄女';
        }
        if (afterHusbandGreatUncleChain.length === 4) {
          return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
        }
      }
    }
    
    // 修复: 姐妹统称的丈夫 = 姐夫/妹夫/姐妹夫
    if (chain.length === 2 && chain[0] === 'xs' && chain[1] === 'h') {
      return '姐妹夫';
    }
    // 修复: 姐妹统称的妻子 = 嫂子/弟媳/兄弟媳
    if (chain.length === 2 && chain[0] === 'xs' && chain[1] === 'w') {
      return '兄弟媳';
    }
    // ========== 模式 0b：女性视角称谓（自己的兄弟姐妹及其子女） ==========
    // 修复付芊雨视角：姐姐/哥哥/弟弟/妹妹/外甥/外甥女/外甥孙/外甥曾孙等
    // 区分：兄弟的子女=侄子/侄女，姐妹的子女=外甥/外甥女
    console.log('[模式 0b 检查] chain[0] =', chain[0], 'chain =', chain);
    if (chain[0] === 'os' || chain[0] === 'ls' || chain[0] === 'ob' || chain[0] === 'lb' || chain[0] === 'xs') {
      console.log('[模式 0b 匹配] sibRel =', chain[0]);
      var sibRel = chain[0]; // os/ls/ob/lb
      var afterSibChain = chain.slice(1);
      console.log('[模式 0b] afterSibChain =', afterSibChain, 'length =', afterSibChain.length);
      
      // 兄弟姐妹称谓（无后代）- 区分长幼
      if (afterSibChain.length === 0) {
        if (sibRel === 'os') return '姐姐';
        if (sibRel === 'ls') return '妹妹';
        if (sibRel === 'ob') return '哥哥';
        if (sibRel === 'lb') return '弟弟';
      }
      
      // 兄弟姐妹的配偶
      if (afterSibChain.length === 1 && (afterSibChain[0] === 'h' || afterSibChain[0] === 'w')) {
        if (sibRel === 'os') {
          if (afterSibChain[0] === 'h') return '姐夫';
          if (afterSibChain[0] === 'w') return '嫂子';
        }
        if (sibRel === 'ls') {
          if (afterSibChain[0] === 'h') return '妹夫';
          if (afterSibChain[0] === 'w') return '嫂子';
        }
        if (sibRel === 'ob') {
          if (afterSibChain[0] === 'w') return '嫂子';
          if (afterSibChain[0] === 'h') return '姐夫';
        }
        if (sibRel === 'lb') {
          if (afterSibChain[0] === 'w') return '弟媳';
          if (afterSibChain[0] === 'h') return '妹夫';
        }
      }
      
      // 分析兄弟姐妹后的关系
      var sibGenDown = 0;
      for (var i = 0; i < afterSibChain.length; i++) {
        if (afterSibChain[i] === 's' || afterSibChain[i] === 'd') sibGenDown++;
      }
      
      // 判断最后一代性别
      var lastGenGender = 'male';
      for (var i = chain.length - 1; i >= 0; i--) {
        if (chain[i] === 's' || chain[i] === 'ob' || chain[i] === 'lb') { lastGenGender = 'male'; break; }
        else if (chain[i] === 'd' || chain[i] === 'os' || chain[i] === 'ls') { lastGenGender = 'female'; break; }
      }
      
      // 兄弟姐妹的子女（sibGenDown === 1）
      if (sibGenDown === 1 && afterSibChain.length >= 1) {
        var childRel = afterSibChain[0];
        if (sibRel === 'ob' || sibRel === 'lb') {
          if (childRel === 's') return '侄子';
          if (childRel === 'd') return '侄女';
        }
        if (sibRel === 'os' || sibRel === 'ls') {
          if (childRel === 's') return '外甥';
          if (childRel === 'd') return '外甥女';
        }
      }
      
      // 侄孙/侄孙女/外甥孙/外甥孙女（sibGenDown === 2）
      if (sibGenDown === 2 && afterSibChain.length >= 2) {
        // 兄弟的儿子的子女 = 侄孙/侄孙女
        if ((sibRel === 'ob' || sibRel === 'lb') && afterSibChain[0] === 's') {
          if (afterSibChain.length === 3 && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
            // 不处理，让后面代码处理侄孙女婿
          } else {
            var grandchildRel = afterSibChain[1];
            if (grandchildRel === 's') return '侄孙';
            if (grandchildRel === 'd') return '侄孙女';
          }
        }
        // 兄弟的女儿的子女 = 外甥孙/外甥孙女
        if ((sibRel === 'ob' || sibRel === 'lb') && afterSibChain[0] === 'd') {
          if (afterSibChain.length === 3 && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
            // 不处理，让后面代码处理外孙女婿
          } else if (afterSibChain.length === 3 && afterSibChain[1] === 's' && afterSibChain[2] === 'w') {
            // 不处理，让后面代码处理外甥孙媳
          } else {
            var grandchildRel = afterSibChain[1];
            if (grandchildRel === 's') return '外甥孙';
            if (grandchildRel === 'd') return '外甥孙女';
          }
        }
        // 姐妹的儿子的子女 = 外甥孙/外甥孙女
        if ((sibRel === 'os' || sibRel === 'ls') && afterSibChain[0] === 's') {
          var grandchildRel = afterSibChain[1];
          if (grandchildRel === 's') return '外甥孙';
          if (grandchildRel === 'd') return '外甥孙女';
        }
        // 姐妹的女儿的子女 = 外甥外甥孙/外甥外甥孙女
        if ((sibRel === 'os' || sibRel === 'ls') && afterSibChain[0] === 'd') {
          var grandchildRel = afterSibChain[1];
          if (grandchildRel === 's') return '外甥外甥孙';
          if (grandchildRel === 'd') return '外甥外甥孙女';
        }
      }
      
      // 曾孙辈（sibGenDown === 3）
      if (sibGenDown === 3 && afterSibChain.length >= 3) {
        // 兄弟的儿子的儿子的子女
        if ((sibRel === 'ob' || sibRel === 'lb') && afterSibChain[0] === 's' && afterSibChain[1] === 's') {
          var greatGrandchildRel = afterSibChain[2];
          if (greatGrandchildRel === 's') return '侄曾孙';
          if (greatGrandchildRel === 'd') return '侄曾孙女';
        }
        // 兄弟的女儿的儿子的子女
        if ((sibRel === 'ob' || sibRel === 'lb') && afterSibChain[0] === 'd' && afterSibChain[1] === 's') {
          var greatGrandchildRel = afterSibChain[2];
          if (greatGrandchildRel === 's') return '外甥曾孙';
          if (greatGrandchildRel === 'd') return '外甥曾孙女';
        }
        // 姐妹的儿子的儿子的子女
        if ((sibRel === 'os' || sibRel === 'ls') && afterSibChain[0] === 's' && afterSibChain[1] === 's') {
          var greatGrandchildRel = afterSibChain[2];
          if (greatGrandchildRel === 's') return '外甥曾孙';
          if (greatGrandchildRel === 'd') return '外甥曾孙女';
        }
        // 姐妹的女儿的儿子的子女
        if ((sibRel === 'os' || sibRel === 'ls') && afterSibChain[0] === 'd' && afterSibChain[1] === 's') {
          var greatGrandchildRel = afterSibChain[2];
          if (greatGrandchildRel === 's') return '外甥外甥曾孙';
          if (greatGrandchildRel === 'd') return '外甥外甥曾孙女';
        }
      }
      
      // 玄孙辈（sibGenDown === 4）
      if (sibGenDown === 4 && afterSibChain.length >= 4 && afterSibChain[0] === 's') {
        var pxRel = afterSibChain[3];
        if (sibRel === 'ob' || sibRel === 'os') {
          if (pxRel === 's') return '外甥玄孙';
          if (pxRel === 'd') return '外甥玄孙女';
        }
        if (sibRel === 'lb' || sibRel === 'ls') {
          if (pxRel === 's') return '侄玄孙';
          if (pxRel === 'd') return '侄玄孙女';
        }
      }
      
      // 来孙辈（sibGenDown === 5）
      if (sibGenDown === 5 && afterSibChain.length >= 5 && afterSibChain[0] === 's') {
        var lsRel = afterSibChain[4];
        if (sibRel === 'ob' || sibRel === 'os') {
          if (lsRel === 's') return '外甥来孙';
          if (lsRel === 'd') return '外甥来孙女';
        }
        if (sibRel === 'lb' || sibRel === 'ls') {
          if (lsRel === 's') return '侄来孙';
          if (lsRel === 'd') return '侄来孙女';
        }
      }
      
      // 侄媳/侄女婿：我的哥哥/弟弟的儿子的妻子/女儿的丈夫
      // 外甥媳/外甥女婿：我的姐姐/妹妹的儿子的妻子/女儿的丈夫
      if (sibGenDown === 2 && afterSibChain.length >= 2 && afterSibChain[0] === 's' && afterSibChain[1] === 'w') {
        if (sibRel === 'ob' || sibRel === 'lb') return '侄媳';
        if (sibRel === 'os' || sibRel === 'ls') return '外甥媳';
      }
      if (sibGenDown === 2 && afterSibChain.length >= 2 && afterSibChain[0] === 'd' && afterSibChain[1] === 'h') {
        if (sibRel === 'ob' || sibRel === 'lb') return '侄女婿';
        if (sibRel === 'os' || sibRel === 'ls') return '外甥女婿';
      }
      
      // 外甥孙媳/侄孙媳：我的兄弟姐妹的儿子的儿子的妻子
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 's' && afterSibChain[1] === 's' && afterSibChain[2] === 'w') {
        if (sibRel === 'ob' || sibRel === 'os') return '外甥孙媳';
        if (sibRel === 'lb' || sibRel === 'ls') return '侄孙媳';
      }
      
      // 外甥孙女女婿/侄孙女女婿：我的兄弟姐妹的儿子的女儿的丈夫
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 's' && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
        if (sibRel === 'ob' || sibRel === 'os') return '外甥孙女女婿';
        if (sibRel === 'lb' || sibRel === 'ls') return '侄孙女女婿';
      }
      
      // 外甥孙女婿/侄孙女婿：我的兄弟姐妹的女儿的儿子的妻子（女儿嫁出，子女随外姓）
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 's' && afterSibChain[2] === 'w') {
        if (sibRel === 'ob' || sibRel === 'os') return '外甥孙女婿';
        if (sibRel === 'lb' || sibRel === 'ls') return '侄孙女婿';
      }
      
      // 修复 v711-51-fix-v137: 弟弟/哥哥的儿子的女儿的丈夫 = 侄孙女婿
      if (sibGenDown === 2 && afterSibChain.length === 3 && afterSibChain[0] === 's' && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
        if (sibRel === 'ob' || sibRel === 'lb') return '侄孙女婿';
        if (sibRel === 'os' || sibRel === 'ls') return '外孙女婿';
      }
      
      // 修复 v711-51-fix-v138: 弟弟/哥哥的女儿的儿子的丈夫 = 外孙女婿
      if (sibGenDown === 2 && afterSibChain.length === 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
        if (sibRel === 'ob' || sibRel === 'lb') return '外孙女婿';
        if (sibRel === 'os' || sibRel === 'ls') return '外孙女婿';
      }
      
      // 修复 v711-51-fix-v137: 弟弟/哥哥的女儿的儿子的妻子 = 外孙媳
      if (sibGenDown === 2 && afterSibChain.length === 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 's' && afterSibChain[2] === 'w') {
        if (sibRel === 'ob' || sibRel === 'lb') return '外孙媳';
        if (sibRel === 'os' || sibRel === 'ls') return '外甥孙媳';
      }
      
      // 外甥外甥孙/侄外甥孙：我的兄弟姐妹的女儿的儿子
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 's') {
        if (sibRel === 'ob' || sibRel === 'os') return '外甥外甥孙';
        if (sibRel === 'lb' || sibRel === 'ls') return '侄外甥孙';
      }
      
      // 外甥外甥女/侄外甥女：我的兄弟姐妹的女儿的女儿
      if (sibGenDown === 3 && afterSibChain.length >= 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 'd') {
        if (sibRel === 'ob' || sibRel === 'os') return '外甥外甥女';
        if (sibRel === 'lb' || sibRel === 'ls') return '侄外甥女';
      }
    }
    
    // ========== 模式 0c：姻亲系列（兄弟姐妹的妻子的亲属）==========
    // 处理：弟弟/哥哥的妻子的姐姐/爸爸/妈妈等
    // 关系链：ob/lb/os/ls, w, ...
    if (chain.length >= 2 && (chain[0] === 'ob' || chain[0] === 'lb' || chain[0] === 'os' || chain[0] === 'ls') && chain[1] === 'w') {
      var sibRel = chain[0]; // ob/lb/os/ls
      var afterWifeChain = chain.slice(2); // 去掉 [sib, w] 后的关系链
      var isElderBrother = (chain[0] === 'ob' || chain[0] === 'os'); // 哥哥/姐姐
      var isYoungerBrother = (chain[0] === 'lb' || chain[0] === 'ls'); // 弟弟/妹妹
      var isMaleSib = (chain[0] === 'ob' || chain[0] === 'lb'); // 哥哥/弟弟
      var isFemaleSib = (chain[0] === 'os' || chain[0] === 'ls'); // 姐姐/妹妹
      
      // 弟弟/哥哥/姐姐/妹妹的妻子（afterWifeChain 为空）
      if (afterWifeChain.length === 0) {
        if (sibRel === 'ob') return '嫂子';
        if (sibRel === 'lb') return '弟媳';
        if (sibRel === 'os') return '嫂子'; // 女同场景
        if (sibRel === 'ls') return '弟媳'; // 女同场景（妹妹的妻子）
      }
      
      // 妻子的兄弟姐妹的子女的配偶：姻外甥媳/姻外甥女婿（优先检查，避免被下面的逻辑覆盖）
      if (afterWifeChain.length >= 3 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls' || afterWifeChain[0] === 'ob' || afterWifeChain[0] === 'lb')) {
        if (afterWifeChain[1] === 's' && afterWifeChain[2] === 'w') return '姻外甥媳';
        if (afterWifeChain[1] === 'd' && afterWifeChain[2] === 'h') return '姻外甥女婿';
      }
      
      // 妻子的兄弟姐妹的子女：姻外甥/姻外甥女（仅当关系链长度为 2 时匹配，避免覆盖更长的关系链）
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls' || afterWifeChain[0] === 'ob' || afterWifeChain[0] === 'lb')) {
        var childRel = afterWifeChain[1];
        if (childRel === 's') return '姻外甥';
        if (childRel === 'd') return '姻外甥女';
      }
      
      // 妻子的父母：姻伯/姻伯母
      if (afterWifeChain.length === 1) {
        if (afterWifeChain[0] === 'f') return '姻伯';
        if (afterWifeChain[0] === 'm') return '姻伯母';
      }
      
      // 妻子的兄弟姐妹：姻姐/姻妹/姻兄/姻弟
      if (afterWifeChain.length === 1) {
        if (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') {
          // 妻子的姐姐：姻姐
          return '姻姐';
        }
        if (afterWifeChain[0] === 'ob' || afterWifeChain[0] === 'lb') {
          // 妻子的哥哥：姻兄
          return '姻兄';
        }
      }
      
      // 妻子的姐妹的丈夫：姻姐夫/姻妹夫
      if (afterWifeChain.length === 2 && afterWifeChain[1] === 'h') {
        if (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') {
          return '姻姐夫';
        }
      }
      
      // 妻子的姐妹的子女：姻侄/姻侄女
      if (afterWifeChain.length === 1 && (afterWifeChain[0] === 's' || afterWifeChain[0] === 'd')) {
        if (afterWifeChain[0] === 's') return '姻侄';
        if (afterWifeChain[0] === 'd') return '姻侄女';
      }
      
      // 妻子的兄弟的子女：姻侄/姻侄女（修复余泽友视角：妻子的妹妹的丈夫的儿子）
      if (afterWifeChain.length === 2 && afterWifeChain[0] === 'h' && (afterWifeChain[1] === 's' || afterWifeChain[1] === 'd')) {
        if (afterWifeChain[1] === 's') return '姻侄';
        if (afterWifeChain[1] === 'd') return '姻侄女';
      }
      
      // 妻子的姐妹的后代：通用公式计算称谓
      // 基础称谓：genDown=1→外甥，2→外甥孙，3→外甥曾孙，4→外甥玄孙，5→外甥来孙
      // 性别后缀：最后一代是女性则加"女"
      // 配偶后缀：最后是 h→女婿，w→媳
      if (afterWifeChain.length >= 1 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls')) {
        var genDown = 0;
        for (var i = 1; i < afterWifeChain.length; i++) {
          if (afterWifeChain[i] === 's' || afterWifeChain[i] === 'd') genDown++;
        }
        // 判断最后一代性别（排除配偶 h/w）
        var lastGender = 'male';
        for (var i = afterWifeChain.length - 1; i >= 0; i--) {
          if (afterWifeChain[i] === 's' || afterWifeChain[i] === 'ob' || afterWifeChain[i] === 'lb') {
            lastGender = 'male'; break;
          } else if (afterWifeChain[i] === 'd' || afterWifeChain[i] === 'os' || afterWifeChain[i] === 'ls') {
            lastGender = 'female'; break;
          }
        }
        // 判断是否有配偶关系（最后一个是 h 或 w）
        var lastRel = afterWifeChain[afterWifeChain.length - 1];
        var hasSpouseAtEnd = (lastRel === 'h' || lastRel === 'w');
        
        // 基础称谓映射
        var baseTitle = '';
        if (genDown === 1) baseTitle = '姻外甥';
        else if (genDown === 2) baseTitle = '姻外甥孙';
        else if (genDown === 3) baseTitle = '姻外甥曾孙';
        else if (genDown === 4) baseTitle = '姻外甥玄孙';
        else if (genDown === 5) baseTitle = '姻外甥来孙';
        
        if (baseTitle !== '') {
          // 有配偶后缀
          if (hasSpouseAtEnd) {
            if (lastRel === 'h') return baseTitle + '女婿';
            if (lastRel === 'w') return baseTitle + '媳';
          }
          // 无配偶后缀，加性别
          return lastGender === 'male' ? baseTitle : baseTitle + '女';
        }
      }
    }
    
    // ========== 模式 0d：姻亲系列（姐妹/女儿的丈夫的亲属）==========
    // 处理：姐姐/妹妹/女儿的丈夫的爸爸/妈妈/哥哥/弟弟/子女等
    // 关系链：os/ls/d, h, ...
    if (chain.length >= 2 && (chain[0] === 'os' || chain[0] === 'ls' || chain[0] === 'd') && chain[1] === 'h') {
      var sibRel = chain[0]; // os/ls/d
      var afterHusbandChain = chain.slice(2); // 去掉 [sib, h] 后的关系链
      var isElderSister = (chain[0] === 'os'); // 姐姐
      var isYoungerSister = (chain[0] === 'ls'); // 妹妹
      var isDaughter = (chain[0] === 'd'); // 女儿
      
      // 女儿的丈夫的亲属：亲家系列
      if (isDaughter) {
        // 女儿的丈夫的爸爸：亲家公
        if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'f') {
          return '亲家公';
        }
        // 女儿的丈夫的妈妈：亲家母
        if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'm') {
          return '亲家母';
        }
        // 女儿的丈夫的爸爸的爸爸：亲家爷爷/姻伯祖父
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'f' && afterHusbandChain[1] === 'f') {
          return '亲家爷爷';
        }
        // 女儿的丈夫的哥哥：姻侄
        if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'ob') {
          return '姻侄';
        }
        // 女儿的丈夫的哥哥的妻子：姻侄媳
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'ob' && afterHusbandChain[1] === 'w') {
          return '姻侄媳';
        }
        // 女儿的丈夫的姐姐：姻侄女
        if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'os') {
          return '姻侄女';
        }
        // 女儿的丈夫的姐姐的丈夫：姻侄女婿
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'os' && afterHusbandChain[1] === 'h') {
          return '姻侄女婿';
        }
        // 女儿的丈夫的姐姐的儿子：姻侄外孙
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'os' && afterHusbandChain[1] === 's') {
          return '姻侄外孙';
        }
        // 女儿的丈夫的姐姐的女儿：姻侄外孙女
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'os' && afterHusbandChain[1] === 'd') {
          return '姻侄外孙女';
        }
        // 女儿的丈夫的哥哥的儿子：姻侄孙
        if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'ob' && afterHusbandChain[1] === 's') {
          return '姻侄孙';
        }
      }
      
      // 姐妹的丈夫的子女：姻侄/姻侄女
      if (afterHusbandChain.length === 1) {
        if (afterHusbandChain[0] === 's') return '姻侄';
        if (afterHusbandChain[0] === 'd') return '姻侄女';
      }
      
      // 姐妹的丈夫的爸爸：姻伯
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'f') {
        return '姻伯';
      }
      
      // 姐妹的丈夫的妈妈：姻伯母
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'm') {
        return '姻伯母';
      }
      
      // 姐妹的丈夫的爸爸的爸爸：姻爷爷
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'f' && afterHusbandChain[1] === 'f') {
        return '姻爷爷';
      }
      
      // 姐妹的丈夫的爸爸的妈妈：姻奶奶
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'f' && afterHusbandChain[1] === 'm') {
        return '姻奶奶';
      }
      
      // 姐妹的丈夫的哥哥/弟弟/姐姐/妹妹：姻兄/姻弟/姻姐/姻妹
      if (afterHusbandChain.length === 1) {
        if (afterHusbandChain[0] === 'ob') return '姻兄';
        if (afterHusbandChain[0] === 'lb') return '姻弟';
        if (afterHusbandChain[0] === 'os') return '姻姐';
        if (afterHusbandChain[0] === 'ls') return '姻妹';
      }
      
      // 姐妹的丈夫的姐姐的丈夫：姻姐夫
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'os' && afterHusbandChain[1] === 'h') {
        return '姻姐夫';
      }
      
      // 姐妹的丈夫的姐姐的子女：姻外甥/姻外甥女
      if (afterHusbandChain.length >= 2 && (afterHusbandChain[0] === 'os' || afterHusbandChain[0] === 'ls')) {
        if (afterHusbandChain[1] === 's') return '姻外甥';
        if (afterHusbandChain[1] === 'd') return '姻外甥女';
      }
      
      // 姐妹的丈夫的哥哥的妻子：姻兄媳
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'ob' && afterHusbandChain[1] === 'w') {
        return '姻兄媳';
      }
      
      // 姐妹的丈夫的哥哥的子女：姻外甥/姻外甥女
      if (afterHusbandChain.length >= 2 && afterHusbandChain[0] === 'ob') {
        if (afterHusbandChain[1] === 's') return '姻外甥';
        if (afterHusbandChain[1] === 'd') return '姻外甥女';
      }
    }
    
    // ========== 模式 0e：儿子的妻子的亲属系列 ==========
    // 处理：儿子的妻子的爸爸/妈妈/哥哥/姐姐/子女等
    // 关系链：s, w, ...
    if (chain.length >= 2 && chain[0] === 's' && chain[1] === 'w') {
      var afterWifeChain = chain.slice(2); // 去掉 [s, w] 后的关系链
      
      // 儿子的妻子的爸爸：亲家公
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'f') {
        return '亲家公';
      }
      
      // 儿子的妻子的妈妈：亲家母
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'm') {
        return '亲家母';
      }
      
      // 儿子的妻子的姐姐/妹妹：姻侄女/姻侄妹
      if (afterWifeChain.length === 1 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls')) {
        return '姻侄女';
      }
      
      // 儿子的妻子的姐姐的丈夫：姻侄女婿
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 'h') {
        return '姻侄女婿';
      }
      
      // 儿子的妻子的姐姐/妹妹的儿子：姻侄孙/姻侄外孙
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 's') {
        return '姻侄孙';
      }
      
      // 儿子的妻子的姐姐/妹妹的女儿：姻侄孙女/姻侄外孙女
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 'd') {
        return '姻侄孙女';
      }
      
      // 儿子的妻子的姐姐的儿子的妻子：姻侄孙媳
      if (afterWifeChain.length === 3 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 's' && afterWifeChain[2] === 'w') {
        return '姻侄孙媳';
      }
      
      // 儿子的妻子的姐姐/妹妹的深层后代（genDown 通用）
      if (afterWifeChain.length >= 3 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && (afterWifeChain[1] === 's' || afterWifeChain[1] === 'd')) {
        var genDown = 0;
        for (var gi = 1; gi < afterWifeChain.length; gi++) {
          if (afterWifeChain[gi] === 's' || afterWifeChain[gi] === 'd') genDown++;
        }
        var lastRel = afterWifeChain[afterWifeChain.length - 1];
        var lastGender = afterWifeChain[afterWifeChain.length - 1];
        if (lastGender === 's') lastGender = 'male';
        else if (lastGender === 'd') lastGender = 'female';
        else {
          var prevIdx = afterWifeChain.length - 2;
          while (prevIdx >= 1) {
            if (afterWifeChain[prevIdx] === 's') { lastGender = 'male'; break; }
            if (afterWifeChain[prevIdx] === 'd') { lastGender = 'female'; break; }
            prevIdx--;
          }
        }
        var yzBaseTitle = '';
        if (genDown === 1) yzBaseTitle = '姻侄孙';
        else if (genDown === 2) yzBaseTitle = '姻侄曾孙';
        else if (genDown === 3) yzBaseTitle = '姻侄玄孙';
        else if (genDown === 4) yzBaseTitle = '姻侄来孙';
        if (yzBaseTitle !== '') {
          if (lastRel === 'h') return yzBaseTitle + '女婿';
          if (lastRel === 'w') return yzBaseTitle + '媳';
          return lastGender === 'male' ? yzBaseTitle : yzBaseTitle + '女';
        }
      }
      
      // 儿子的妻子的姐姐的儿子的女儿的儿子的儿子：姻侄昆孙（兜底）
      if (afterWifeChain.length >= 4 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 's') {
        return '姻侄昆孙';
      }
    }
    
        // ========== 模式 0e-1：妻子的父祖系列 ==========
    // 处理：妻子的爸爸/妈妈/爷爷/奶奶
    // 关系链：w, f/m, ...
    if (chain.length >= 2 && chain[0] === 'w' && (chain[1] === 'f' || chain[1] === 'm')) {
      var afterWifeFatherChain = chain.slice(2); // 去掉 [w, f/m] 后的关系链
      
      // 妻子的爸爸：岳父
      if (afterWifeFatherChain.length === 0 && chain[1] === 'f') {
        return '岳父';
      }
      // 妻子的妈妈：岳母
      if (afterWifeFatherChain.length === 0 && chain[1] === 'm') {
        return '岳母';
      }
      // 妻子的爸爸的爸爸：爷爷
      if (afterWifeFatherChain.length === 1 && afterWifeFatherChain[0] === 'f' && chain[1] === 'f') {
        return '爷爷';
      }
      // 妻子的爸爸的妈妈：奶奶
      if (afterWifeFatherChain.length === 1 && afterWifeFatherChain[0] === 'm' && chain[1] === 'f') {
        return '奶奶';
      }
        // 妻子的爸爸的爸爸的爸爸：表曾祖父
        if (afterWifeFatherChain.length === 2 && afterWifeFatherChain[0] === 'f' && afterWifeFatherChain[1] === 'f' && chain[1] === 'f') {
          return '表曾祖父';
        }
        // 妻子的爸爸的爸爸的妈妈：表曾祖母
        if (afterWifeFatherChain.length === 2 && afterWifeFatherChain[0] === 'f' && afterWifeFatherChain[1] === 'm' && chain[1] === 'f') {
          return '表曾祖母';
        }
    }
    

    // ========== 模式 0e-1a-2：妻子的爸爸的爸爸的兄弟系列 ==========
    // 处理：妻子的爸爸的爸爸的哥哥/弟弟及其后代（关系链：w,f,f,[ob/lb],...）
    if (chain.length >= 4 && chain[0] === 'w' && chain[1] === 'f' && chain[2] === 'f' &&
        (chain[3] === 'ob' || chain[3] === 'lb')) {
      var wifeFfBrotherRel = chain[3]; // ob/lb
      var afterWifeFfBrotherChain = chain.slice(4);
      
      // 妻子的爸爸的爸爸的哥哥：伯祖父
      if (afterWifeFfBrotherChain.length === 0 && wifeFfBrotherRel === 'ob') {
        return '伯祖父';
      }
      // 妻子的爸爸的爸爸的弟弟：叔祖父
      if (afterWifeFfBrotherChain.length === 0 && wifeFfBrotherRel === 'lb') {
        return '叔祖父';
      }
      
      // 妻子的爸爸的爸爸的兄弟的妻子：伯祖母/叔祖母
      if (afterWifeFfBrotherChain.length === 1 && afterWifeFfBrotherChain[0] === 'w') {
        return wifeFfBrotherRel === 'ob' ? '伯祖母' : '叔祖母';
      }
      
      // 妻子的爸爸的爸爸的兄弟的子女：堂伯父/堂叔父/堂姑母
      if (afterWifeFfBrotherChain.length === 1) {
        if (afterWifeFfBrotherChain[0] === 's') {
          return wifeFfBrotherRel === 'ob' ? '堂伯父' : '堂叔父';
        }
        if (afterWifeFfBrotherChain[0] === 'd') {
          return '堂姑母';
        }
      }
      
      // 妻子的爸爸的爸爸的兄弟的子女的配偶
      if (afterWifeFfBrotherChain.length === 2) {
        if (afterWifeFfBrotherChain[0] === 's' && afterWifeFfBrotherChain[1] === 'w') {
          return wifeFfBrotherRel === 'ob' ? '堂伯母' : '堂叔母';
        }
        if (afterWifeFfBrotherChain[0] === 'd' && afterWifeFfBrotherChain[1] === 'h') {
          return '堂姑父';
        }
      }
      
      // 妻子的爸爸的爸爸的兄弟的子女的后代
      if (afterWifeFfBrotherChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterWifeFfBrotherChain.length - 1; i >= 0; i--) {
          if (afterWifeFfBrotherChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterWifeFfBrotherChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 堂兄弟的子女 = 堂侄/堂侄女
        if (afterWifeFfBrotherChain[0] === 's' && afterWifeFfBrotherChain.length === 2) {
          return lastGenGender === 'male' ? '堂侄' : '堂侄女';
        }
        // 堂姐妹的子女 = 表外甥/表外甥女
        if (afterWifeFfBrotherChain[0] === 'd' && afterWifeFfBrotherChain.length === 2) {
          return lastGenGender === 'male' ? '表外甥' : '表外甥女';
        }
      }
    }
    
    // ========== 模式 0e-1b-2：妻子的爸爸的爸爸的姐妹系列 ==========
    // 处理：妻子的爸爸的爸爸的姐姐/妹妹及其后代（关系链：w,f,f,[os/ls],...）
    if (chain.length >= 4 && chain[0] === 'w' && chain[1] === 'f' && chain[2] === 'f' &&
        (chain[3] === 'os' || chain[3] === 'ls')) {
      var wifeFfSisterRel = chain[3]; // os/ls
      var afterWifeFfSisterChain = chain.slice(4);
      
      // 妻子的爸爸的爸爸的姐姐/妹妹：姑祖母
      if (afterWifeFfSisterChain.length === 0) {
        return '姑祖母';
      }
      
      // 妻子的爸爸的爸爸的姐妹的丈夫：姑祖父
      if (afterWifeFfSisterChain.length === 1 && afterWifeFfSisterChain[0] === 'h') {
        return '姑祖父';
      }
      
      // 妻子的爸爸的爸爸的姐妹的子女：表伯父/表姑母
      if (afterWifeFfSisterChain.length === 1) {
        if (afterWifeFfSisterChain[0] === 's') {
          return '表伯父';
        }
        if (afterWifeFfSisterChain[0] === 'd') {
          return '表姑母';
        }
      }
      
      // 妻子的爸爸的爸爸的姐妹的子女的配偶
      if (afterWifeFfSisterChain.length === 2) {
        if (afterWifeFfSisterChain[0] === 's' && afterWifeFfSisterChain[1] === 'w') {
          return '表伯母';
        }
        if (afterWifeFfSisterChain[0] === 'd' && afterWifeFfSisterChain[1] === 'h') {
          return '表姑父';
        }
      }
      
      // 妻子的爸爸的爸爸的姐妹的子女的后代
      if (afterWifeFfSisterChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterWifeFfSisterChain.length - 1; i >= 0; i--) {
          if (afterWifeFfSisterChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterWifeFfSisterChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 表兄弟的子女 = 表侄/表侄女
        if (afterWifeFfSisterChain[0] === 's' && afterWifeFfSisterChain.length === 2) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        // 表姐妹的子女 = 表外甥/表外甥女
        if (afterWifeFfSisterChain[0] === 'd' && afterWifeFfSisterChain.length === 2) {
          return lastGenGender === 'male' ? '表外甥' : '表外甥女';
        }
      }
    }
    
    // ========== 模式 0e-1a：妻子的爸爸的兄弟系列 ==========
    // 处理：妻子的爸爸的哥哥/弟弟及其后代（仅当 chain[1] === 'f' 时）
    if (chain.length >= 3 && chain[0] === 'w' && chain[1] === 'f' &&
        (chain[2] === 'ob' || chain[2] === 'lb')) {
      var wifeFatherBrotherRel = chain[2]; // ob/lb
      var afterWifeFatherBrotherChain = chain.slice(3);
      
      // 妻子的爸爸的哥哥：伯伯
      if (afterWifeFatherBrotherChain.length === 0 && wifeFatherBrotherRel === 'ob') {
        return '伯伯';
      }
      // 妻子的爸爸的弟弟：叔叔
      if (afterWifeFatherBrotherChain.length === 0 && wifeFatherBrotherRel === 'lb') {
        return '叔叔';
      }
      
      // 妻子的爸爸的兄弟的妻子：伯母/婶婶
      if (afterWifeFatherBrotherChain.length === 1 && afterWifeFatherBrotherChain[0] === 'w') {
        return wifeFatherBrotherRel === 'ob' ? '伯母' : '婶婶';
      }
      
      // 妻子的爸爸的兄弟的子女：堂兄弟/堂姐妹
      if (afterWifeFatherBrotherChain.length === 1) {
        if (afterWifeFatherBrotherChain[0] === 's') return '堂兄弟';
        if (afterWifeFatherBrotherChain[0] === 'd') return '堂姐妹';
      }
      
      // 妻子的爸爸的兄弟的子女的配偶
      if (afterWifeFatherBrotherChain.length === 2) {
        if (afterWifeFatherBrotherChain[0] === 's' && afterWifeFatherBrotherChain[1] === 'w') {
          return '堂兄弟媳';
        }
        if (afterWifeFatherBrotherChain[0] === 'd' && afterWifeFatherBrotherChain[1] === 'h') {
          return '堂姐妹夫';
        }
      }
      
      // 妻子的爸爸的兄弟的子女的后代
      if (afterWifeFatherBrotherChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterWifeFatherBrotherChain.length - 1; i >= 0; i--) {
          if (afterWifeFatherBrotherChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterWifeFatherBrotherChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 堂兄弟的子女 = 堂侄/堂侄女
        if (afterWifeFatherBrotherChain[0] === 's' && afterWifeFatherBrotherChain.length === 2) {
          return lastGenGender === 'male' ? '堂侄' : '堂侄女';
        }
        // 堂姐妹的子女 = 堂外甥/堂外甥女
        if (afterWifeFatherBrotherChain[0] === 'd' && afterWifeFatherBrotherChain.length === 2) {
          return lastGenGender === 'male' ? '堂外甥' : '堂外甥女';
        }
        // 堂兄弟的儿子的女儿的丈夫 = 堂侄女婿
        if (afterWifeFatherBrotherChain.length === 3 && afterWifeFatherBrotherChain[0] === 's' && 
            afterWifeFatherBrotherChain[1] === 'd' && afterWifeFatherBrotherChain[2] === 'h') {
          return '堂侄女婿';
        }
        // 堂姐妹的女儿的丈夫 = 堂外甥女婿
        if (afterWifeFatherBrotherChain.length === 3 && afterWifeFatherBrotherChain[0] === 'd' && 
            afterWifeFatherBrotherChain[1] === 'd' && afterWifeFatherBrotherChain[2] === 'h') {
          return '堂外甥女婿';
        }
        // 堂兄弟的孙子女 = 堂侄孙/堂侄孙女
        if (afterWifeFatherBrotherChain[0] === 's' && afterWifeFatherBrotherChain.length === 3) {
          return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
        }
        // 堂姐妹的孙子女 = 堂外甥孙/堂外甥孙女
        if (afterWifeFatherBrotherChain[0] === 'd' && afterWifeFatherBrotherChain.length === 3) {
          return lastGenGender === 'male' ? '堂外甥孙' : '堂外甥孙女';
        }
      }
    }
    
    // ========== 模式 0e-1b：妻子的爸爸的姐妹系列 ==========
    // 处理：妻子的爸爸的姐姐/妹妹及其后代
    // 关系链：w, f, [os/ls], ...
    if (chain.length >= 3 && chain[0] === 'w' && chain[1] === 'f' && 
        (chain[2] === 'os' || chain[2] === 'ls')) {
      var wifeFatherSisterRel = chain[2]; // os/ls
      var afterWifeFatherSisterChain = chain.slice(3);
      
      // 妻子的爸爸的姐姐/妹妹：姑母
      if (afterWifeFatherSisterChain.length === 0) {
        return '姑母';
      }
      
      // 妻子的爸爸的姐妹的丈夫：姑父
      if (afterWifeFatherSisterChain.length === 1 && afterWifeFatherSisterChain[0] === 'h') {
        return '姑父';
      }
      
      // 妻子的爸爸的姐妹的子女：表兄弟/表姐妹
      if (afterWifeFatherSisterChain.length === 1) {
        if (afterWifeFatherSisterChain[0] === 's') return '表兄弟';
        if (afterWifeFatherSisterChain[0] === 'd') return '表姐妹';
      }
      
      // 妻子的爸爸的姐妹的子女的配偶
      if (afterWifeFatherSisterChain.length === 2) {
        if (afterWifeFatherSisterChain[0] === 's' && afterWifeFatherSisterChain[1] === 'w') {
          return '表兄弟媳';
        }
        if (afterWifeFatherSisterChain[0] === 'd' && afterWifeFatherSisterChain[1] === 'h') {
          return '表姐妹夫';
        }
      }
      
      // 妻子的爸爸的姐妹的子女的后代
      if (afterWifeFatherSisterChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterWifeFatherSisterChain.length - 1; i >= 0; i--) {
          if (afterWifeFatherSisterChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterWifeFatherSisterChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 表兄弟的子女 = 表侄/表侄女
        if (afterWifeFatherSisterChain[0] === 's' && afterWifeFatherSisterChain.length === 2) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        // 表姐妹的子女 = 表外甥/表外甥女
        if (afterWifeFatherSisterChain[0] === 'd' && afterWifeFatherSisterChain.length === 2) {
          return lastGenGender === 'male' ? '表外甥' : '表外甥女';
        }
      }
    }
    
    // ========== 模式 0e-1c：妻子的妈妈的爸爸系列 ==========
    // 处理：妻子的妈妈的爸爸/妈妈及其后代
    if (chain.length >= 3 && chain[0] === 'w' && chain[1] === 'm') {
      var afterWifeMotherChain = chain.slice(2); // 去掉 [w, m] 后的关系链
      
      // 妻子的妈妈的爸爸：外公
      if (afterWifeMotherChain.length === 1 && afterWifeMotherChain[0] === 'f') {
        return '外公';
      }
      // 妻子的妈妈的妈妈：外婆
      if (afterWifeMotherChain.length === 1 && afterWifeMotherChain[0] === 'm') {
        return '外婆';
      }
      // 妻子的妈妈的爸爸的爸爸：曾祖父
      if (afterWifeMotherChain.length === 2 && afterWifeMotherChain[0] === 'f' && afterWifeMotherChain[1] === 'f') {
        return '曾祖父';
      }
      // 妻子的妈妈的爸爸的妈妈：曾祖母
      if (afterWifeMotherChain.length === 2 && afterWifeMotherChain[0] === 'f' && afterWifeMotherChain[1] === 'm') {
        return '曾祖母';
      }
    }
    
    // ========== 模式 0e-1b-1：妻子的妈妈的兄弟姐妹系列 ==========
    // 处理：妻子的妈妈的哥哥/弟弟/姐姐/妹妹及其后代
    if (chain.length >= 3 && chain[0] === 'w' && chain[1] === 'm' &&
        (chain[2] === 'ob' || chain[2] === 'lb' || chain[2] === 'os' || chain[2] === 'ls')) {
      var wifeMotherSibRel = chain[2]; // ob/lb/os/ls
      var afterWifeMotherSibChain = chain.slice(3);
      
      // 妻子的妈妈的哥哥/弟弟：舅舅
      if (afterWifeMotherSibChain.length === 0 && (wifeMotherSibRel === 'ob' || wifeMotherSibRel === 'lb')) {
        return '舅舅';
      }
      // 妻子的妈妈的姐姐/妹妹：姨妈
      if (afterWifeMotherSibChain.length === 0 && (wifeMotherSibRel === 'os' || wifeMotherSibRel === 'ls')) {
        return '姨妈';
      }
      
      // 妻子的妈妈的哥哥/弟弟的妻子：舅母
      if (afterWifeMotherSibChain.length === 1 && afterWifeMotherSibChain[0] === 'w' && 
          (wifeMotherSibRel === 'ob' || wifeMotherSibRel === 'lb')) {
        return '舅母';
      }
      // 妻子的妈妈的姐姐/妹妹的丈夫：姨父
      if (afterWifeMotherSibChain.length === 1 && afterWifeMotherSibChain[0] === 'h' && 
          (wifeMotherSibRel === 'os' || wifeMotherSibRel === 'ls')) {
        return '姨父';
      }
      
      // 妻子的妈妈的兄弟姐妹的子女：表兄弟/表姐妹
      if (afterWifeMotherSibChain.length >= 1 && 
          (afterWifeMotherSibChain[0] === 's' || afterWifeMotherSibChain[0] === 'd')) {
        var cousinChildRel = afterWifeMotherSibChain[0]; // s/d
        var afterCousinChildChain = afterWifeMotherSibChain.slice(1);
        
        // 表兄弟/表姐妹（无后代）
        if (afterCousinChildChain.length === 0) {
          if (cousinChildRel === 's') return '表兄弟';
          if (cousinChildRel === 'd') return '表姐妹';
        }
        
        // 表兄弟的子女：表侄/表侄女
        if (afterCousinChildChain.length === 1 && cousinChildRel === 's') {
          if (afterCousinChildChain[0] === 's') return '表侄';
          if (afterCousinChildChain[0] === 'd') return '表侄女';
        }
        
        // 表姐妹的子女：表外甥/表外甥女
        if (afterCousinChildChain.length === 1 && cousinChildRel === 'd') {
          if (afterCousinChildChain[0] === 's') return '表外甥';
          if (afterCousinChildChain[0] === 'd') return '表外甥女';
        }
        
        // 表兄弟媳：[s, w] - 表兄弟的妻子
        if (afterCousinChildChain.length === 1 && cousinChildRel === 's' && afterCousinChildChain[0] === 'w') {
          return '表兄弟媳';
        }
        
        // 表姐妹夫：[d, h] - 表姐妹的丈夫
        if (afterCousinChildChain.length === 1 && cousinChildRel === 'd' && afterCousinChildChain[0] === 'h') {
          return '表姐妹夫';
        }
      }
      
      // 妻子的妈妈的爸爸的兄弟（外伯祖父/外叔祖父系列）
      if (chain.length >= 4 && chain[2] === 'f' && (chain[3] === 'ob' || chain[3] === 'lb')) {
        // This is actually [w, m, f, ob/lb, ...]
        var wifeMomGreatUncleRel = chain[3];
        var afterWifeMomGreatUncleChain = chain.slice(4);
        
        // 妻子的妈妈的爸爸的哥哥：外伯祖父
        if (afterWifeMomGreatUncleChain.length === 0 && wifeMomGreatUncleRel === 'ob') {
          return '外伯祖父';
        }
        // 妻子的妈妈的爸爸的弟弟：外叔祖父
        if (afterWifeMomGreatUncleChain.length === 0 && wifeMomGreatUncleRel === 'lb') {
          return '外叔祖父';
        }
        
        // 妻子的妈妈的爸爸的兄弟的妻子：外伯祖母/外叔祖母
        if (afterWifeMomGreatUncleChain.length === 1 && afterWifeMomGreatUncleChain[0] === 'w') {
          return wifeMomGreatUncleRel === 'ob' ? '外伯祖母' : '外叔祖母';
        }
        
        // 妻子的妈妈的爸爸的兄弟的子女：表舅父/表姨母
        if (afterWifeMomGreatUncleChain.length === 1) {
          if (afterWifeMomGreatUncleChain[0] === 's') return '表舅父';
          if (afterWifeMomGreatUncleChain[0] === 'd') return '表姨母';
        }
        
        // 妻子的妈妈的爸爸的兄弟的子女的配偶
        if (afterWifeMomGreatUncleChain.length === 2) {
          if (afterWifeMomGreatUncleChain[0] === 's' && afterWifeMomGreatUncleChain[1] === 'w') {
            return '表舅母';
          }
          if (afterWifeMomGreatUncleChain[0] === 'd' && afterWifeMomGreatUncleChain[1] === 'h') {
            return '表姨父';
          }
        }
       // 丈夫的妈妈的兄弟姐妹的儿子的配偶：表侄媳
      if (afterHusbandMotherChain.length === 3 && afterHusbandMotherChain[1] === 's' && afterHusbandMotherChain[2] === 'w') {
        return '表侄媳';
      }
     }
    }

    // ========== 模式 0e：妻子的兄弟姐妹系列 ==========
    // 处理：妻子的姐姐/妹妹/哥哥/弟弟及其子女（不含配偶，配偶由模式 0f 处理）
    // 关系链：w, os/ls/ob/lb, ...
    if (chain.length >= 2 && chain[0] === 'w' && (chain[1] === 'os' || chain[1] === 'ls' || chain[1] === 'ob' || chain[1] === 'lb')) {
      var sibRel = chain[1]; // os/ls/ob/lb
      var afterSibChain = chain.slice(2); // 去掉 [w, sib] 后的关系链
      
      // 如果 afterSibChain 以 h 开始（妻子的姐妹的丈夫），让模式 0f 处理
      if (afterSibChain.length > 0 && afterSibChain[0] === 'h') {
        // 不处理，让模式 0f 处理
      } else {
      
      // 妻子的姐姐/妹妹/哥哥/弟弟 - 使用内兄/内姊区分
      if (afterSibChain.length === 0) {
        if (sibRel === 'os') return '内姊';
        if (sibRel === 'ls') return '内姊';
        if (sibRel === 'ob') return '内兄';
        if (sibRel === 'lb') return '内兄';
      }
      
      // 妻子的姐姐/妹妹/哥哥/弟弟的配偶
      if (afterSibChain.length === 1 && afterSibChain[0] === 'w') {
        if (sibRel === 'os') return '嫂子'; // 妻子的姐姐的妻子（女同）
        if (sibRel === 'ls') return '弟媳'; // 妻子的妹妹的妻子（女同）
        if (sibRel === 'ob') return '嫂子'; // 妻子的哥哥的妻子
        if (sibRel === 'lb') return '弟媳'; // 妻子的弟弟的妻子
      }
      
      // 妻子的姐姐/妹妹的丈夫
      if (afterSibChain.length === 1 && afterSibChain[0] === 'h') {
        if (sibRel === 'os') return '姐夫';
        if (sibRel === 'ls') return '妹夫';
      }
      
      // 妻子的姐妹的儿子/女儿：外甥/外甥女
      if (afterSibChain.length === 1 && (afterSibChain[0] === 's' || afterSibChain[0] === 'd')) {
        if (afterSibChain[0] === 's') return '外甥';
        if (afterSibChain[0] === 'd') return '外甥女';
      }
      
      // 妻子的兄弟的儿子/女儿：内侄/内侄女（从夫称）
      if (afterSibChain.length === 1 && (sibRel === 'ob' || sibRel === 'lb') && (afterSibChain[0] === 's' || afterSibChain[0] === 'd')) {
        if (afterSibChain[0] === 's') return '内侄';
        if (afterSibChain[0] === 'd') return '内侄女';
      }
      
      // 妻子的姐妹的孙子/孙女：外甥孙/外甥孙女
      if (afterSibChain.length === 2 && (afterSibChain[0] === 's' || afterSibChain[0] === 'd') && (afterSibChain[1] === 's' || afterSibChain[1] === 'd')) {
        var grandchildRel = afterSibChain[1];
        if (grandchildRel === 's') return '外甥孙';
        if (grandchildRel === 'd') return '外甥孙女';
      }
      
      // 妻子的姐妹的曾孙/曾孙女：外甥曾孙/外甥曾孙女（3 代）
      // 检查：前 2 代是 s/d（任意组合），第 3 代决定性别
      if (afterSibChain.length === 3 && 
          (afterSibChain[0] === 's' || afterSibChain[0] === 'd') && 
          (afterSibChain[1] === 's' || afterSibChain[1] === 'd') && 
          (afterSibChain[2] === 's' || afterSibChain[2] === 'd')) {
        var greatGrandchildRel = afterSibChain[2];
        if (greatGrandchildRel === 's') return '外甥曾孙';
        if (greatGrandchildRel === 'd') return '外甥曾孙女';
      }
      
      // 妻子的姐妹的玄孙/玄孙女：外甥玄孙/外甥玄孙女（4 代）
      // 检查：前 3 代是 s/d（任意组合），第 4 代决定性别
      if (afterSibChain.length === 4 && 
          (afterSibChain[0] === 's' || afterSibChain[0] === 'd') && 
          (afterSibChain[1] === 's' || afterSibChain[1] === 'd') && 
          (afterSibChain[2] === 's' || afterSibChain[2] === 'd') && 
          (afterSibChain[3] === 's' || afterSibChain[3] === 'd')) {
        var greatGreatGrandchildRel = afterSibChain[3];
        if (greatGreatGrandchildRel === 's') return '外甥玄孙';
        if (greatGreatGrandchildRel === 'd') return '外甥玄孙女';
      }
      
      // 妻子的姐妹的来孙/来孙女：外甥来孙/外甥来孙女（5 代）
      // 检查：前 4 代是 s/d（任意组合），第 5 代决定性别
      if (afterSibChain.length === 5 && 
          (afterSibChain[0] === 's' || afterSibChain[0] === 'd') && 
          (afterSibChain[1] === 's' || afterSibChain[1] === 'd') && 
          (afterSibChain[2] === 's' || afterSibChain[2] === 'd') && 
          (afterSibChain[3] === 's' || afterSibChain[3] === 'd') && 
          (afterSibChain[4] === 's' || afterSibChain[4] === 'd')) {
        var comeGrandchildRel = afterSibChain[4];
        if (comeGrandchildRel === 's') return '外甥来孙';
        if (comeGrandchildRel === 'd') return '外甥来孙女';
      }
      } // 结束 else 块（排除 h 的情况）
    }
    
    // ========== 模式 0e-2：妻子的兄弟的妻子的亲属系列 ==========
    // 处理：妻子的哥哥/弟弟的妻子的爸爸/妈妈/哥哥/姐姐/弟弟/妹妹及其子女
    // 关系链：w, ob/lb, w, ...
    if (chain.length >= 3 && chain[0] === 'w' && (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 'w') {
      var afterWifeChain = chain.slice(3); // 去掉 [w, brother, w] 后的关系链
      
      // 妻子的兄弟的妻子的爸爸：姻伯
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'f') {
        return '姻伯';
      }
      
      // 妻子的兄弟的妻子的妈妈：姻伯母
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'm') {
        return '姻伯母';
      }
      
      // 妻子的兄弟的妻子的姐姐：姻姐
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'os') {
        return '姻姐';
      }
      
      // 妻子的兄弟的妻子的妹妹：姻妹
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'ls') {
        return '姻妹';
      }
      
      // 妻子的兄弟的妻子的哥哥：姻兄
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'ob') {
        return '姻兄';
      }
      
      // 妻子的兄弟的妻子的弟弟：姻弟
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'lb') {
        return '姻弟';
      }
      
      // 妻子的兄弟的妻子的儿子：姻侄
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 's') {
        return '姻侄';
      }
      
      // 妻子的兄弟的妻子的女儿：姻侄女
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'd') {
        return '姻侄女';
      }
      
      // ========== 妻子的兄弟的妻子的兄弟姐妹的后代系列 ==========
      // 关系链：w, ob/lb, w, os/ls, ...
      if (afterWifeChain.length >= 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls')) {
        var afterSibChain = afterWifeChain.slice(1); // 去掉 [os/ls] 后的关系链
        
        // 妻子的兄弟的妻子的姐姐的丈夫：姻姐夫
        // 妻子的兄弟的妻子的妹妹的丈夫：姻妹夫
        if (afterSibChain.length === 1 && afterSibChain[0] === 'h') {
          if (afterWifeChain[0] === 'os') return '姻姐夫';
          if (afterWifeChain[0] === 'ls') return '姻妹夫';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的儿子：姻侄
        if (afterSibChain.length === 1 && afterSibChain[0] === 's') {
          return '姻侄';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿：姻侄女
        if (afterSibChain.length === 1 && afterSibChain[0] === 'd') {
          return '姻侄女';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿的丈夫：姻侄女婿
        if (afterSibChain.length === 2 && afterSibChain[0] === 'd' && afterSibChain[1] === 'h') {
          return '姻侄女婿';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿的儿子：姻侄孙
        if (afterSibChain.length === 2 && afterSibChain[0] === 'd' && afterSibChain[1] === 's') {
          return '姻侄孙';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿的女儿：姻侄孙女
        if (afterSibChain.length === 2 && afterSibChain[0] === 'd' && afterSibChain[1] === 'd') {
          return '姻侄孙女';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的儿子的儿子：姻侄孙
        if (afterSibChain.length === 2 && afterSibChain[0] === 's' && afterSibChain[1] === 's') {
          return '姻侄孙';
        }
        
      // 妻子的兄弟的妻子的姐姐/妹妹的儿子的女儿：姻侄孙女
      if (afterSibChain.length === 2 && afterSibChain[0] === 's' && afterSibChain[1] === 'd') {
        return '姻侄孙女';
      }
      
      // 妻子的兄弟的妻子的姐姐/妹妹的儿子的妻子：姻侄媳
      if (afterSibChain.length === 2 && afterSibChain[0] === 's' && afterSibChain[1] === 'w') {
        return '姻侄媳';
      }
      
      // 妻子的兄弟的妻子的姐姐/妹妹的儿子的女儿的丈夫：姻侄孙女婿
      if (afterSibChain.length === 3 && afterSibChain[0] === 's' && afterSibChain[1] === 'd' && afterSibChain[2] === 'h') {
        return '姻侄孙女婿';
      }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿的儿子的儿子：姻侄曾孙
        if (afterSibChain.length === 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 's' && afterSibChain[2] === 's') {
          return '姻侄曾孙';
        }
        
        // 妻子的兄弟的妻子的姐姐/妹妹的女儿的儿子的女儿：姻侄曾孙女
        if (afterSibChain.length === 3 && afterSibChain[0] === 'd' && afterSibChain[1] === 's' && afterSibChain[2] === 'd') {
          return '姻侄曾孙女';
        }
      }
    }
    
    // ========== 模式 0f：妻子的姐妹的丈夫的亲属系列 ==========
    // 处理：妻子的姐姐/妹妹的丈夫及其爸爸/妈妈/哥哥/姐姐/子女等
    // 关系链：w, os/ls, h, ...
    if (chain.length >= 3 && chain[0] === 'w' && (chain[1] === 'os' || chain[1] === 'ls') && chain[2] === 'h') {
      var afterHusbandChain = chain.slice(3); // 去掉 [w, sib, h] 后的关系链
      var isElderSister = (chain[1] === 'os'); // 妻子的姐姐
      var isYoungerSister = (chain[1] === 'ls'); // 妻子的妹妹
      
      // 妻子的姐妹的丈夫：姐夫/妹夫
      if (afterHusbandChain.length === 0) {
        if (isElderSister) return '姐夫';
        if (isYoungerSister) return '妹夫';
      }
      
      // 妻子的姐妹的丈夫的爸爸：姻伯
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'f') {
        return '姻伯';
      }
      
      // 妻子的姐妹的丈夫的妈妈：姻伯母
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'm') {
        return '姻伯母';
      }
      
      // 妻子的姐妹的丈夫的爸爸的爸爸：姻爷爷
      if (afterHusbandChain.length === 2 && afterHusbandChain[0] === 'f' && afterHusbandChain[1] === 'f') {
        return '姻爷爷';
      }
      
      // 妻子的姐妹的丈夫的哥哥/弟弟：姻兄/姻弟
      if (afterHusbandChain.length === 1 && (afterHusbandChain[0] === 'ob' || afterHusbandChain[0] === 'lb')) {
        return '姻兄';
      }
      
      // 妻子的姐妹的丈夫的哥哥的妻子：姻兄媳
      if (afterHusbandChain.length === 2 && (afterHusbandChain[0] === 'ob' || afterHusbandChain[0] === 'lb') && afterHusbandChain[1] === 'w') {
        return '姻兄媳';
      }
      
      // 妻子的姐妹的丈夫的姐姐/妹妹：姻姐/姻妹
      if (afterHusbandChain.length === 1 && (afterHusbandChain[0] === 'os' || afterHusbandChain[0] === 'ls')) {
        return '姻姐';
      }
      
      // 妻子的姐妹的丈夫的姐姐的丈夫：姻姐夫
      if (afterHusbandChain.length === 2 && (afterHusbandChain[0] === 'os' || afterHusbandChain[0] === 'ls') && afterHusbandChain[1] === 'h') {
        return '姻姐夫';
      }
      
      // 妻子的姐妹的丈夫的姐姐/妹妹的儿子：姻外甥
      if (afterHusbandChain.length === 2 && (afterHusbandChain[0] === 'os' || afterHusbandChain[0] === 'ls') && afterHusbandChain[1] === 's') {
        return '姻外甥';
      }
      
      // 妻子的姐妹的丈夫的姐姐/妹妹的女儿：姻外甥女
      if (afterHusbandChain.length === 2 && (afterHusbandChain[0] === 'os' || afterHusbandChain[0] === 'ls') && afterHusbandChain[1] === 'd') {
        return '姻外甥女';
      }
      
      // 妻子的姐妹的丈夫的兄弟的儿子：姻侄（修复余泽友视角：妻子的妹妹的丈夫的哥哥的儿子）
      if (afterHusbandChain.length === 2 && (afterHusbandChain[0] === 'ob' || afterHusbandChain[0] === 'lb') && afterHusbandChain[1] === 's') {
        return '姻侄';
      }
      
      // 妻子的姐妹的丈夫的儿子：姻侄
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 's') {
        return '姻侄';
      }
      
      // 妻子的姐妹的丈夫的女儿：姻侄女
      if (afterHusbandChain.length === 1 && afterHusbandChain[0] === 'd') {
        return '姻侄女';
      }
    }
    
    // ========== 模式 0g：丈夫的兄弟姐妹的妻子的亲属系列 ==========
    // 处理：丈夫的哥哥/弟弟的妻子的爸爸/妈妈/哥哥/姐姐/子女等
    // 关系链：h, ob/lb, w, ...
    if (chain.length >= 3 && chain[0] === 'h' && (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 'w') {
      var afterWifeChain = chain.slice(3); // 去掉 [h, sib, w] 后的关系链
      var isElderBrother = (chain[1] === 'ob'); // 丈夫的哥哥
      var isYoungerBrother = (chain[1] === 'lb'); // 丈夫的弟弟
      
      // 丈夫的兄弟的妻子（afterWifeChain 为空）
      if (afterWifeChain.length === 0) {
        if (isElderBrother) return '嫂子';
        if (isYoungerBrother) return '弟媳';
      }
      
      // 丈夫的兄弟的妻子的爸爸：姻伯
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'f') {
        return '姻伯';
      }
      
      // 丈夫的兄弟的妻子的妈妈：姻伯母
      if (afterWifeChain.length === 1 && afterWifeChain[0] === 'm') {
        return '姻伯母';
      }
      
      // 丈夫的兄弟的妻子的姐姐/妹妹：姻姐/姻妹
      if (afterWifeChain.length === 1 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls')) {
        return '姻姐';
      }
      
      // 丈夫的兄弟的妻子的姐姐的丈夫：姻姐夫
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 'h') {
        return '姻姐夫';
      }
      
      // 丈夫的兄弟的妻子的姐姐的儿子：姻外甥
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 's') {
        return '姻外甥';
      }
      
      // 丈夫的兄弟的妻子的姐姐的女儿：姻外甥女
      if (afterWifeChain.length === 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && afterWifeChain[1] === 'd') {
        return '姻外甥女';
      }
      
      // 丈夫的兄弟的妻子的姐姐/妹妹的儿子/女儿及后代：通用公式计算
      // 基础称谓：genDown=1→外甥/外甥女，2→外甥孙/外甥孙女，3→外甥曾孙/外甥曾孙女，4→外甥玄孙/外甥玄孙女，5→外甥来孙/外甥来孙女
      // 配偶后缀：最后是 h→女婿，w→媳
      if (afterWifeChain.length >= 2 && (afterWifeChain[0] === 'os' || afterWifeChain[0] === 'ls') && (afterWifeChain[1] === 's' || afterWifeChain[1] === 'd')) {
        var genDown = 0;
        for (var i = 2; i < afterWifeChain.length; i++) {
          if (afterWifeChain[i] === 's' || afterWifeChain[i] === 'd') genDown++;
        }
        // 判断最后一代性别（排除配偶 h/w）
        var lastGender = 'male';
        for (var i = afterWifeChain.length - 1; i >= 2; i--) {
          if (afterWifeChain[i] === 's' || afterWifeChain[i] === 'ob' || afterWifeChain[i] === 'lb') {
            lastGender = 'male'; break;
          } else if (afterWifeChain[i] === 'd' || afterWifeChain[i] === 'os' || afterWifeChain[i] === 'ls') {
            lastGender = 'female'; break;
          }
        }
        // 判断是否有配偶关系（最后一个是 h 或 w）
        var lastRel = afterWifeChain[afterWifeChain.length - 1];
        var hasSpouseAtEnd = (lastRel === 'h' || lastRel === 'w');
        
        // 基础称谓映射（genDown 从 1 开始，因为 afterWifeChain[1]='s/d' 已经是一代）
        var baseTitle = '';
        if (genDown === 0) baseTitle = '姻外甥'; // 只有姐妹的儿子/女儿，无后代
        else if (genDown === 1) baseTitle = '姻外甥孙';
        else if (genDown === 2) baseTitle = '姻外甥曾孙';
        else if (genDown === 3) baseTitle = '姻外甥玄孙';
        else if (genDown === 4) baseTitle = '姻外甥来孙';
        
        if (baseTitle !== '') {
          // 有配偶后缀
          if (hasSpouseAtEnd) {
            if (lastRel === 'h') return baseTitle + '女婿';
            if (lastRel === 'w') return baseTitle + '媳';
          }
          // 无配偶后缀，加性别
          return lastGender === 'male' ? baseTitle : baseTitle + '女';
        }
      }
    }
    
    // ========== 模式 0g-1：妈妈的弟弟的妻子的亲属系列 ==========
    // 处理：妈妈的弟弟的妻子的妈妈/姐姐及其亲属
    // 关系链：m, lb, w, ...
    if (chain.length >= 3 && chain[0] === 'm' && chain[1] === 'lb' && chain[2] === 'w') {
      var afterAuntChain = chain.slice(3); // 去掉 [m, lb, w] 后的关系链
      
      // 妈妈的弟弟的妻子的妈妈：姻外祖母
      if (afterAuntChain.length === 1 && afterAuntChain[0] === 'm') {
        return '姻外祖母';
      }
      
      // 妈妈的弟弟的妻子的爸爸：姻外祖父
      if (afterAuntChain.length === 1 && afterAuntChain[0] === 'f') {
        return '姻外祖父';
      }
      
      // 妈妈的弟弟的妻子的姐姐：姻伯母
      if (afterAuntChain.length === 1 && afterAuntChain[0] === 'os') {
        return '姻伯母';
      }
      
      // ========== 妈妈的弟弟的妻子的姐姐的亲属系列 ==========
      // 关系链：m, lb, w, os, ...
      if (afterAuntChain.length >= 1 && afterAuntChain[0] === 'os') {
        var afterElderSisterChain = afterAuntChain.slice(1); // 去掉 [os] 后的关系链
        
        // 妈妈的弟弟的妻子的姐姐的丈夫：姻伯
        if (afterElderSisterChain.length === 1 && afterElderSisterChain[0] === 'h') {
          return '姻伯';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子：姻兄弟
        if (afterElderSisterChain.length === 1 && afterElderSisterChain[0] === 's') {
          return '姻兄弟';
        }
        
        // 妈妈的弟弟的妻子的姐姐的女儿：姻姐妹
        if (afterElderSisterChain.length === 1 && afterElderSisterChain[0] === 'd') {
          return '姻姐妹';
        }
        
        // 妈妈的弟弟的妻子的姐姐的女儿的丈夫：姻姐妹夫
        if (afterElderSisterChain.length === 2 && afterElderSisterChain[0] === 'd' && afterElderSisterChain[1] === 'h') {
          return '姻姐妹夫';
        }
        
        // 妈妈的弟弟的妻子的姐姐的女儿的儿子：姻侄
        if (afterElderSisterChain.length === 2 && afterElderSisterChain[0] === 'd' && afterElderSisterChain[1] === 's') {
          return '姻侄';
        }
        
        // 妈妈的弟弟的妻子的姐姐的女儿的儿子/女儿的后代系列
        if (afterElderSisterChain.length >= 2 && afterElderSisterChain[0] === 'd') {
          var afterDaughterChain = afterElderSisterChain.slice(1); // 去掉 [d] 后的关系链
          
          // 计算后代代数（排除配偶 h/w）
          var genCount = 0;
          for (var i = 0; i < afterDaughterChain.length; i++) {
            if (afterDaughterChain[i] === 's' || afterDaughterChain[i] === 'd') genCount++;
          }
          
          // 判断最后一代性别
          var lastGender = 'male';
          for (var i = afterDaughterChain.length - 1; i >= 0; i--) {
            if (afterDaughterChain[i] === 's' || afterDaughterChain[i] === 'ob' || afterDaughterChain[i] === 'lb') {
              lastGender = 'male'; break;
            } else if (afterDaughterChain[i] === 'd' || afterDaughterChain[i] === 'os' || afterDaughterChain[i] === 'ls') {
              lastGender = 'female'; break;
            }
          }
          
          // 判断是否有配偶关系
          var lastRel = afterDaughterChain[afterDaughterChain.length - 1];
          var hasSpouseAtEnd = (lastRel === 'h' || lastRel === 'w');
          
          // 基础称谓映射（从姻兄弟的女儿开始算：第 1 代=侄，第 2 代=孙，第 3 代=曾孙...）
          var baseTitle = '';
          if (genCount === 1) baseTitle = '姻侄';
          else if (genCount === 2) baseTitle = '姻孙';
          else if (genCount === 3) baseTitle = '姻曾孙';
          else if (genCount === 4) baseTitle = '姻玄孙';
          else if (genCount === 5) baseTitle = '姻来孙';
          
          if (baseTitle !== '') {
            if (hasSpouseAtEnd) {
              if (lastRel === 'h') return baseTitle + '女婿';
              if (lastRel === 'w') return baseTitle + '媳';
            }
            return lastGender === 'male' ? baseTitle : baseTitle + '女';
          }
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的妻子：姻兄弟媳
        if (afterElderSisterChain.length === 2 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'w') {
          return '姻兄弟媳';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的女儿：姻侄女
        if (afterElderSisterChain.length === 2 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'd') {
          return '姻侄女';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的女儿的丈夫：姻侄女婿
        if (afterElderSisterChain.length === 3 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'd' && afterElderSisterChain[2] === 'h') {
          return '姻侄女婿';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的女儿的儿子：姻孙
        if (afterElderSisterChain.length === 3 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'd' && afterElderSisterChain[2] === 's') {
          return '姻孙';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的女儿的儿子的儿子：姻曾孙
        if (afterElderSisterChain.length === 4 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'd' && afterElderSisterChain[2] === 's' && afterElderSisterChain[3] === 's') {
          return '姻曾孙';
        }
        
        // 妈妈的弟弟的妻子的姐姐的儿子的女儿的儿子的儿子的儿子：姻玄孙
        if (afterElderSisterChain.length === 5 && afterElderSisterChain[0] === 's' && afterElderSisterChain[1] === 'd' && afterElderSisterChain[2] === 's' && afterElderSisterChain[3] === 's' && afterElderSisterChain[4] === 's') {
          return '姻玄孙';
        }
      }
    }
    
    // ========== 模式 0g-2：妈妈的妹妹的丈夫的亲属系列 ==========
    // 处理：妈妈的妹妹的丈夫的哥哥/姐姐及其亲属
    // 关系链：m, ls, h, ...
    if (chain.length >= 3 && chain[0] === 'm' && chain[1] === 'ls' && chain[2] === 'h') {
      var afterUncleChain = chain.slice(3); // 去掉 [m, ls, h] 后的关系链
      
      // 妈妈的妹妹的丈夫的哥哥：姻伯
      if (afterUncleChain.length === 1 && afterUncleChain[0] === 'ob') {
        return '姻伯';
      }
      
      // 妈妈的妹妹的丈夫的哥哥的妻子：姻伯母
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'ob' && afterUncleChain[1] === 'w') {
        return '姻伯母';
      }
      
      // 妈妈的妹妹的丈夫的哥哥的儿子：姻表兄弟
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'ob' && afterUncleChain[1] === 's') {
        return '姻表兄弟';
      }
      
      // 妈妈的妹妹的丈夫的哥哥的女儿：姻表姐妹
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'ob' && afterUncleChain[1] === 'd') {
        return '姻表姐妹';
      }
      
      // 妈妈的妹妹的丈夫的姐姐：姻姑母
      if (afterUncleChain.length === 1 && afterUncleChain[0] === 'os') {
        return '姻姑母';
      }
      
      // 妈妈的妹妹的丈夫的姐姐的丈夫：姻姑父
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'os' && afterUncleChain[1] === 'h') {
        return '姻姑父';
      }
      
      // 妈妈的妹妹的丈夫的姐姐的儿子：姻表兄弟
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'os' && afterUncleChain[1] === 's') {
        return '姻表兄弟';
      }
      
      // 妈妈的妹妹的丈夫的姐姐的女儿：姻表姐妹
      if (afterUncleChain.length === 2 && afterUncleChain[0] === 'os' && afterUncleChain[1] === 'd') {
        return '姻表姐妹';
      }
    }
    
    // ========== 模式 0g-3：丈夫的妈妈的亲属系列（女性视角） ==========
    // 处理：丈夫的妈妈的爸爸/妈妈/姐姐/妹妹及其亲属
    // 关系链：h, m, ...
    if (chain.length >= 2 && chain[0] === 'h' && chain[1] === 'm') {
      var afterGrandmaChain = chain.slice(2); // 去掉 [h, m] 后的关系链
      
      // 丈夫的妈妈的爸爸：外公
      if (afterGrandmaChain.length === 1 && afterGrandmaChain[0] === 'f') {
        return '外公';
      }
      
      // 丈夫的妈妈的妈妈：外婆
      if (afterGrandmaChain.length === 1 && afterGrandmaChain[0] === 'm') {
        return '外婆';
      }
      
      // 丈夫的妈妈的姐姐：姨母
      if (afterGrandmaChain.length === 1 && afterGrandmaChain[0] === 'os') {
        return '姨母';
      }
      
      // 丈夫的妈妈的姐姐的丈夫：姨父
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'h') {
        return '姨父';
      }
      
      // 丈夫的妈妈的姐姐的女儿：表姐妹
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'd') {
        return '表姐妹';
      }
      
      // 丈夫的妈妈的姐姐的女儿的丈夫：表姐妹夫
      if (afterGrandmaChain.length === 3 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'd' && afterGrandmaChain[2] === 'h') {
        return '表姐妹夫';
      }
      
      // 丈夫的妈妈的姐姐的儿子：表侄
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 's') {
        return '表侄';
      }
      
      // 丈夫的妈妈的姐姐的妹妹：姨母
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'ls') {
        return '姨母';
      }
      
      // 丈夫的妈妈的姐姐的妹妹的丈夫：姨父
      if (afterGrandmaChain.length === 3 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'ls' && afterGrandmaChain[2] === 'h') {
        return '姨父';
      }
      
      // ========== 丈夫的妈妈的姐姐的妹妹的丈夫的亲属系列 ==========
      // 关系链：h, m, os, ls, h, ...
      if (afterGrandmaChain.length >= 3 && afterGrandmaChain[0] === 'os' && afterGrandmaChain[1] === 'ls' && afterGrandmaChain[2] === 'h') {
        var afterUncleInLawChain = afterGrandmaChain.slice(3); // 去掉 [os, ls, h] 后的关系链
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的哥哥：姻伯
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'ob') {
          return '姻伯';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的哥哥的妻子：姻伯母
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'ob' && afterUncleInLawChain[1] === 'w') {
          return '姻伯母';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的哥哥的儿子：姻表兄弟
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'ob' && afterUncleInLawChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的姐姐：姻姑母
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'os') {
          return '姻姑母';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的姐姐的丈夫：姻姑父
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 'h') {
          return '姻姑父';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的姐姐的儿子：姻表兄弟
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的姐姐的女儿：姻表姐妹
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 'd') {
          return '姻表姐妹';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的爸爸：姻祖父
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'f') {
          return '姻祖父';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的妈妈：姻祖母
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'm') {
          return '姻祖母';
        }
        
        // 丈夫的妈妈的姐姐的妹妹的丈夫的爸爸的爸爸：姻曾祖父
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'f' && afterUncleInLawChain[1] === 'f') {
          return '姻曾祖父';
        }
      }
      
      // ========== 丈夫的妈妈的妹妹的丈夫的亲属系列 ==========
      // 关系链：h, m, ls, h, ...
      if (afterGrandmaChain.length >= 2 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 'h') {
        var afterAuntHusbandChain = afterGrandmaChain.slice(2); // 去掉 [ls, h] 后的关系链
        
        // 丈夫的妈妈的妹妹的丈夫（无后续关系）：姨父
        if (afterAuntHusbandChain.length === 0) {
          return '姨父';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的哥哥：姻伯
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'ob') {
          return '姻伯';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的哥哥的妻子：姻伯母
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'ob' && afterAuntHusbandChain[1] === 'w') {
          return '姻伯母';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的哥哥的儿子：姻表兄弟
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'ob' && afterAuntHusbandChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的姐姐：姻姑母
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'os') {
          return '姻姑母';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的姐姐的丈夫：姻姑父
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 'h') {
          return '姻姑父';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的姐姐的儿子：姻表兄弟
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的姐姐的女儿：姻表姐妹
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 'd') {
          return '姻表姐妹';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的爸爸：姻祖父
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'f') {
          return '姻祖父';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的妈妈：姻祖母
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'm') {
          return '姻祖母';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的爸爸的爸爸：姻曾祖父
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'f' && afterAuntHusbandChain[1] === 'f') {
          return '姻曾祖父';
        }
        
        // 丈夫的妈妈的妹妹的丈夫的爸爸的爸爸的儿子：表叔/表伯
        if (afterAuntHusbandChain.length === 3 && afterAuntHusbandChain[0] === 'f' && afterAuntHusbandChain[1] === 'f' && (afterAuntHusbandChain[2] === 'ob' || afterAuntHusbandChain[2] === 'lb')) {
          return '表叔';
        }
      }
      
      // 丈夫的妈妈的妹妹（无后续关系）：姨母
      if (afterGrandmaChain.length === 1 && afterGrandmaChain[0] === 'ls') {
        return '姨母';
      }
      
      // ========== 丈夫的妈妈的妹妹的子女系列 ==========
      // 关系链：h, m, ls, d/s/h...
      
      // 丈夫的妈妈的妹妹的女儿：表姐妹
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 'd') {
        return '表姐妹';
      }
      
      // 丈夫的妈妈的妹妹的女儿的丈夫：表姐妹夫
      if (afterGrandmaChain.length === 3 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 'd' && afterGrandmaChain[2] === 'h') {
        return '表姐妹夫';
      }
      
      // 丈夫的妈妈的妹妹的女儿的儿子：表侄（李倩视角修复）
      if (afterGrandmaChain.length === 3 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 'd' && afterGrandmaChain[2] === 's') {
        return '表侄';
      }
      
      // 丈夫的妈妈的妹妹的女儿的女儿：表侄女
      if (afterGrandmaChain.length === 3 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 'd' && afterGrandmaChain[2] === 'd') {
        return '表侄女';
      }
      
      // 丈夫的妈妈的妹妹的儿子：表侄
      if (afterGrandmaChain.length === 2 && afterGrandmaChain[0] === 'ls' && afterGrandmaChain[1] === 's') {
        return '表侄';
      }
    }
    
    // ========== 模式 0g-4：妻子的妈妈的亲属系列（男性视角） ==========
    // 处理：妻子的妈妈的爸爸/妈妈/姐姐/妹妹及其亲属
    // 关系链：w, m, ...
    if (chain.length >= 2 && chain[0] === 'w' && chain[1] === 'm') {
      var afterWifeMomChain = chain.slice(2); // 去掉 [w, m] 后的关系链
      
      // 妻子的妈妈的爸爸：外公
      if (afterWifeMomChain.length === 1 && afterWifeMomChain[0] === 'f') {
        return '外公';
      }
      
      // 妻子的妈妈的妈妈：外婆
      if (afterWifeMomChain.length === 1 && afterWifeMomChain[0] === 'm') {
        return '外婆';
      }
      
      // 妻子的妈妈的姐姐：姨母
      if (afterWifeMomChain.length === 1 && afterWifeMomChain[0] === 'os') {
        return '姨母';
      }
      
      // 妻子的妈妈的妹妹：姨母
      if (afterWifeMomChain.length === 1 && afterWifeMomChain[0] === 'ls') {
        return '姨母';
      }
      
      // 妻子的妈妈的姐姐的丈夫：姨父
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'h') {
        return '姨父';
      }
      
      // 妻子的妈妈的妹妹的丈夫：姨父
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 'h') {
        return '姨父';
      }
      
      // 妻子的妈妈的姐姐的女儿：表姐妹
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'd') {
        return '表姐妹';
      }
      
      // 妻子的妈妈的姐姐的女儿的丈夫：表姐妹夫
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'd' && afterWifeMomChain[2] === 'h') {
        return '表姐妹夫';
      }
      
      // 妻子的妈妈的姐姐的儿子：表兄弟
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's') {
        return '表兄弟';
      }
      
      // 妻子的妈妈的姐姐的儿子的妻子：表兄弟媳
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'w') {
        return '表兄弟媳';
      }
      
      // 妻子的妈妈的姐姐的儿子的女儿：表侄女
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'd') {
        return '表侄女';
      }
      
      // 妻子的妈妈的姐姐的儿子的女儿的丈夫：表侄女婿
      if (afterWifeMomChain.length === 4 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'd' && afterWifeMomChain[3] === 'h') {
        return '表侄女婿';
      }
      
      // 妻子的妈妈的姐姐的儿子的女儿的儿子：表外孙
      if (afterWifeMomChain.length === 4 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'd' && afterWifeMomChain[3] === 's') {
        return '表外孙';
      }
      
      // 妻子的妈妈的姐姐的儿子的女儿的儿子的儿子：表外曾孙
      if (afterWifeMomChain.length === 5 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'd' && afterWifeMomChain[3] === 's' && afterWifeMomChain[4] === 's') {
        return '表外曾孙';
      }
      
      // 妻子的妈妈的姐姐的儿子的女儿的儿子的儿子的儿子：表外玄孙
      if (afterWifeMomChain.length === 6 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'd' && afterWifeMomChain[3] === 's' && afterWifeMomChain[4] === 's' && afterWifeMomChain[5] === 's') {
        return '表外玄孙';
      }
      
      // 妻子的妈妈的妹妹的女儿：表姐妹
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 'd') {
        return '表姐妹';
      }
      
      // 妻子的妈妈的妹妹的女儿的丈夫：表姐妹夫
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 'd' && afterWifeMomChain[2] === 'h') {
        return '表姐妹夫';
      }
      
      // 妻子的妈妈的妹妹的儿子：表兄弟
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 's') {
        return '表兄弟';
      }
      
      // 妻子的妈妈的妹妹的儿子的妻子：表兄弟媳
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 's' && afterWifeMomChain[2] === 'w') {
        return '表兄弟媳';
      }
      
      // 妻子的妈妈的姐姐的妹妹：姨母
      if (afterWifeMomChain.length === 2 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'ls') {
        return '姨母';
      }
      
      // 妻子的妈妈的姐姐的妹妹的丈夫：姨父
      if (afterWifeMomChain.length === 3 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'ls' && afterWifeMomChain[2] === 'h') {
        return '姨父';
      }
      
      // ========== 妻子的妈妈的姐姐的妹妹的丈夫的亲属系列 ==========
      // 关系链：w, m, os, ls, h, ...
      if (afterWifeMomChain.length >= 3 && afterWifeMomChain[0] === 'os' && afterWifeMomChain[1] === 'ls' && afterWifeMomChain[2] === 'h') {
        var afterUncleInLawChain = afterWifeMomChain.slice(3); // 去掉 [os, ls, h] 后的关系链
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的哥哥：姻伯
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'ob') {
          return '姻伯';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的哥哥的妻子：姻伯母
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'ob' && afterUncleInLawChain[1] === 'w') {
          return '姻伯母';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的哥哥的儿子：姻表兄弟
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'ob' && afterUncleInLawChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的姐姐：姻姑母
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'os') {
          return '姻姑母';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的姐姐的丈夫：姻姑父
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 'h') {
          return '姻姑父';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的姐姐的儿子：姻表兄弟
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的姐姐的女儿：姻表姐妹
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'os' && afterUncleInLawChain[1] === 'd') {
          return '姻表姐妹';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的爸爸：姻祖父
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'f') {
          return '姻祖父';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的妈妈：姻祖母
        if (afterUncleInLawChain.length === 1 && afterUncleInLawChain[0] === 'm') {
          return '姻祖母';
        }
        
        // 妻子的妈妈的姐姐的妹妹的丈夫的爸爸的爸爸：姻曾祖父
        if (afterUncleInLawChain.length === 2 && afterUncleInLawChain[0] === 'f' && afterUncleInLawChain[1] === 'f') {
          return '姻曾祖父';
        }
      }
      
      // ========== 妻子的妈妈的妹妹的丈夫的亲属系列 ==========
      // 关系链：w, m, ls, h, ...
      if (afterWifeMomChain.length >= 2 && afterWifeMomChain[0] === 'ls' && afterWifeMomChain[1] === 'h') {
        var afterAuntHusbandChain = afterWifeMomChain.slice(2); // 去掉 [ls, h] 后的关系链
        
        // 妻子的妈妈的妹妹的丈夫的哥哥：姻伯
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'ob') {
          return '姻伯';
        }
        
        // 妻子的妈妈的妹妹的丈夫的哥哥的妻子：姻伯母
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'ob' && afterAuntHusbandChain[1] === 'w') {
          return '姻伯母';
        }
        
        // 妻子的妈妈的妹妹的丈夫的哥哥的儿子：姻表兄弟
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'ob' && afterAuntHusbandChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 妻子的妈妈的妹妹的丈夫的姐姐：姻姑母
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'os') {
          return '姻姑母';
        }
        
        // 妻子的妈妈的妹妹的丈夫的姐姐的丈夫：姻姑父
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 'h') {
          return '姻姑父';
        }
        
        // 妻子的妈妈的妹妹的丈夫的姐姐的儿子：姻表兄弟
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 's') {
          return '姻表兄弟';
        }
        
        // 妻子的妈妈的妹妹的丈夫的姐姐的女儿：姻表姐妹
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'os' && afterAuntHusbandChain[1] === 'd') {
          return '姻表姐妹';
        }
        
        // 妻子的妈妈的妹妹的丈夫的爸爸：姻祖父
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'f') {
          return '姻祖父';
        }
        
        // 妻子的妈妈的妹妹的丈夫的妈妈：姻祖母
        if (afterAuntHusbandChain.length === 1 && afterAuntHusbandChain[0] === 'm') {
          return '姻祖母';
        }
        
        // 妻子的妈妈的妹妹的丈夫的爸爸的爸爸：姻曾祖父
        if (afterAuntHusbandChain.length === 2 && afterAuntHusbandChain[0] === 'f' && afterAuntHusbandChain[1] === 'f') {
          return '姻曾祖父';
        }
      }
    }
    
    // ========== 模式 0h-1：爸爸的妈妈的亲属系列（曹书语视角） ==========
    // 处理：爸爸的妈妈的爸爸/妈妈/兄弟姐妹及其后代
    // 关系链：[f, m, ...]
    if (chain.length >= 2 && chain[0] === 'f' && chain[1] === 'm') {
      var afterGrandmotherChain = chain.slice(2); // 去掉 [f, m] 后的关系链
      
      // ========== 外伯祖父/外叔祖父系列（爸爸的妈妈的兄弟） ==========
      // 关系链：[f, m, ob/lb, ...]
      if (afterGrandmotherChain.length >= 1 && (afterGrandmotherChain[0] === 'ob' || afterGrandmotherChain[0] === 'lb')) {
        var grandmaSibRel = afterGrandmotherChain[0]; // ob/lb
        var afterGrandmaSibChain = afterGrandmotherChain.slice(1); // 去掉 ob/lb 后的关系链
        
        // 爸爸的妈妈的哥哥：外伯祖父
        if (afterGrandmaSibChain.length === 0 && grandmaSibRel === 'ob') {
          return '外伯祖父';
        }
        
        // 爸爸的妈妈的弟弟：外叔祖父
        if (afterGrandmaSibChain.length === 0 && grandmaSibRel === 'lb') {
          return '外叔祖父';
        }
        
        // 爸爸的妈妈的哥哥的妻子：外伯祖母
        if (afterGrandmaSibChain.length === 1 && grandmaSibRel === 'ob' && afterGrandmaSibChain[0] === 'w') {
          return '外伯祖母';
        }
        
        // 爸爸的妈妈的弟弟的妻子：外叔祖母
        if (afterGrandmaSibChain.length === 1 && grandmaSibRel === 'lb' && afterGrandmaSibChain[0] === 'w') {
          return '外叔祖母';
        }
        
        // 爸爸的妈妈的兄弟的儿子：表伯叔父
        if (afterGrandmaSibChain.length === 1 && afterGrandmaSibChain[0] === 's') {
          return '表伯叔父';
        }
        
        // 爸爸的妈妈的兄弟的儿子的妻子：表伯叔母
        if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 'w') {
          return '表伯叔母';
        }
        
        // 爸爸的妈妈的兄弟的子女的后代（表兄弟姐妹系列）
        if (afterGrandmaSibChain.length >= 1 && (afterGrandmaSibChain[0] === 's' || afterGrandmaSibChain[0] === 'd')) {
          var lastGenGender = 'male';
          for (var i = afterGrandmaSibChain.length - 1; i >= 0; i--) {
            if (afterGrandmaSibChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterGrandmaSibChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 表姑父：爸爸的妈妈的兄弟的女儿的丈夫 [ob/lb, d, h]
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 'd' && afterGrandmaSibChain[1] === 'h') {
            return '表姑父';
          }
          
          // 表姑母：爸爸的妈妈的兄弟的女儿 [ob/lb, d]
          if (afterGrandmaSibChain.length === 1 && afterGrandmaSibChain[0] === 'd') {
            return '表姑母';
          }
          
          // 表伯叔父：爸爸的妈妈的兄弟的儿子 [ob/lb, s]
          if (afterGrandmaSibChain.length === 1 && afterGrandmaSibChain[0] === 's') {
            return '表伯叔父';
          }
          
          // 表伯叔母：爸爸的妈妈的兄弟的儿子的妻子 [ob/lb, s, w]
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 'w') {
            return '表伯叔母';
          }
          
          // 女儿的子女：[d, s] 表兄弟，[d, d] 表姐妹
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 'd' && afterGrandmaSibChain[1] === 's') {
            return '表兄弟';
          }
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 'd' && afterGrandmaSibChain[1] === 'd') {
            return '表姐妹';
          }
          
          // 女儿的子女的配偶：[d, s, w] 表兄弟媳，[d, d, h] 表姐妹夫
          if (afterGrandmaSibChain.length === 3 && afterGrandmaSibChain[0] === 'd' && afterGrandmaSibChain[1] === 's' && afterGrandmaSibChain[2] === 'w') {
            return '表兄弟媳';
          }
          if (afterGrandmaSibChain.length === 3 && afterGrandmaSibChain[0] === 'd' && afterGrandmaSibChain[1] === 'd' && afterGrandmaSibChain[2] === 'h') {
            return '表姐妹夫';
          }
          
          // 儿子的子女：[s, s] 表兄弟，[s, d] 表姐妹（外伯祖父的孙辈和我同辈）
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 's') {
            return '表兄弟';
          }
          if (afterGrandmaSibChain.length === 2 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 'd') {
            return '表姐妹';
          }
          
          // 儿子的子女的配偶：[s, s, w] 表兄弟媳，[s, d, h] 表姐妹夫
          if (afterGrandmaSibChain.length === 3 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 's' && afterGrandmaSibChain[2] === 'w') {
            return '表兄弟媳';
          }
          if (afterGrandmaSibChain.length === 3 && afterGrandmaSibChain[0] === 's' && afterGrandmaSibChain[1] === 'd' && afterGrandmaSibChain[2] === 'h') {
            return '表姐妹夫';
          }
          
          // 表侄/表侄女（向下 1 代）- 儿子的孙子女
          if (afterGrandmaSibChain.length === 3 && afterGrandmaSibChain[0] === 's' && (afterGrandmaSibChain[1] === 's' || afterGrandmaSibChain[1] === 'd')) {
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          
          // 表侄孙/表侄孙女（向下 2 代）
          if (afterGrandmaSibChain.length === 4) {
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
        }
      }
      
      // 爸爸的妈妈的爸爸：曾祖父
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'f') {
        return '曾祖父';
      }
      
      // 爸爸的妈妈的妈妈：曾祖母
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'm') {
        return '曾祖母';
      }
      
      // 爸爸的妈妈的哥哥：舅祖父
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'ob') {
        return '舅祖父';
      }
      
      // 爸爸的妈妈的弟弟：舅祖父
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'lb') {
        return '舅祖父';
      }
      
      // 爸爸的妈妈的姐姐：姨祖母
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'os') {
        return '姨祖母';
      }
      
      // 爸爸的妈妈的妹妹：姨祖母
      if (afterGrandmotherChain.length === 1 && afterGrandmotherChain[0] === 'ls') {
        return '姨祖母';
      }
      
      // 爸爸的妈妈的哥哥的妻子：舅祖母
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'ob' && afterGrandmotherChain[1] === 'w') {
        return '舅祖母';
      }
      
      // 爸爸的妈妈的弟弟的妻子：舅祖母
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'lb' && afterGrandmotherChain[1] === 'w') {
        return '舅祖母';
      }
      
      // 爸爸的妈妈的姐姐的丈夫：姨祖父
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'os' && afterGrandmotherChain[1] === 'h') {
        return '姨祖父';
      }
      
      // 爸爸的妈妈的妹妹的丈夫：姨祖父
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'ls' && afterGrandmotherChain[1] === 'h') {
        return '姨祖父';
      }
      
      // 爸爸的妈妈的姐妹的女儿：表姑/表姨
      if (afterGrandmotherChain.length === 2 && (afterGrandmotherChain[0] === 'os' || afterGrandmotherChain[0] === 'ls') && afterGrandmotherChain[1] === 'd') {
        return '表姑';
      }
      
      // 爸爸的妈妈的姐妹的女儿的丈夫：表姑父
      if (afterGrandmotherChain.length === 3 && (afterGrandmotherChain[0] === 'os' || afterGrandmotherChain[0] === 'ls') && afterGrandmotherChain[1] === 'd' && afterGrandmotherChain[2] === 'h') {
        return '表姑父';
      }
      
      // 爸爸的妈妈的姐妹的丈夫的亲属系列（姻亲）
      // 关系链：[f, m, ls/ob, h, ...]
      if (afterGrandmotherChain.length >= 2 && (afterGrandmotherChain[0] === 'os' || afterGrandmotherChain[0] === 'ls') && afterGrandmotherChain[1] === 'h') {
        var auntHusbandRel = afterGrandmotherChain.slice(2); // 去掉 [ls/os, h] 后的关系链
        
        // 爸爸的妈妈的妹妹的丈夫的爸爸：姻曾祖父
        if (auntHusbandRel.length === 1 && auntHusbandRel[0] === 'f') {
          return '姻曾祖父';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的妈妈：姻曾祖母
        if (auntHusbandRel.length === 1 && auntHusbandRel[0] === 'm') {
          return '姻曾祖母';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的爸爸的爸爸：姻高祖父
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'f' && auntHusbandRel[1] === 'f') {
          return '姻高祖父';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的哥哥：姻伯祖父
        if (auntHusbandRel.length === 1 && auntHusbandRel[0] === 'ob') {
          return '姻伯祖父';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的哥哥的妻子：姻伯祖母
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'ob' && auntHusbandRel[1] === 'w') {
          return '姻伯祖母';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的姐姐：姻姑祖母
        if (auntHusbandRel.length === 1 && auntHusbandRel[0] === 'os') {
          return '姻姑祖母';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的姐姐的丈夫：姻姑祖父
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'os' && auntHusbandRel[1] === 'h') {
          return '姻姑祖父';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的姐姐的女儿：姻表姑
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'os' && auntHusbandRel[1] === 'd') {
          return '姻表姑';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的姐姐的儿子：姻表伯/姻表叔
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'os' && auntHusbandRel[1] === 's') {
          return '姻表伯';
        }
        
        // 爸爸的妈妈的妹妹的丈夫的哥哥的儿子：姻表伯
        if (auntHusbandRel.length === 2 && auntHusbandRel[0] === 'ob' && auntHusbandRel[1] === 's') {
          return '姻表伯';
        }
      }
      
      // 爸爸的妈妈的妹妹的儿子：表叔
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'ls' && afterGrandmotherChain[1] === 's') {
        return '表叔';
      }
      
      // 爸爸的妈妈的妹妹的女儿：表姑
      if (afterGrandmotherChain.length === 2 && afterGrandmotherChain[0] === 'ls' && afterGrandmotherChain[1] === 'd') {
        return '表姑';
      }
      
      // 爸爸的妈妈的妹妹的女儿的丈夫：表姑父
      if (afterGrandmotherChain.length === 3 && afterGrandmotherChain[0] === 'ls' && afterGrandmotherChain[1] === 'd' && afterGrandmotherChain[2] === 'h') {
        return '表姑父';
      }
    }
    
    // ========== 模式 0i：妻子的爸爸的妈妈的亲属系列（张小强视角） ==========
    // 处理：妻子的爸爸的妈妈的爸爸/妈妈/兄弟姐妹及其后代
    // 关系链：[w, f, m, ...]
    if (chain.length >= 3 && chain[0] === 'w' && chain[1] === 'f' && chain[2] === 'm') {
      var afterWfGrandmotherChain = chain.slice(3); // 去掉 [w, f, m] 后的关系链
      
      // ========== 外伯祖父/外叔祖父系列（妻子的爸爸的妈妈的兄弟） ==========
      // 关系链：[w, f, m, ob/lb, ...]
      if (afterWfGrandmotherChain.length >= 1 && (afterWfGrandmotherChain[0] === 'ob' || afterWfGrandmotherChain[0] === 'lb')) {
        var wifeFmSibRel = afterWfGrandmotherChain[0]; // ob/lb
        var afterWfFmSibChain = afterWfGrandmotherChain.slice(1); // 去掉 ob/lb 后的关系链
        
        // 妻子的爸爸的妈妈的哥哥：外伯祖父
        if (afterWfFmSibChain.length === 0 && wifeFmSibRel === 'ob') {
          return '外伯祖父';
        }
        
        // 妻子的爸爸的妈妈的弟弟：外叔祖父
        if (afterWfFmSibChain.length === 0 && wifeFmSibRel === 'lb') {
          return '外叔祖父';
        }
        
        // 妻子的爸爸的妈妈的哥哥的妻子：外伯祖母
        if (afterWfFmSibChain.length === 1 && wifeFmSibRel === 'ob' && afterWfFmSibChain[0] === 'w') {
          return '外伯祖母';
        }
        
        // 妻子的爸爸的妈妈的弟弟的妻子：外叔祖母
        if (afterWfFmSibChain.length === 1 && wifeFmSibRel === 'lb' && afterWfFmSibChain[0] === 'w') {
          return '外叔祖母';
        }
        
        // 妻子的爸爸的妈妈的兄弟的儿子：表伯叔父
        if (afterWfFmSibChain.length === 1 && afterWfFmSibChain[0] === 's') {
          return '表伯叔父';
        }
        
        // 妻子的爸爸的妈妈的兄弟的儿子的妻子：表伯叔母
        if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 'w') {
          return '表伯叔母';
        }
        
        // 妻子的爸爸的妈妈的兄弟的子女的后代（表兄弟姐妹系列）
        if (afterWfFmSibChain.length >= 1 && (afterWfFmSibChain[0] === 's' || afterWfFmSibChain[0] === 'd')) {
          var lastGenGender = 'male';
          for (var i = afterWfFmSibChain.length - 1; i >= 0; i--) {
            if (afterWfFmSibChain[i] === 's') { lastGenGender = 'male'; break; }
            else if (afterWfFmSibChain[i] === 'd') { lastGenGender = 'female'; break; }
          }
          
          // 表姑父：妻子的爸爸的妈妈的兄弟的女儿的丈夫 [w,f,m,ob/lb,d,h]
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 'd' && afterWfFmSibChain[1] === 'h') {
            return '表姑父';
          }
          
          // 表姑母：妻子的爸爸的妈妈的兄弟的女儿 [w,f,m,ob/lb,d]
          if (afterWfFmSibChain.length === 1 && afterWfFmSibChain[0] === 'd') {
            return '表姑母';
          }
          
          // 表伯叔父：妻子的爸爸的妈妈的兄弟的儿子 [w,f,m,ob/lb,s]
          if (afterWfFmSibChain.length === 1 && afterWfFmSibChain[0] === 's') {
            return '表伯叔父';
          }
          
          // 表伯叔母：妻子的爸爸的妈妈的兄弟的儿子的妻子 [w,f,m,ob/lb,s,w]
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 'w') {
            return '表伯叔母';
          }
          
          // 女儿的子女：[d, s] 表兄弟，[d, d] 表姐妹
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 'd' && afterWfFmSibChain[1] === 's') {
            return '表兄弟';
          }
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 'd' && afterWfFmSibChain[1] === 'd') {
            return '表姐妹';
          }
          
          // 女儿的子女的配偶：[d, s, w] 表兄弟媳，[d, d, h] 表姐妹夫
          if (afterWfFmSibChain.length === 3 && afterWfFmSibChain[0] === 'd' && afterWfFmSibChain[1] === 's' && afterWfFmSibChain[2] === 'w') {
            return '表兄弟媳';
          }
          if (afterWfFmSibChain.length === 3 && afterWfFmSibChain[0] === 'd' && afterWfFmSibChain[1] === 'd' && afterWfFmSibChain[2] === 'h') {
            return '表姐妹夫';
          }
          
          // 儿子的子女：[s, s] 表兄弟，[s, d] 表姐妹
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 's') {
            return '表兄弟';
          }
          if (afterWfFmSibChain.length === 2 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 'd') {
            return '表姐妹';
          }
          
          // 儿子的子女的配偶：[s, s, w] 表兄弟媳，[s, d, h] 表姐妹夫
          if (afterWfFmSibChain.length === 3 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 's' && afterWfFmSibChain[2] === 'w') {
            return '表兄弟媳';
          }
          if (afterWfFmSibChain.length === 3 && afterWfFmSibChain[0] === 's' && afterWfFmSibChain[1] === 'd' && afterWfFmSibChain[2] === 'h') {
            return '表姐妹夫';
          }
          
          // 表侄/表侄女（向下 1 代）
          if (afterWfFmSibChain.length === 3 && afterWfFmSibChain[0] === 's' && (afterWfFmSibChain[1] === 's' || afterWfFmSibChain[1] === 'd')) {
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          
          // 表侄孙/表侄孙女（向下 2 代）
          if (afterWfFmSibChain.length === 4) {
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
        }
      }
      
      // 妻子的爸爸的妈妈的爸爸：曾祖父
      if (afterWfGrandmotherChain.length === 1 && afterWfGrandmotherChain[0] === 'f') {
        return '曾祖父';
      }
      
      // 妻子的爸爸的妈妈的妈妈：曾祖母
      if (afterWfGrandmotherChain.length === 1 && afterWfGrandmotherChain[0] === 'm') {
        return '曾祖母';
      }
      
      // 妻子的爸爸的妈妈的妹妹：姨祖母
      if (afterWfGrandmotherChain.length === 1 && afterWfGrandmotherChain[0] === 'ls') {
        return '姨祖母';
      }
      
      // 妻子的爸爸的妈妈的妹妹的丈夫：姨祖父
      if (afterWfGrandmotherChain.length === 2 && afterWfGrandmotherChain[0] === 'ls' && afterWfGrandmotherChain[1] === 'h') {
        return '姨祖父';
      }
      
      // 妻子的爸爸的妈妈的妹妹的儿子：表叔
      if (afterWfGrandmotherChain.length === 2 && afterWfGrandmotherChain[0] === 'ls' && afterWfGrandmotherChain[1] === 's') {
        return '表叔';
      }
      
      // 妻子的爸爸的妈妈的妹妹的女儿：表姑
      if (afterWfGrandmotherChain.length === 2 && afterWfGrandmotherChain[0] === 'ls' && afterWfGrandmotherChain[1] === 'd') {
        return '表姑';
      }
      
      // 妻子的爸爸的妈妈的妹妹的女儿的丈夫：表姑父
      if (afterWfGrandmotherChain.length === 3 && afterWfGrandmotherChain[0] === 'ls' && afterWfGrandmotherChain[1] === 'd' && afterWfGrandmotherChain[2] === 'h') {
        return '表姑父';
      }
      
      // 妻子的爸爸的妈妈的妹妹的丈夫的亲属系列（姻亲）
      if (afterWfGrandmotherChain.length >= 2 && afterWfGrandmotherChain[0] === 'ls' && afterWfGrandmotherChain[1] === 'h') {
        var wifeAuntHusbandRel = afterWfGrandmotherChain.slice(2);
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的姐姐：姻姑祖母
        if (wifeAuntHusbandRel.length === 1 && wifeAuntHusbandRel[0] === 'os') {
          return '姻姑祖母';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的姐姐的丈夫：姻姑祖父
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'os' && wifeAuntHusbandRel[1] === 'h') {
          return '姻姑祖父';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的姐姐的女儿：姻表姑
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'os' && wifeAuntHusbandRel[1] === 'd') {
          return '姻表姑';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的姐姐的儿子：姻表伯
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'os' && wifeAuntHusbandRel[1] === 's') {
          return '姻表伯';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的爸爸：姻曾祖父
        if (wifeAuntHusbandRel.length === 1 && wifeAuntHusbandRel[0] === 'f') {
          return '姻曾祖父';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的妈妈：姻曾祖母
        if (wifeAuntHusbandRel.length === 1 && wifeAuntHusbandRel[0] === 'm') {
          return '姻曾祖母';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的爸爸的爸爸：姻高祖父
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'f' && wifeAuntHusbandRel[1] === 'f') {
          return '姻高祖父';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的哥哥：姻伯祖父
        if (wifeAuntHusbandRel.length === 1 && wifeAuntHusbandRel[0] === 'ob') {
          return '姻伯祖父';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的哥哥的妻子：姻伯祖母
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'ob' && wifeAuntHusbandRel[1] === 'w') {
          return '姻伯祖母';
        }
        
        // 妻子的爸爸的妈妈的妹妹的丈夫的哥哥的儿子：姻表伯
        if (wifeAuntHusbandRel.length === 2 && wifeAuntHusbandRel[0] === 'ob' && wifeAuntHusbandRel[1] === 's') {
          return '姻表伯';
        }
      }
    }
    

    // ========== 模式 0h-2：爸爸的爸爸的兄弟（叔祖父）及其后代 ==========
    // 关系链：[f, f, ob/lb, ...]
    if (chain.length >= 3 && chain[0] === 'f' && chain[1] === 'f' && 
        (chain[2] === 'ob' || chain[2] === 'lb')) {
      var greatUncleRel = chain[2]; // ob/lb
      var afterGreatUncleChain = chain.slice(3);
      
      // 爸爸的爸爸的哥哥：伯祖父
      if (afterGreatUncleChain.length === 0 && greatUncleRel === 'ob') {
        return '伯祖父';
      }
      // 爸爸的爸爸的弟弟：叔祖父
      if (afterGreatUncleChain.length === 0 && greatUncleRel === 'lb') {
        return '叔祖父';
      }
      
      // 爸爸的爸爸的兄弟的妻子：伯祖母/叔祖母
      if (afterGreatUncleChain.length === 1 && afterGreatUncleChain[0] === 'w') {
        return greatUncleRel === 'ob' ? '伯祖母' : '叔祖母';
      }
      
      // 爸爸的爸爸的兄弟的子女：堂伯叔父/堂姑母
      if (afterGreatUncleChain.length === 1) {
        if (afterGreatUncleChain[0] === 's') return '堂伯叔父';
        if (afterGreatUncleChain[0] === 'd') return '堂姑母';
      }
      
      // 爸爸的爸爸的兄弟的子女的配偶
      if (afterGreatUncleChain.length === 2) {
        if (afterGreatUncleChain[0] === 's' && afterGreatUncleChain[1] === 'w') return '堂伯叔母';
        if (afterGreatUncleChain[0] === 'd' && afterGreatUncleChain[1] === 'h') return '堂姑父';
      }
      
      // 爸爸的爸爸的兄弟的子女的后代
      if (afterGreatUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 儿子的子女 = 堂兄弟姐妹
        if (afterGreatUncleChain[0] === 's') {
          if (afterGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? '堂兄弟' : '堂姐妹';
          }
          if (afterGreatUncleChain.length === 3) {
            if (afterGreatUncleChain[1] === 's' && afterGreatUncleChain[2] === 'w') return '堂兄弟媳';
            if (afterGreatUncleChain[1] === 'd' && afterGreatUncleChain[2] === 'h') return '堂姐妹夫';
            if (afterGreatUncleChain[1] === 's') return '堂侄';
            if (afterGreatUncleChain[1] === 'd') return '堂侄女';
          }
          if (afterGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
          }
        }
        
        // 女儿的子女 = 表兄弟姐妹
        if (afterGreatUncleChain[0] === 'd') {
          if (afterGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
          }
          if (afterGreatUncleChain.length === 3) {
            if (afterGreatUncleChain[1] === 's' && afterGreatUncleChain[2] === 'w') return '表兄弟媳';
            if (afterGreatUncleChain[1] === 'd' && afterGreatUncleChain[2] === 'h') return '表姐妹夫';
            if (afterGreatUncleChain[1] === 's') return '表侄';
            if (afterGreatUncleChain[1] === 'd') return '表侄女';
          }
          if (afterGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
        }
      }
    }
    
    // ========== 模式 0h-2b：爸爸的爸爸的姐妹（姑祖母）及其后代 ==========
    // 关系链：[f, f, os/ls, ...]
    if (chain.length >= 3 && chain[0] === 'f' && chain[1] === 'f' && 
        (chain[2] === 'os' || chain[2] === 'ls')) {
      var greatAuntRel = chain[2]; // os/ls
      var afterGreatAuntChain = chain.slice(3);
      
      // 爸爸的爸爸的姐姐/妹妹：姑祖母
      if (afterGreatAuntChain.length === 0) {
        return '姑祖母';
      }
      
      // 爸爸的爸爸的姐妹的丈夫：姑祖父
      if (afterGreatAuntChain.length === 1 && afterGreatAuntChain[0] === 'h') {
        return '姑祖父';
      }
      
      // 爸爸的爸爸的姐妹的子女：表伯父/表姑母
      if (afterGreatAuntChain.length === 1) {
        if (afterGreatAuntChain[0] === 's') return '表伯父';
        if (afterGreatAuntChain[0] === 'd') return '表姑母';
      }
      
      // 爸爸的爸爸的姐妹的子女的配偶
      if (afterGreatAuntChain.length === 2) {
        if (afterGreatAuntChain[0] === 's' && afterGreatAuntChain[1] === 'w') return '表伯母';
        if (afterGreatAuntChain[0] === 'd' && afterGreatAuntChain[1] === 'h') return '表姑父';
      }
      
      // 爸爸的爸爸的姐妹的子女的后代
      if (afterGreatAuntChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterGreatAuntChain.length - 1; i >= 0; i--) {
          if (afterGreatAuntChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterGreatAuntChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        if (afterGreatAuntChain[0] === 's' && afterGreatAuntChain.length === 2) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        if (afterGreatAuntChain[0] === 'd' && afterGreatAuntChain.length === 2) {
          return lastGenGender === 'male' ? '表外甥' : '表外甥女';
        }
      }
    }
    
    // ========== 模式 0h-2c：爸爸的兄弟姐妹的后代及其配偶（堂亲/表亲系列） ==========
    // 处理：爸爸的哥哥/弟弟/姐姐/妹妹的子女及其配偶、后代
    // 关系链：[f, ob/lb/os/ls, s/d, ...]
    if (chain.length >= 3 && chain[0] === 'f' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls')) {
      var sibRel = chain[1]; // ob/lb/os/ls
      var afterCousinChain = chain.slice(2);
      
      // 判断父系/母系：爸爸的兄弟 = 堂亲，爸爸的姐妹 = 表亲
      var isTang = (sibRel === 'ob' || sibRel === 'lb');
      var isBiao = (sibRel === 'os' || sibRel === 'ls');
      
      // 爸爸的兄弟姐妹的子女：堂兄弟姐妹/表兄弟姐妹
      if (afterCousinChain.length === 1) {
        if (afterCousinChain[0] === 's') {
          if (isTang) {
            if (sibRel === 'ob') return '堂兄';
            if (sibRel === 'lb') return '堂弟';
          }
          if (isBiao) {
            if (sibRel === 'os') return '表兄';
            if (sibRel === 'ls') return '表弟';
          }
        }
        if (afterCousinChain[0] === 'd') {
          if (isTang) {
            if (sibRel === 'ob') return '堂姐';
            if (sibRel === 'lb') return '堂妹';
          }
          if (isBiao) {
            if (sibRel === 'os') return '表姐';
            if (sibRel === 'ls') return '表妹';
          }
        }
      }
      
      // 爸爸的兄弟姐妹的子女的配偶
      if (afterCousinChain.length === 2 && (afterCousinChain[1] === 'w' || afterCousinChain[1] === 'h')) {
        var childGender = (afterCousinChain[0] === 's') ? 'male' : 'female';
        var spouseGender = (afterCousinChain[1] === 'h') ? 'male' : 'female';
        
        if (childGender === 'male' && spouseGender === 'female') {
          if (isTang) {
            if (sibRel === 'ob' || sibRel === 'os') return '堂嫂';
            if (sibRel === 'lb' || sibRel === 'ls') return '堂弟媳';
          }
          if (isBiao) {
            if (sibRel === 'ob' || sibRel === 'os') return '表嫂';
            if (sibRel === 'lb' || sibRel === 'ls') return '表弟媳';
          }
        }
        if (childGender === 'female' && spouseGender === 'male') {
          if (isTang) {
            if (sibRel === 'ob' || sibRel === 'os') return '堂姐夫';
            if (sibRel === 'lb' || sibRel === 'ls') return '堂妹夫';
          }
          if (isBiao) {
            if (sibRel === 'ob' || sibRel === 'os') return '表姐夫';
            if (sibRel === 'lb' || sibRel === 'ls') return '表妹夫';
          }
        }
      }
      
      // 爸爸的兄弟姐妹的子女的后代
      if (afterCousinChain.length >= 2) {
        var genDown = 0;
        for (var i = 0; i < afterCousinChain.length; i++) {
          if (afterCousinChain[i] === 's' || afterCousinChain[i] === 'd') genDown++;
        }
        
        var lastGenGender = 'male';
        for (var i = afterCousinChain.length - 1; i >= 0; i--) {
          if (afterCousinChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterCousinChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        var cousinIsMale = (afterCousinChain[0] === 's');
        
        // 向下 1 代
        if (genDown === 2) {
          if (isTang) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '堂侄' : '堂侄女';
            } else {
              return lastGenGender === 'male' ? '堂外甥' : '堂外甥女';
            }
          }
          if (isBiao) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '表侄' : '表侄女';
            } else {
              return lastGenGender === 'male' ? '表外甥' : '表外甥女';
            }
          }
        }
        
        // 向下 2 代
        if (genDown === 3) {
          if (isTang) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
            } else {
              return lastGenGender === 'male' ? '堂外甥孙' : '堂外甥孙女';
            }
          }
          if (isBiao) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
            } else {
              return lastGenGender === 'male' ? '表外甥孙' : '表外甥孙女';
            }
          }
        }
        
        // 向下 3 代
        if (genDown === 4) {
          if (isTang) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '堂曾侄' : '堂曾侄女';
            } else {
              return lastGenGender === 'male' ? '堂曾外甥' : '堂曾外甥女';
            }
          }
          if (isBiao) {
            if (cousinIsMale) {
              return lastGenGender === 'male' ? '表曾侄' : '表曾侄女';
            } else {
              return lastGenGender === 'male' ? '表曾外甥' : '表曾外甥女';
            }
          }
        }
      }
    }

    // ========== 模式 0j：丈夫的妈妈的亲属系列（李倩视角） ==========
    // 处理：丈夫的妈妈的兄弟姐妹的后代
    // 关系链：[h, m, ...]
    if (chain.length >= 3 && chain[0] === 'h' && chain[1] === 'm') {
      var afterHusbandMotherChain = chain.slice(2);
      
      // 丈夫的妈妈的哥哥/弟弟/姐姐/妹妹：舅舅/姨妈
      if (afterHusbandMotherChain.length === 1) {
        if (afterHusbandMotherChain[0] === 'ob') return '舅舅';
        if (afterHusbandMotherChain[0] === 'lb') return '舅舅';
        if (afterHusbandMotherChain[0] === 'os') return '姨妈';
        if (afterHusbandMotherChain[0] === 'ls') return '姨妈';
      }
      
      // 丈夫的妈妈的兄弟姐妹的子女：表兄弟/表姐妹
      if (afterHusbandMotherChain.length === 2) {
        if (afterHusbandMotherChain[0] === 'ob' || afterHusbandMotherChain[0] === 'lb') {
          if (afterHusbandMotherChain[1] === 's') return '表兄弟';
          if (afterHusbandMotherChain[1] === 'd') return '表姐妹';
        }
        if (afterHusbandMotherChain[0] === 'os' || afterHusbandMotherChain[0] === 'ls') {
          if (afterHusbandMotherChain[1] === 's') return '表兄弟';
          if (afterHusbandMotherChain[1] === 'd') return '表姐妹';
        }
      }
      
      // 丈夫的妈妈的兄弟姐妹的子女的配偶
      if (afterHusbandMotherChain.length === 3) {
        var siblingRel = afterHusbandMotherChain[0];
        if ((siblingRel === 'ob' || siblingRel === 'lb' || siblingRel === 'os' || siblingRel === 'ls') &&
            afterHusbandMotherChain[2] === 'w') {
          return '表兄弟媳';
        }
        if ((siblingRel === 'ob' || siblingRel === 'lb' || siblingRel === 'os' || siblingRel === 'ls') &&
            afterHusbandMotherChain[1] === 'd' && afterHusbandMotherChain[2] === 'h') {
          return '表姐妹夫';
        }
      }
      
      // 丈夫的妈妈的兄弟姐妹的儿子的后代（表侄系列）
      if (afterHusbandMotherChain.length >= 3 && afterHusbandMotherChain[0] === 's') {
        var afterSonChain = afterHusbandMotherChain.slice(1);
        
        if (afterSonChain.length === 1) {
          if (afterSonChain[0] === 's') return '表侄';
          if (afterSonChain[0] === 'd') return '表侄女';
        }
        
        if (afterSonChain.length === 2) {
          if (afterSonChain[0] === 's' && afterSonChain[1] === 'w') return '表侄媳';
          if (afterSonChain[0] === 'd' && afterSonChain[1] === 'h') return '表侄女婿';
        }
        
        if (afterSonChain.length === 2 && afterSonChain[0] === 's') {
          if (afterSonChain[1] === 's') return '表侄孙';
          if (afterSonChain[1] === 'd') return '表侄孙女';
        }
      }
      
      // 丈夫的妈妈的兄弟姐妹的女儿的后代（表外甥系列）
      if (afterHusbandMotherChain.length >= 3 && afterHusbandMotherChain[0] === 'd') {
        var afterDaughterChain = afterHusbandMotherChain.slice(1);
        
        if (afterDaughterChain.length === 1) {
          if (afterDaughterChain[0] === 's') return '表外甥';
          if (afterDaughterChain[0] === 'd') return '表外甥女';
        }
        
        if (afterDaughterChain.length === 2) {
          if (afterDaughterChain[0] === 's' && afterDaughterChain[1] === 'w') return '表外甥媳';
          if (afterDaughterChain[0] === 'd' && afterDaughterChain[1] === 'h') return '表外甥女婿';
        }
        
        if (afterDaughterChain.length === 2 && afterDaughterChain[0] === 's') {
          if (afterDaughterChain[1] === 's') return '表外甥孙';
          if (afterDaughterChain[1] === 'd') return '表外甥孙女';
        }
      }
    }
    
    // ========== 模式 0j-2：丈夫的妈妈的爸爸的兄弟姐妹（外叔祖父/外姑祖母）及其后代 ==========
    // 关系链：[h, m, f, ob/lb/os/ls, ...]
    if (chain.length >= 4 && chain[0] === 'h' && chain[1] === 'm' && chain[2] === 'f' &&
        (chain[3] === 'ob' || chain[3] === 'lb' || chain[3] === 'os' || chain[3] === 'ls')) {
      var husbandMomGreatUncleRel = chain[3];
      var afterHusbandMomGreatUncleChain = chain.slice(4);
      
      // 丈夫的妈妈的爸爸的哥哥：外伯祖父
      if (afterHusbandMomGreatUncleChain.length === 0 && husbandMomGreatUncleRel === 'ob') {
        return '外伯祖父';
      }
      
      // 丈夫的妈妈的爸爸的弟弟：外叔祖父
      if (afterHusbandMomGreatUncleChain.length === 0 && husbandMomGreatUncleRel === 'lb') {
        return '外叔祖父';
      }
      
      // 丈夫的妈妈的爸爸的姐姐：外姑祖母
      if (afterHusbandMomGreatUncleChain.length === 0 && husbandMomGreatUncleRel === 'os') {
        return '外姑祖母';
      }
      
      // 丈夫的妈妈的爸爸的妹妹：外姑祖母
      if (afterHusbandMomGreatUncleChain.length === 0 && husbandMomGreatUncleRel === 'ls') {
        return '外姑祖母';
      }
      
      // 丈夫的妈妈的爸爸的姐妹的丈夫：外姑祖父
      if (afterHusbandMomGreatUncleChain.length === 1 && afterHusbandMomGreatUncleChain[0] === 'h') {
        return '外姑祖父';
      }
      
      // 丈夫的妈妈的爸爸的兄弟的妻子：外伯祖母/外叔祖母
      if (afterHusbandMomGreatUncleChain.length === 1 && afterHusbandMomGreatUncleChain[0] === 'w') {
        return husbandMomGreatUncleRel === 'ob' ? '外伯祖母' : '外叔祖母';
      }
      
      // 丈夫的妈妈的爸爸的兄弟姐妹的子女：表舅父/表姨母
      if (afterHusbandMomGreatUncleChain.length === 1) {
        if (afterHusbandMomGreatUncleChain[0] === 's') {
          return '表舅父';
        }
        if (afterHusbandMomGreatUncleChain[0] === 'd') {
          return '表姨母';
        }
      }
      
      // 丈夫的妈妈的爸爸的兄弟姐妹的子女的配偶
      if (afterHusbandMomGreatUncleChain.length === 2) {
        if (afterHusbandMomGreatUncleChain[0] === 's' && afterHusbandMomGreatUncleChain[1] === 'w') {
          return '表舅母';
        }
        if (afterHusbandMomGreatUncleChain[0] === 'd' && afterHusbandMomGreatUncleChain[1] === 'h') {
          return '表姨父';
        }
      }
      
      // 丈夫的妈妈的爸爸的兄弟姐妹的子女的后代（表兄弟姐妹系列）
      if (afterHusbandMomGreatUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterHusbandMomGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterHusbandMomGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterHusbandMomGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 表姐妹夫：[s, d, h]
        if (afterHusbandMomGreatUncleChain.length === 3 && 
            afterHusbandMomGreatUncleChain[0] === 's' && 
            afterHusbandMomGreatUncleChain[1] === 'd' && 
            afterHusbandMomGreatUncleChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表兄弟媳：[d, s, w]
        if (afterHusbandMomGreatUncleChain.length === 3 && 
            afterHusbandMomGreatUncleChain[0] === 'd' && 
            afterHusbandMomGreatUncleChain[1] === 's' && 
            afterHusbandMomGreatUncleChain[2] === 'w') {
          return '表兄弟媳';
        }
        
        if (afterHusbandMomGreatUncleChain.length === 2) {
          return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
        }
        if (afterHusbandMomGreatUncleChain.length === 3) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        if (afterHusbandMomGreatUncleChain.length === 4) {
          return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
        }
      }
    }
    
    // ========== 模式 0h：爸爸的兄弟姐妹、妈妈的亲属系列（安南视角） ==========
    // 处理：爸爸的哥哥/姐姐/弟弟/妹妹，妈妈的爸爸/妈妈/哥哥/姐姐/弟弟/妹妹及其后代
    
    // 爸爸的哥哥：伯伯
    if (chain.length === 2 && chain[0] === 'f' && chain[1] === 'ob') {
      return '伯伯';
    }
    
    // 爸爸的弟弟：叔叔
    if (chain.length === 2 && chain[0] === 'f' && chain[1] === 'lb') {
      return '叔叔';
    }
    
    // 爸爸的姐姐：姑妈
    if (chain.length === 2 && chain[0] === 'f' && chain[1] === 'os') {
      return '姑妈';
    }
    
    // 爸爸的妹妹：姑妈
    if (chain.length === 2 && chain[0] === 'f' && chain[1] === 'ls') {
      return '姑妈';
    }
    
    // 妈妈的爸爸：外公
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'f') {
      return '外公';
    }
    
    // 妈妈的妈妈：外婆
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'm') {
      return '外婆';
    }
    
    // 妈妈的哥哥：舅舅
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'ob') {
      return '舅舅';
    }
    
    // 妈妈的弟弟：舅舅
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'lb') {
      return '舅舅';
    }
    
    // 妈妈的姐姐：姨妈
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'os') {
      return '姨妈';
    }
    
    // 妈妈的妹妹：姨妈
    if (chain.length === 2 && chain[0] === 'm' && chain[1] === 'ls') {
      return '姨妈';
    }
    
    // ========== 模式 0h-3：妈妈的爸爸的兄弟（外叔祖父）及其后代 ==========
    // 关系链：[m, f, ob/lb, ...]
    if (chain.length >= 3 && chain[0] === 'm' && chain[1] === 'f' && 
        (chain[2] === 'ob' || chain[2] === 'lb')) {
      var momGreatUncleRel = chain[2]; // ob/lb
      var afterMomGreatUncleChain = chain.slice(3); // 去掉 [m, f, ob/lb] 后的关系链
      
      // 妈妈的爸爸的哥哥：外伯祖父
      if (afterMomGreatUncleChain.length === 0 && momGreatUncleRel === 'ob') {
        return '外伯祖父';
      }
      
      // 妈妈的爸爸的弟弟：外叔祖父
      if (afterMomGreatUncleChain.length === 0 && momGreatUncleRel === 'lb') {
        return '外叔祖父';
      }
      
      // 妈妈的爸爸的兄弟的妻子：外伯祖母/外叔祖母
      if (afterMomGreatUncleChain.length === 1 && afterMomGreatUncleChain[0] === 'w') {
        return momGreatUncleRel === 'ob' ? '外伯祖母' : '外叔祖母';
      }
      
      // 妈妈的爸爸的兄弟的子女：表舅父/表姨母
      if (afterMomGreatUncleChain.length === 1) {
        if (afterMomGreatUncleChain[0] === 's') {
          return '表舅父';
        }
        if (afterMomGreatUncleChain[0] === 'd') {
          return '表姨母';
        }
      }
      
      // 妈妈的爸爸的兄弟的子女的配偶
      if (afterMomGreatUncleChain.length === 2) {
        if (afterMomGreatUncleChain[0] === 's' && afterMomGreatUncleChain[1] === 'w') {
          return '表舅母';
        }
        if (afterMomGreatUncleChain[0] === 'd' && afterMomGreatUncleChain[1] === 'h') {
          return '表姨父';
        }
      }
      
      // 妈妈的爸爸的兄弟的子女的后代（表兄弟姐妹系列）
      if (afterMomGreatUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterMomGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterMomGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterMomGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 表姐妹夫：[s, d, h]
        if (afterMomGreatUncleChain.length === 3 && 
            afterMomGreatUncleChain[0] === 's' && 
            afterMomGreatUncleChain[1] === 'd' && 
            afterMomGreatUncleChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表姐妹夫：[d, d, h]
        if (afterMomGreatUncleChain.length === 3 && 
            afterMomGreatUncleChain[0] === 'd' && 
            afterMomGreatUncleChain[1] === 'd' && 
            afterMomGreatUncleChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表兄弟媳：[d, s, w]
        if (afterMomGreatUncleChain.length === 3 && 
            afterMomGreatUncleChain[0] === 'd' && 
            afterMomGreatUncleChain[1] === 's' && 
            afterMomGreatUncleChain[2] === 'w') {
          return '表兄弟媳';
        }
        
        if (afterMomGreatUncleChain.length === 2) {
          return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
        }
        if (afterMomGreatUncleChain.length === 3) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        if (afterMomGreatUncleChain.length === 4) {
          return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
        }
      }
    }
    
    // ========== 模式 0h-3b：妈妈的爸爸的姐妹（外姑祖母）及其后代 ==========
    // 关系链：[m, f, os/ls, ...]
    if (chain.length >= 3 && chain[0] === 'm' && chain[1] === 'f' && 
        (chain[2] === 'os' || chain[2] === 'ls')) {
      var momGreatAuntRel = chain[2]; // os/ls
      var afterMomGreatAuntChain = chain.slice(3); // 去掉 [m, f, os/ls] 后的关系链
      
      // 妈妈的爸爸的姐姐：外姑祖母
      if (afterMomGreatAuntChain.length === 0 && momGreatAuntRel === 'os') {
        return '外姑祖母';
      }
      
      // 妈妈的爸爸的妹妹：外姑祖母
      if (afterMomGreatAuntChain.length === 0 && momGreatAuntRel === 'ls') {
        return '外姑祖母';
      }
      
      // 妈妈的爸爸的姐妹的丈夫：外姑祖父
      if (afterMomGreatAuntChain.length === 1 && afterMomGreatAuntChain[0] === 'h') {
        return '外姑祖父';
      }
      
      // 妈妈的爸爸的姐妹的子女：表舅父/表姨母
      if (afterMomGreatAuntChain.length === 1) {
        if (afterMomGreatAuntChain[0] === 's') {
          return '表舅父';
        }
        if (afterMomGreatAuntChain[0] === 'd') {
          return '表姨母';
        }
      }
      
      // 妈妈的爸爸的姐妹的子女的配偶
      if (afterMomGreatAuntChain.length === 2) {
        if (afterMomGreatAuntChain[0] === 's' && afterMomGreatAuntChain[1] === 'w') {
          return '表舅母';
        }
        if (afterMomGreatAuntChain[0] === 'd' && afterMomGreatAuntChain[1] === 'h') {
          return '表姨父';
        }
      }
      
      // 妈妈的爸爸的姐妹的子女的后代（表兄弟姐妹系列）
      if (afterMomGreatAuntChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterMomGreatAuntChain.length - 1; i >= 0; i--) {
          if (afterMomGreatAuntChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterMomGreatAuntChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 表姐妹夫：[s, d, h]
        if (afterMomGreatAuntChain.length === 3 && 
            afterMomGreatAuntChain[0] === 's' && 
            afterMomGreatAuntChain[1] === 'd' && 
            afterMomGreatAuntChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表姐妹夫：[d, d, h]
        if (afterMomGreatAuntChain.length === 3 && 
            afterMomGreatAuntChain[0] === 'd' && 
            afterMomGreatAuntChain[1] === 'd' && 
            afterMomGreatAuntChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表兄弟媳：[d, s, w]
        if (afterMomGreatAuntChain.length === 3 && 
            afterMomGreatAuntChain[0] === 'd' && 
            afterMomGreatAuntChain[1] === 's' && 
            afterMomGreatAuntChain[2] === 'w') {
          return '表兄弟媳';
        }
        
        if (afterMomGreatAuntChain.length === 2) {
          return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
        }
        if (afterMomGreatAuntChain.length === 3) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        if (afterMomGreatAuntChain.length === 4) {
          return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
        }
      }
    }
    
    // ========== 模式 0h-4：妈妈的妈妈的爸爸的兄弟（外曾叔祖父）及其后代 ==========
    // 关系链：[m, m, f, ob/lb, ...]
    if (chain.length >= 4 && chain[0] === 'm' && chain[1] === 'm' && chain[2] === 'f' && 
        (chain[3] === 'ob' || chain[3] === 'lb')) {
      var momMomGreatUncleRel = chain[3]; // ob/lb
      var afterMomMomGreatUncleChain = chain.slice(4); // 去掉 [m, m, f, ob/lb] 后的关系链
      
      // 妈妈的妈妈的爸爸的哥哥：外伯曾祖父
      if (afterMomMomGreatUncleChain.length === 0 && momMomGreatUncleRel === 'ob') {
        return '外伯曾祖父';
      }
      
      // 妈妈的妈妈的爸爸的弟弟：外叔曾祖父
      if (afterMomMomGreatUncleChain.length === 0 && momMomGreatUncleRel === 'lb') {
        return '外叔曾祖父';
      }
      
      // 妈妈的妈妈的爸爸的兄弟的子女：表舅祖父/表姨祖母
      if (afterMomMomGreatUncleChain.length === 1) {
        if (afterMomMomGreatUncleChain[0] === 's') {
          return '表舅祖父';
        }
        if (afterMomMomGreatUncleChain[0] === 'd') {
          return '表姨祖母';
        }
      }
      
      // 妈妈的妈妈的爸爸的兄弟的孙子女：表舅父/表姨母
      if (afterMomMomGreatUncleChain.length === 2) {
        if (afterMomMomGreatUncleChain[0] === 's') {
          return '表舅父';
        }
        if (afterMomMomGreatUncleChain[0] === 'd') {
          return '表姨母';
        }
      }
      
      // 妈妈的妈妈的爸爸的兄弟的曾孙子女：表兄弟姐妹系列
      if (afterMomMomGreatUncleChain.length >= 3) {
        var lastGenGender = 'male';
        for (var i = afterMomMomGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterMomMomGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterMomMomGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        if (afterMomMomGreatUncleChain.length === 3) {
          return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
        }
        if (afterMomMomGreatUncleChain.length === 4) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
      }
    }
    
    // 爸爸的哥哥的妻子：伯母
    if (chain.length === 3 && chain[0] === 'f' && chain[1] === 'ob' && chain[2] === 'w') {
      return '伯母';
    }
    
    // 爸爸的弟弟的妻子：婶婶
    if (chain.length === 3 && chain[0] === 'f' && chain[1] === 'lb' && chain[2] === 'w') {
      return '婶婶';
    }
    
    // 爸爸的姐姐的丈夫：姑父
    if (chain.length === 3 && chain[0] === 'f' && chain[1] === 'os' && chain[2] === 'h') {
      return '姑父';
    }
    
    // 爸爸的妹妹的丈夫：姑父
    if (chain.length === 3 && chain[0] === 'f' && chain[1] === 'ls' && chain[2] === 'h') {
      return '姑父';
    }
    
    // 妈妈的哥哥的妻子：舅母
    if (chain.length === 3 && chain[0] === 'm' && chain[1] === 'ob' && chain[2] === 'w') {
      return '舅母';
    }
    
    // 妈妈的弟弟的妻子：舅母
    if (chain.length === 3 && chain[0] === 'm' && chain[1] === 'lb' && chain[2] === 'w') {
      return '舅母';
    }
    
    // 妈妈的姐姐的丈夫：姨父
    if (chain.length === 3 && chain[0] === 'm' && chain[1] === 'os' && chain[2] === 'h') {
      return '姨父';
    }
    
    // 妈妈的妹妹的丈夫：姨父
    if (chain.length === 3 && chain[0] === 'm' && chain[1] === 'ls' && chain[2] === 'h') {
      return '姨父';
    }
    
    // 爸爸的兄弟姐妹的儿子：堂兄弟/表兄弟
    // 爸爸的同辈兄弟（伯伯/叔叔）的儿子 = 堂兄弟
    // 爸爸的姐妹（姑妈）的儿子 = 表兄弟
    if (chain.length === 3 && chain[0] === 'f' && 
        (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 's') {
      return '堂兄';
    }
    
    if (chain.length === 3 && chain[0] === 'f' && 
        (chain[1] === 'os' || chain[1] === 'ls') && chain[2] === 's') {
      return '表兄';
    }
    
    // 爸爸的兄弟姐妹的女儿：堂姐妹/表姐妹
    if (chain.length === 3 && chain[0] === 'f' && 
        (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 'd') {
      return '堂姐';
    }
    
    if (chain.length === 3 && chain[0] === 'f' && 
        (chain[1] === 'os' || chain[1] === 'ls') && chain[2] === 'd') {
      return '表姐';
    }
    
    // 妈妈的兄弟姐妹的儿子：表兄弟
    if (chain.length === 3 && chain[0] === 'm' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls') && 
        chain[2] === 's') {
      return '表兄';
    }
    
    // 妈妈的兄弟姐妹的女儿：表姐妹
    if (chain.length === 3 && chain[0] === 'm' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls') && 
        chain[2] === 'd') {
      return '表姐';
    }
    
    // 妈妈的姐姐的儿子（姨妈的儿子）的后续处理 - 表兄弟的后代
    // 关系链：[m, os, s, ...]
    if (chain.length >= 4 && chain[0] === 'm' && chain[1] === 'os' && chain[2] === 's') {
      var afterCousinChain = chain.slice(3);
      
      // 妈妈的姐姐的儿子的妻子：表嫂
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 'w') {
        return '表嫂';
      }
      
      // 妈妈的姐姐的儿子的儿子：表侄
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 's') {
        return '表侄';
      }
      
      // 妈妈的姐姐的儿子的女儿：表侄女
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 'd') {
        return '表侄女';
      }
      
      // 妈妈的姐姐的儿子的女儿的丈夫：表侄女婿
      if (afterCousinChain.length === 2 && afterCousinChain[0] === 'd' && afterCousinChain[1] === 'h') {
        return '表侄女婿';
      }
      
      // 妈妈的姐姐的儿子的女儿的儿子：表外孙（女儿的儿子，不是女儿的丈夫的儿子）
      if (afterCousinChain.length === 2 && afterCousinChain[0] === 'd' && afterCousinChain[1] === 's') {
        return '表外孙';
      }
      
      // 妈妈的姐姐的儿子的女儿的儿子的儿子：表外曾孙
      if (afterCousinChain.length === 3 && afterCousinChain[0] === 'd' && afterCousinChain[1] === 's' && afterCousinChain[2] === 's') {
        return '表外曾孙';
      }
      
      // 妈妈的姐姐的儿子的女儿的儿子的儿子的儿子：表外玄孙
      if (afterCousinChain.length === 4 && afterCousinChain[0] === 'd' && afterCousinChain[1] === 's' && afterCousinChain[2] === 's' && afterCousinChain[3] === 's') {
        return '表外玄孙';
      }
    }
    
    // 妈妈的姐姐的女儿（姨妈的女儿）的后续处理
    // 关系链：[m, os, d, ...]
    if (chain.length >= 4 && chain[0] === 'm' && chain[1] === 'os' && chain[2] === 'd') {
      var afterCousinDChain = chain.slice(3);
      
      // 妈妈的姐姐的女儿的丈夫：表姐夫
      if (afterCousinDChain.length === 1 && afterCousinDChain[0] === 'h') {
        return '表姐夫';
      }
      
      // 妈妈的姐姐的女儿的儿子：表外孙
      if (afterCousinDChain.length === 1 && afterCousinDChain[0] === 's') {
        return '表外孙';
      }
      
      // 妈妈的姐姐的女儿的女儿：表外孙女
      if (afterCousinDChain.length === 1 && afterCousinDChain[0] === 'd') {
        return '表外孙女';
      }
      
      // 妈妈的姐姐的女儿的儿子的丈夫：表外孙女婿
      if (afterCousinDChain.length === 2 && afterCousinDChain[0] === 's' && afterCousinDChain[1] === 'h') {
        return '表外孙女婿';
      }
      
      // 妈妈的姐姐的女儿的儿子的儿子：表外曾孙
      if (afterCousinDChain.length === 3 && afterCousinDChain[0] === 's' && afterCousinDChain[1] === 'h' && afterCousinDChain[2] === 's') {
        return '表外曾孙';
      }
      
      // 妈妈的姐姐的女儿的儿子的女儿的丈夫：表外曾孙女婿
      if (afterCousinDChain.length === 4 && afterCousinDChain[0] === 's' && afterCousinDChain[1] === 'h' && afterCousinDChain[2] === 'd' && afterCousinDChain[3] === 'h') {
        return '表外曾孙女婿';
      }
      
      // 妈妈的姐姐的女儿的儿子的女儿的儿子的儿子：表外玄孙
      if (afterCousinDChain.length === 5 && afterCousinDChain[0] === 's' && afterCousinDChain[1] === 'h' && afterCousinDChain[2] === 'd' && afterCousinDChain[3] === 'h' && afterCousinDChain[4] === 's') {
        return '表外玄孙';
      }
    }
    
    // 爸爸的哥哥/弟弟的儿子的后代（堂侄系列）
    // 关系链：[f, ob/lb, s, ...]
    if (chain.length >= 4 && chain[0] === 'f' && (chain[1] === 'ob' || chain[1] === 'lb') && chain[2] === 's') {
      var afterCousinChain = chain.slice(3);
      
      // 爸爸的哥哥/弟弟的儿子的儿子：堂侄
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 's') {
        return '堂侄';
      }
      
      // 爸爸的哥哥/弟弟的儿子的女儿：堂侄女
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 'd') {
        return '堂侄女';
      }
    }
    
    // 爸爸的姐姐/妹妹的儿子的后代（表侄系列）
    // 关系链：[f, os/ls, s, ...]
    if (chain.length >= 4 && chain[0] === 'f' && (chain[1] === 'os' || chain[1] === 'ls') && chain[2] === 's') {
      var afterCousinChain = chain.slice(3);
      
      // 爸爸的姐姐/妹妹的儿子的儿子：表侄
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 's') {
        return '表侄';
      }
      
      // 爸爸的姐姐/妹妹的儿子的女儿：表侄女
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 'd') {
        return '表侄女';
      }
    }
    
    // 妈妈的兄弟姐妹的儿子的后代（表侄系列）
    // 关系链：[m, ob/lb/os/ls, s, ...]
    if (chain.length >= 4 && chain[0] === 'm' && 
        (chain[1] === 'ob' || chain[1] === 'lb' || chain[1] === 'os' || chain[1] === 'ls') && 
        chain[2] === 's') {
      var afterCousinChain = chain.slice(3);
      
      // 妈妈的兄弟姐妹的儿子的儿子：表侄
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 's') {
        return '表侄';
      }
      
      // 妈妈的兄弟姐妹的儿子的女儿：表侄女
      if (afterCousinChain.length === 1 && afterCousinChain[0] === 'd') {
        return '表侄女';
      }
    }
    
    // ========== 模式 0k：丈夫的爸爸的爸爸的兄弟（叔公祖父）及其后代 ==========
    // 关系链：[h, f, f, ob/lb, ...]
    if (chain.length >= 4 && chain[0] === 'h' && chain[1] === 'f' && chain[2] === 'f' && 
        (chain[3] === 'ob' || chain[3] === 'lb')) {
      var husbandGreatUncleRel = chain[3]; // ob/lb
      var afterHusbandGreatUncleChain = chain.slice(4); // 去掉 [h, f, f, ob/lb] 后的关系链
      
      // 丈夫的爸爸的爸爸的哥哥：伯公祖父
      if (afterHusbandGreatUncleChain.length === 0 && husbandGreatUncleRel === 'ob') {
        return '伯公祖父';
      }
      
      // 丈夫的爸爸的爸爸的弟弟：叔公祖父
      if (afterHusbandGreatUncleChain.length === 0 && husbandGreatUncleRel === 'lb') {
        return '叔公祖父';
      }
      
      // 丈夫的爸爸的爸爸的兄弟的妻子：伯公祖母/叔公祖母
      if (afterHusbandGreatUncleChain.length === 1 && afterHusbandGreatUncleChain[0] === 'w') {
        return husbandGreatUncleRel === 'ob' ? '伯公祖母' : '叔公祖母';
      }
      
      // 丈夫的爸爸的爸爸的兄弟的子女：堂伯公父/堂叔公父/堂姑母
      if (afterHusbandGreatUncleChain.length === 1) {
        if (afterHusbandGreatUncleChain[0] === 's') {
          return husbandGreatUncleRel === 'ob' ? '堂伯公父' : '堂叔公父';
        }
        if (afterHusbandGreatUncleChain[0] === 'd') {
          return '堂姑母';
        }
      }
      
      // 丈夫的爸爸的爸爸的兄弟的子女的配偶
      if (afterHusbandGreatUncleChain.length === 2) {
        if (afterHusbandGreatUncleChain[0] === 's' && afterHusbandGreatUncleChain[1] === 'w') {
          return husbandGreatUncleRel === 'ob' ? '堂伯公母' : '堂叔公母';
        }
        if (afterHusbandGreatUncleChain[0] === 'd' && afterHusbandGreatUncleChain[1] === 'h') {
          return '堂姑父';
        }
      }
      
      // 丈夫的爸爸的爸爸的兄弟的子女的后代（堂兄弟姐妹/表兄弟姐妹系列）
      if (afterHusbandGreatUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterHusbandGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterHusbandGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterHusbandGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 儿子的子女 = 堂兄弟姐妹
        if (afterHusbandGreatUncleChain[0] === 's') {
          if (afterHusbandGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? '堂兄弟' : '堂姐妹';
          }
          if (afterHusbandGreatUncleChain.length === 3) {
            if (afterHusbandGreatUncleChain[1] === 's' && afterHusbandGreatUncleChain[2] === 'w') {
              return '堂兄弟媳';
            }
            if (afterHusbandGreatUncleChain[1] === 'd' && afterHusbandGreatUncleChain[2] === 'h') {
              return '堂姐妹夫';
            }
            return lastGenGender === 'male' ? '堂侄' : '堂侄女';
          }
          if (afterHusbandGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? '堂侄孙' : '堂侄孙女';
          }
        }
        
        // 女儿的子女 = 表兄弟姐妹
        if (afterHusbandGreatUncleChain[0] === 'd') {
          if (afterHusbandGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
          }
          if (afterHusbandGreatUncleChain.length === 3) {
            if (afterHusbandGreatUncleChain[1] === 's' && afterHusbandGreatUncleChain[2] === 'w') {
              return '表兄弟媳';
            }
            if (afterHusbandGreatUncleChain[1] === 'd' && afterHusbandGreatUncleChain[2] === 'h') {
              return '表姐妹夫';
            }
            return lastGenGender === 'male' ? '表侄' : '表侄女';
          }
          if (afterHusbandGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
          }
        }
      }
    }
    
    // ========== 模式 0k-2：妻子的爸爸的爸爸的兄弟姐妹（姑祖母/叔祖父）及其后代 ==========
    // 关系链：[w, f, f, ob/lb/os/ls, ...]
    if (chain.length >= 4 && chain[0] === 'w' && chain[1] === 'f' && chain[2] === 'f' &&
        (chain[3] === 'ob' || chain[3] === 'lb' || chain[3] === 'os' || chain[3] === 'ls')) {
      var wifeGreatUncleRel = chain[3];
      var afterWifeGreatUncleChain = chain.slice(4);
      
      // 妻子的爸爸的爸爸的哥哥：伯祖父
      if (afterWifeGreatUncleChain.length === 0 && wifeGreatUncleRel === 'ob') {
        return '伯祖父';
      }
      
      // 妻子的爸爸的爸爸的弟弟：叔祖父
      if (afterWifeGreatUncleChain.length === 0 && wifeGreatUncleRel === 'lb') {
        return '叔祖父';
      }
      
      // 妻子的爸爸的爸爸的姐姐：姑祖母
      if (afterWifeGreatUncleChain.length === 0 && wifeGreatUncleRel === 'os') {
        return '姑祖母';
      }
      
      // 妻子的爸爸的爸爸的妹妹：姑祖母
      if (afterWifeGreatUncleChain.length === 0 && wifeGreatUncleRel === 'ls') {
        return '姑祖母';
      }
      
      // 妻子的爸爸的爸爸的姐妹的丈夫：姑祖父
      if (afterWifeGreatUncleChain.length === 1 && afterWifeGreatUncleChain[0] === 'h') {
        return '姑祖父';
      }
      
      // 妻子的爸爸的爸爸的兄弟姐妹的子女：堂伯叔父/堂姑母/表伯叔父/表姑母
      if (afterWifeGreatUncleChain.length === 1) {
        if (afterWifeGreatUncleChain[0] === 's') {
          // 兄弟的儿子：堂伯叔父（爸爸的爸爸的兄弟的孙子=堂亲）
          if (wifeGreatUncleRel === 'ob' || wifeGreatUncleRel === 'lb') {
            return '堂伯叔父';
          }
          // 姐妹的儿子：表伯叔父（爸爸的爸爸的姐妹的孙子=表亲）
          return '表伯叔父';
        }
        if (afterWifeGreatUncleChain[0] === 'd') {
          // 兄弟的女儿：堂姑母
          if (wifeGreatUncleRel === 'ob' || wifeGreatUncleRel === 'lb') {
            return '堂姑母';
          }
          // 姐妹的女儿：表姑母
          return '表姑母';
        }
      }
      
      // 妻子的爸爸的爸爸的兄弟姐妹的子女的配偶
      if (afterWifeGreatUncleChain.length === 2) {
        if (afterWifeGreatUncleChain[0] === 's' && afterWifeGreatUncleChain[1] === 'w') {
          if (wifeGreatUncleRel === 'ob' || wifeGreatUncleRel === 'lb') {
            return '堂伯叔母';
          }
          return '表伯叔母';
        }
        if (afterWifeGreatUncleChain[0] === 'd' && afterWifeGreatUncleChain[1] === 'h') {
          if (wifeGreatUncleRel === 'ob' || wifeGreatUncleRel === 'lb') {
            return '堂姑父';
          }
          return '表姑父';
        }
      }
      
      // 妻子的爸爸的爸爸的兄弟姐妹的子女的后代（堂兄弟姐妹/表兄弟姐妹系列）
      if (afterWifeGreatUncleChain.length >= 2) {
        var lastGenGender = 'male';
        for (var i = afterWifeGreatUncleChain.length - 1; i >= 0; i--) {
          if (afterWifeGreatUncleChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterWifeGreatUncleChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        var isTangQin = (wifeGreatUncleRel === 'ob' || wifeGreatUncleRel === 'lb');
        var qinPrefix = isTangQin ? '堂' : '表';
        
        // 儿子的子女
        if (afterWifeGreatUncleChain[0] === 's') {
          if (afterWifeGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? (qinPrefix + '兄弟') : (qinPrefix + '姐妹');
          }
          if (afterWifeGreatUncleChain.length === 3) {
            if (afterWifeGreatUncleChain[1] === 's' && afterWifeGreatUncleChain[2] === 'w') {
              return qinPrefix + '兄弟媳';
            }
            if (afterWifeGreatUncleChain[1] === 'd' && afterWifeGreatUncleChain[2] === 'h') {
              return qinPrefix + '姐妹夫';
            }
            return lastGenGender === 'male' ? (qinPrefix + '侄') : (qinPrefix + '侄女');
          }
          if (afterWifeGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? (qinPrefix + '侄孙') : (qinPrefix + '侄孙女');
          }
        }
        
        // 女儿的子女
        if (afterWifeGreatUncleChain[0] === 'd') {
          if (afterWifeGreatUncleChain.length === 2) {
            return lastGenGender === 'male' ? (qinPrefix + '兄弟') : (qinPrefix + '姐妹');
          }
          if (afterWifeGreatUncleChain.length === 3) {
            if (afterWifeGreatUncleChain[1] === 's' && afterWifeGreatUncleChain[2] === 'w') {
              return qinPrefix + '兄弟媳';
            }
            if (afterWifeGreatUncleChain[1] === 'd' && afterWifeGreatUncleChain[2] === 'h') {
              return qinPrefix + '姐妹夫';
            }
            return lastGenGender === 'male' ? (qinPrefix + '侄') : (qinPrefix + '侄女');
          }
          if (afterWifeGreatUncleChain.length === 4) {
            return lastGenGender === 'male' ? (qinPrefix + '侄孙') : (qinPrefix + '侄孙女');
          }
        }
      }
    }
    
    // ========== 模式 0k-3：丈夫的爸爸的妈妈的兄弟（外伯祖父/外叔祖父）及其后代 ==========
    // 关系链：[h, f, m, ob/lb, ...]
    if (chain.length >= 4 && chain[0] === 'h' && chain[1] === 'f' && chain[2] === 'm' &&
        (chain[3] === 'ob' || chain[3] === 'lb')) {
      var husbandFmSibRel = chain[3]; // ob/lb
      var afterHusbandFmSibChain = chain.slice(4); // 去掉 [h, f, m, ob/lb] 后的关系链
      
      // 丈夫的爸爸的妈妈的哥哥：外伯祖父
      if (afterHusbandFmSibChain.length === 0 && husbandFmSibRel === 'ob') {
        return '外伯祖父';
      }
      
      // 丈夫的爸爸的妈妈的弟弟：外叔祖父
      if (afterHusbandFmSibChain.length === 0 && husbandFmSibRel === 'lb') {
        return '外叔祖父';
      }
      
      // 丈夫的爸爸的妈妈的哥哥的妻子：外伯祖母
      if (afterHusbandFmSibChain.length === 1 && husbandFmSibRel === 'ob' && afterHusbandFmSibChain[0] === 'w') {
        return '外伯祖母';
      }
      
      // 丈夫的爸爸的妈妈的弟弟的妻子：外叔祖母
      if (afterHusbandFmSibChain.length === 1 && husbandFmSibRel === 'lb' && afterHusbandFmSibChain[0] === 'w') {
        return '外叔祖母';
      }
      
      // 丈夫的爸爸的妈妈的兄弟的儿子：表伯叔父
      if (afterHusbandFmSibChain.length === 1 && afterHusbandFmSibChain[0] === 's') {
        return '表伯叔父';
      }
      
      // 丈夫的爸爸的妈妈的兄弟的儿子的妻子：表伯叔母
      if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 'w') {
        return '表伯叔母';
      }
      
      // 丈夫的爸爸的妈妈的兄弟的子女的后代（表兄弟姐妹系列）
      if (afterHusbandFmSibChain.length >= 1 && (afterHusbandFmSibChain[0] === 's' || afterHusbandFmSibChain[0] === 'd')) {
        var lastGenGender = 'male';
        for (var i = afterHusbandFmSibChain.length - 1; i >= 0; i--) {
          if (afterHusbandFmSibChain[i] === 's') { lastGenGender = 'male'; break; }
          else if (afterHusbandFmSibChain[i] === 'd') { lastGenGender = 'female'; break; }
        }
        
        // 表姑父：丈夫的爸爸的妈妈的兄弟的女儿的丈夫 [h,f,m,ob/lb,d,h]
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 'd' && afterHusbandFmSibChain[1] === 'h') {
          return '表姑父';
        }
        
        // 表姑母：丈夫的爸爸的妈妈的兄弟的女儿 [h,f,m,ob/lb,d]
        if (afterHusbandFmSibChain.length === 1 && afterHusbandFmSibChain[0] === 'd') {
          return '表姑母';
        }
        
        // 表伯叔父：丈夫的爸爸的妈妈的兄弟的儿子 [h,f,m,ob/lb,s]
        if (afterHusbandFmSibChain.length === 1 && afterHusbandFmSibChain[0] === 's') {
          return '表伯叔父';
        }
        
        // 表伯叔母：丈夫的爸爸的妈妈的兄弟的儿子的妻子 [h,f,m,ob/lb,s,w]
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 'w') {
          return '表伯叔母';
        }
        
        // 女儿的子女：[d, s] 表兄弟，[d, d] 表姐妹
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 'd' && afterHusbandFmSibChain[1] === 's') {
          return '表兄弟';
        }
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 'd' && afterHusbandFmSibChain[1] === 'd') {
          return '表姐妹';
        }
        
        // 女儿的子女的配偶：[d, s, w] 表兄弟媳，[d, d, h] 表姐妹夫
        if (afterHusbandFmSibChain.length === 3 && afterHusbandFmSibChain[0] === 'd' && afterHusbandFmSibChain[1] === 's' && afterHusbandFmSibChain[2] === 'w') {
          return '表兄弟媳';
        }
        if (afterHusbandFmSibChain.length === 3 && afterHusbandFmSibChain[0] === 'd' && afterHusbandFmSibChain[1] === 'd' && afterHusbandFmSibChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 儿子的子女：[s, s] 表兄弟，[s, d] 表姐妹
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 's') {
          return '表兄弟';
        }
        if (afterHusbandFmSibChain.length === 2 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 'd') {
          return '表姐妹';
        }
        
        // 儿子的子女的配偶：[s, s, w] 表兄弟媳，[s, d, h] 表姐妹夫
        if (afterHusbandFmSibChain.length === 3 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 's' && afterHusbandFmSibChain[2] === 'w') {
          return '表兄弟媳';
        }
        if (afterHusbandFmSibChain.length === 3 && afterHusbandFmSibChain[0] === 's' && afterHusbandFmSibChain[1] === 'd' && afterHusbandFmSibChain[2] === 'h') {
          return '表姐妹夫';
        }
        
        // 表侄/表侄女（向下 1 代）
        if (afterHusbandFmSibChain.length === 3 && afterHusbandFmSibChain[0] === 's' && (afterHusbandFmSibChain[1] === 's' || afterHusbandFmSibChain[1] === 'd')) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        }
        
        // 表侄孙/表侄孙女（向下 2 代）
        if (afterHusbandFmSibChain.length === 4) {
          return lastGenGender === 'male' ? '表侄孙' : '表侄孙女';
        }
      }
    }
    
    // ========== 模式 0h-4：爸爸的兄弟的子女的后代（堂亲系列） ==========
    // 关系链：[f, ob/lb, s/d, ...]
    if (chain.length >= 4 && chain[0] === 'f' && 
        (chain[1] === 'ob' || chain[1] === 'lb')) {
      var dadSibRel = chain[1]; // ob/lb
      var afterDadSibChildChain = chain.slice(2); // 去掉 [f, ob/lb] 后的关系链
      
      // 爸爸的兄弟的儿子的妻子：堂兄弟媳
      if (afterDadSibChildChain.length === 2 && afterDadSibChildChain[0] === 's' && afterDadSibChildChain[1] === 'w') {
        return '堂兄弟媳';
      }
      
      // 爸爸的兄弟的儿子的子女：堂侄/堂侄女
      if (afterDadSibChildChain.length === 2 && afterDadSibChildChain[0] === 's') {
        var childGender = afterDadSibChildChain[1];
        if (childGender === 's') return '堂侄';
        if (childGender === 'd') return '堂侄女';
      }
      
      // 爸爸的兄弟的儿子的女儿的丈夫：堂侄女婿
      if (afterDadSibChildChain.length === 3 && afterDadSibChildChain[0] === 's' && 
          afterDadSibChildChain[1] === 'd' && afterDadSibChildChain[2] === 'h') {
        return '堂侄女婿';
      }
      
      // 爸爸的兄弟的女儿的丈夫：堂姐妹夫
      if (afterDadSibChildChain.length === 2 && afterDadSibChildChain[0] === 'd' && afterDadSibChildChain[1] === 'h') {
        return '堂姐妹夫';
      }
      
      // 爸爸的兄弟的女儿的子女：堂外甥/堂外甥女
      if (afterDadSibChildChain.length === 2 && afterDadSibChildChain[0] === 'd') {
        var childGender = afterDadSibChildChain[1];
        if (childGender === 's') return '堂外甥';
        if (childGender === 'd') return '堂外甥女';
      }
      
      // 爸爸的兄弟的女儿的子女的配偶：堂外甥媳/堂外甥女婿
      if (afterDadSibChildChain.length === 3 && afterDadSibChildChain[0] === 'd') {
        if (afterDadSibChildChain[1] === 's' && afterDadSibChildChain[2] === 'w') {
          return '堂外甥媳';
        }
        if (afterDadSibChildChain[1] === 'd' && afterDadSibChildChain[2] === 'h') {
          return '堂外甥女婿';
        }
      }
    }


    // ========== 模式 1：纯向上祖先 ==========
    if (sisterIndex < 0 && spouseIndex < 0 && genDown === 0) {
      if (genUp === 1) return (lastGender === 'male') ? '爸爸' : '妈妈';
      if (genUp === 2) return (lastGender === 'male') ? '爷爷' : '奶奶';
      if (genUp >= 3 && genUp <= 8) {
        var prefix = genPrefixFull[genUp] || '远祖';
        var externalPrefix = (genUp >= 6 && maternalCount >= 2) ? '外' : '';
        return externalPrefix + prefix + (lastGender === 'male' ? '父' : '母');
      }
      return '远祖' + (lastGender === 'male' ? '父' : '母');
    }
    
    // ========== 模式 2：姻系列（有姐妹的配偶，且配偶后有其他关系） ==========
    // 排除：妻子的姐妹的丈夫的子女（由模式 0f 处理）
    var isWifeSisterSpouseChild = (chain.length >= 4 && chain[0] === 'w' && 
        (chain[1] === 'os' || chain[1] === 'ls') && chain[2] === 'h' && 
        (chain[3] === 's' || chain[3] === 'd'));
    if (hasSibSpouse && spouseHasAfter && !isWifeSisterSpouseChild) {
      var genBeforeSister = 0;
      for (var i = 0; i < sisterIndex; i++) {
        if (chain[i] === 'f' || chain[i] === 'm') genBeforeSister++;
      }
      
      var afterChain = chain.slice(spouseIndex + 1);
      
      // 计算配偶后的祖先代数
      var genAfterSpouse = 0;
      for (var i = 0; i < afterChain.length; i++) {
        if (afterChain[i] === 'f' || afterChain[i] === 'm') genAfterSpouse++;
      }
      var totalGen = genBeforeSister + genAfterSpouse;
      
      // 判断最后一代性别
      var afterLastGender = 'male';
      for (var i = afterChain.length - 1; i >= 0; i--) {
        var rel = afterChain[i];
        if (rel === 'f' || rel === 'ob' || rel === 'lb' || rel === 's' || rel === 'h') {
          afterLastGender = 'male'; break;
        } else if (rel === 'm' || rel === 'os' || rel === 'ls' || rel === 'd' || rel === 'w') {
          afterLastGender = 'female'; break;
        }
      }
      
      var hasSpouseChild = (afterChain.indexOf('s') >= 0 || afterChain.indexOf('d') >= 0);
      var hasSpouseParent = (afterChain.indexOf('f') >= 0 || afterChain.indexOf('m') >= 0);
      var hasSpouseSibling = false;
      for (var i = 0; i < afterChain.length; i++) {
        if (afterChain[i] === 'ob' || afterChain[i] === 'lb' || afterChain[i] === 'os' || afterChain[i] === 'ls') {
          hasSpouseSibling = true; break;
        }
      }
      
      if (hasSpouseChild) {
        // 修复 v711-69-3: 子女的称谓前缀比兄弟姐妹低一代，使用 totalGen - 1
        // 例如：爸爸的妈妈的爸爸的妈妈的妹妹的丈夫的姐姐的儿子（totalGen=4）
        // 应该返回'姻曾祖父'（曾祖=索引 3=4-1），而非'姻高伯叔祖父'（高祖=索引 4）
        var lastChild = null;
        for (var i = afterChain.length - 1; i >= 0; i--) {
          if (afterChain[i] === 's') { lastChild = 'son'; break; }
          else if (afterChain[i] === 'd') { lastChild = 'daughter'; break; }
        }
        // 子女情况：使用'父'/'母'后缀，前缀索引为 totalGen - 1
        var basePrefix = genPrefixFull[totalGen - 1] || '远祖';
        if (lastChild === 'son') return '姻' + basePrefix + '父';
        if (lastChild === 'daughter') return '姻' + basePrefix + '母';
      }
      
      if (hasSpouseParent) {
        var basePrefix = genPrefixFull[totalGen] || '烈祖';
        return '姻' + basePrefix + (afterLastGender === 'male' ? '父' : '母');
      }
      
      if (hasSpouseSibling) {
        // 修复 v711-69: 根据 totalGen 计算前缀，不要硬编码'姻高天祖'
        // 例如：爸爸的爸爸的妈妈的爸爸的妈妈的妹妹的丈夫的姐姐
        // totalGen = 4 (爸爸→爸爸→妈妈→爸爸)，应该返回'姻高祖父'而非'姻高天祖父'
        var basePrefix = genPrefixFull[totalGen] || '远祖';
        return '姻' + basePrefix + (afterLastGender === 'male' ? '父' : '母');
      }
    }
    
    // ========== 模式 3：姨/舅系列（有姐妹，无向下，或姐妹的配偶但配偶后无其他关系） ==========
    // 修复：排除姐妹前面有'w'的情况（那是妻子的姐妹，属于姻亲系列）
    // 修复 v711-51-fix-v57: 排除丈夫的妈妈的亲属（chain[0]='h'且 chain[1]='m'，由模式 0g-3 处理）
    if (sisterIndex >= 0 && genDown === 0 && (sisterIndex === 0 || chain[sisterIndex - 1] !== 'w')) {
      // 排除女性视角看丈夫方亲属的情况（由模式 0g-3 处理）
      if (chain.length >= 2 && chain[0] === 'h' && chain[1] === 'm') {
        // 让模式 0g-3 处理，不在此返回
      } else {
      var genBeforeSister = 0;
      for (var i = 0; i < sisterIndex; i++) {
        if (chain[i] === 'f' || chain[i] === 'm') genBeforeSister++;
      }
      
      var isSister = (chain[sisterIndex] === 'os' || chain[sisterIndex] === 'ls');
      var sibParentIsMother = (sisterIndex > 0 && chain[sisterIndex - 1] === 'm');
      
      var afterSisterChain = chain.slice(sisterIndex + 1);
      var afterAncestors = [];
      for (var i = 0; i < afterSisterChain.length; i++) {
        if (afterSisterChain[i] === 'f' || afterSisterChain[i] === 'm') {
          afterAncestors.push(afterSisterChain[i]);
        }
      }
      
      var afterLastGender;
      if (afterAncestors.length > 0) {
        afterLastGender = (afterAncestors[afterAncestors.length - 1] === 'f') ? 'male' : 'female';
      } else if (hasSibSpouse && spouseIndex >= 0) {
        afterLastGender = 'male';
      } else {
        afterLastGender = isSister ? 'female' : 'male';
      }
      
      var basePrefix = genPrefixSingle[genBeforeSister] || '远';
      
      if (isSister && sibParentIsMother) {
        return basePrefix + '姨' + (afterLastGender === 'male' ? '祖父' : '祖母');
      } else if (isSister) {
        return basePrefix + '姑' + (afterLastGender === 'male' ? '祖父' : '祖母');
      }
      }
    }
    
    // ========== 模式 4：表系列（有姐妹，有向下） ==========
    // 修复 v711-51-fix-v10: 排除配偶在姐妹之前的情况（那是姻亲系列）
    // 条件：配偶不在姐妹之前（spouseIndex < 0 或 spouseIndex > sisterIndex）
    // 修复 v711-51-fix-v24: 排除姐妹前面有'w'的情况（那是妻子的姐妹，属于姻亲系列）
    if (sisterIndex >= 0 && genDown > 0 && (spouseIndex < 0 || spouseIndex > sisterIndex) && (sisterIndex === 0 || chain[sisterIndex - 1] !== 'w')) {
      var genBeforeSister = 0;
      for (var i = 0; i < sisterIndex; i++) {
        if (chain[i] === 'f' || chain[i] === 'm') genBeforeSister++;
      }
      
      var isSister = (chain[sisterIndex] === 'os' || chain[sisterIndex] === 'ls');
      var sibParentIsMother = (sisterIndex > 0 && chain[sisterIndex - 1] === 'm');
      
      // 修复 v711-69: 判断父系/母系应该看关系链的第一个祖先，而非姐妹的直接上级
      // 爸爸的姐妹的后代 = 表侄（父系），妈妈的姐妹的后代 = 表外甥（母系）
      var isPaternal = false; // 父系
      var isMaternal = false; // 母系
      for (var i = 0; i < sisterIndex; i++) {
        if (chain[i] === 'f') { isPaternal = true; break; }
        if (chain[i] === 'm') { isMaternal = true; break; }
      }
      
      // 修复 v711-69: 判断表亲性别（表兄弟 vs 表姐妹）决定用"侄"还是"外甥"
      // 表兄弟的子女 = 表侄，表姐妹的子女 = 表外甥
      // 方法：平辈表亲的位置 = 从姐妹关系开始向下 genBeforeSister 代
      var cousinIsMale = true; // 默认表兄弟
      var cousinIdx = sisterIndex + genBeforeSister; // 平辈表亲在 chain 中的索引
      if (cousinIdx < chain.length && cousinIdx > sisterIndex) {
        var relationToCousin = chain[cousinIdx];
        if (relationToCousin === 's') cousinIsMale = true; // 表兄弟
        else if (relationToCousin === 'd') cousinIsMale = false; // 表姐妹
      } else if (cousinIdx >= chain.length) {
        // cousinIdx 超出范围，说明表亲是姐妹的子女（如 ls 的子女）
        // 看姐妹后的第一个关系决定表亲性别
        if (sisterIndex + 1 < chain.length) {
          var firstAfterSister = chain[sisterIndex + 1];
          if (firstAfterSister === 's') cousinIsMale = true; // 姐妹的儿子 = 表兄弟
          else if (firstAfterSister === 'd') cousinIsMale = false; // 姐妹的女儿 = 表姐妹
        }
      }
      
      var afterChain = chain.slice(sisterIndex + 1);
      
      // 计算向下代数
      var genDownAfterSister = 0;
      for (var i = 0; i < afterChain.length; i++) {
        if (afterChain[i] === 's' || afterChain[i] === 'd') genDownAfterSister++;
      }
      
      // 找到最后一代的类型和性别
      var lastGenType = null;
      var lastGenGender = 'male';
      for (var i = afterChain.length - 1; i >= 0; i--) {
        if (afterChain[i] === 's') { lastGenType = 'son'; lastGenGender = 'male'; break; }
        else if (afterChain[i] === 'd') { lastGenType = 'daughter'; lastGenGender = 'female'; break; }
        else if (afterChain[i] === 'h') { lastGenType = 'spouse'; lastGenGender = 'male'; break; }
      }
      
      // 表系列的辈分 = netGen
      var netGen = genUp - genDown;
      var basePrefix = (netGen >= 0 && netGen < genPrefixFull.length) ? genPrefixFull[netGen] : '高祖';
      
      // 修复 v711-69: 使用 netGen 作为主要判断依据（而非 genDownAfterSister）
      // 平辈（netGen = 0）：表兄弟/表姐妹
      if (netGen === 0) {
        return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
      }
      
      // 向上辈分（netGen > 0）：表伯叔/表姑姨系列
      if (netGen > 0) {
        if (netGen === 1) {
          // 向上 1 代：根据目标人性别和表亲性别决定
          // 表兄弟的儿子 = 表伯叔，表兄弟的女儿 = 表姑
          // 表姐妹的儿子 = 表舅，表姐妹的女儿 = 表姨
          if (isMaternal) {
            // 母系：表姐妹的儿子 = 表舅，表姐妹的女儿 = 表姨
            // 表兄弟的儿子 = 表舅，表兄弟的女儿 = 表姨
            return lastGenGender === 'male' ? '表舅' : '表姨';
          } else {
            // 父系：表兄弟的儿子 = 表伯叔，表兄弟的女儿 = 表姑
            // 表姐妹的儿子 = 表伯叔，表姐妹的女儿 = 表姑
            return lastGenGender === 'male' ? '表伯叔' : '表姑';
          }
        } else if (netGen === 2) {
          // 向上 2 代：表伯叔祖父/表姑祖母
          var auntUnclePrefix = cousinIsMale ? '表伯叔' : '表姑';
          return auntUnclePrefix + (lastGenGender === 'male' ? '祖父' : '祖母');
        } else if (netGen >= 3) {
          // 向上 3 代及以上：表 + 辈分 + 祖父/母
          if (basePrefix.indexOf('祖') >= 0) {
            return '表' + basePrefix + (lastGenGender === 'male' ? '父' : '母');
          } else {
            return '表' + basePrefix + (lastGenGender === 'male' ? '祖父' : '祖母');
          }
        }
      }
      
      // 平辈（netGen = 0）：表兄弟/表姐妹
      if (netGen === 0) {
        return lastGenGender === 'male' ? '表兄弟' : '表姐妹';
      }
      
      // 向下 1 代（netGen = -1）：表侄/表外甥
      if (netGen === -1) {
        // 表兄弟的子女 = 表侄，表姐妹的子女 = 表外甥
        if (cousinIsMale) {
          return lastGenGender === 'male' ? '表侄' : '表侄女';
        } else {
          return lastGenGender === 'male' ? '表外甥' : '表外甥女';
        }
      }
      
      // 向下 2 代及以上（netGen <= -2）：表侄孙/表外甥孙
      if (netGen <= -2) {
        var downGen = -netGen; // 向下代数
        var downPrefix = ['', '', '孙', '曾', '玄', '来', '昆', '仍', '云'];
        var prefix = (downGen >= 2 && downPrefix.length > downGen) ? downPrefix[downGen] : '远';
        if (cousinIsMale) {
          return '表侄' + prefix + (lastGenGender === 'male' ? '' : '女');
        } else {
          return '表外甥' + prefix + (lastGenGender === 'male' ? '' : '女');
        }
      }
    }
    
    // ========== 模式 5：纯向下后代（安瑞国视角等） ==========
    // 关系链只有 s/d，无 f/m/os/ls/h/w
    console.log('[模式 5 检查] chain:', chain, 'genUp:', genUp, 'genDown:', genDown, 'sisterIndex:', sisterIndex, 'spouseIndex:', spouseIndex);
    if (genUp === 0 && genDown > 0 && sisterIndex < 0 && spouseIndex < 0) {
      console.log('[模式 5 匹配] 纯向下后代，genDown =', genDown);
      // 辈分称谓（向下）
      var genDownPrefix = ['', '', '孙', '曾', '玄', '来', '昆', '仍', '云'];
      var prefix = genDownPrefix[genDown] || '远';
      
      // 判断最后一代性别
      var lastGenGender = 'male';
      for (var i = chain.length - 1; i >= 0; i--) {
        if (chain[i] === 's') { lastGenGender = 'male'; break; }
        else if (chain[i] === 'd') { lastGenGender = 'female'; break; }
      }
      
      // 判断是否有女儿路径（外系）
      var hasDaughterPath = (chain.indexOf('d') >= 0);
      
      if (genDown === 1) {
        return lastGenGender === 'male' ? '儿子' : '女儿';
      } else if (genDown === 2) {
        if (hasDaughterPath) {
          return lastGenGender === 'male' ? '外孙' : '外孙女';
        } else {
          return lastGenGender === 'male' ? '孙子' : '孙女';
        }
      } else if (genDown >= 3) {
        if (hasDaughterPath) {
          return '外' + prefix + (lastGenGender === 'male' ? '孙' : '孙女');
        } else {
          return prefix + (lastGenGender === 'male' ? '孙' : '孙女');
        }
      }
    }
    
    // ========== 模式 6：向下后代 + 配偶（孙媳/孙女婿等） ==========
    // 关系链：s/d + ... + h/w（最后是配偶）
    var lastIsSpouse = (chain[chain.length - 1] === 'h' || chain[chain.length - 1] === 'w');
    if (lastIsSpouse && genUp === 0) {
      // 去掉最后的配偶，计算前面的后代关系
      var beforeSpouseChain = chain.slice(0, chain.length - 1);
      var genDownBefore = 0;
      for (var i = 0; i < beforeSpouseChain.length; i++) {
        if (beforeSpouseChain[i] === 's' || beforeSpouseChain[i] === 'd') genDownBefore++;
      }
      
      // 判断是否有女儿路径
      var hasDaughterPath = (beforeSpouseChain.indexOf('d') >= 0);
      
      // 判断配偶性别
      var spouseGender = (chain[chain.length - 1] === 'h') ? 'male' : 'female';
      
      var genDownPrefix = ['', '', '孙', '曾', '玄', '来', '昆', '仍', '云'];
      var prefix = genDownPrefix[genDownBefore] || '远';
      
      if (genDownBefore === 1) {
        // 子女的配偶
        if (hasDaughterPath) {
          return spouseGender === 'male' ? '女婿' : '儿媳';
        } else {
          return spouseGender === 'male' ? '女婿' : '儿媳';
        }
      } else if (genDownBefore === 2) {
        // 孙子女的配偶
        if (hasDaughterPath) {
          return '外孙' + (spouseGender === 'male' ? '女婿' : '媳');
        } else {
          return '孙' + (spouseGender === 'male' ? '女婿' : '媳');
        }
      } else if (genDownBefore >= 3) {
        // 曾孙及以上的配偶
        if (hasDaughterPath) {
          return '外' + prefix + (spouseGender === 'male' ? '孙女婿' : '孙媳');
        } else {
          return prefix + (spouseGender === 'male' ? '孙女婿' : '孙媳');
        }
      }
    }
    
    // ========== 模式 7：向下后代 + 姻亲系列（姻孙/姻曾孙等） ==========
    // 关系链：s/d + ... + w + os/ls + ...（子女的配偶的姐妹及其后代）
    var hasChildSpouseSib = false;
    var childSpouseSibIndex = -1;
    for (var i = 0; i < chain.length - 1; i++) {
      if ((chain[i] === 'w' || chain[i] === 'h') && i < chain.length - 1) {
        var nextRel = chain[i + 1];
        if (nextRel === 'os' || nextRel === 'ls' || nextRel === 'ob' || nextRel === 'lb') {
          hasChildSpouseSib = true;
          childSpouseSibIndex = i + 1;
          break;
        }
      }
    }
    
    if (hasChildSpouseSib && genUp === 0) {
      console.log('[模式 7 匹配] 姻亲系列，chain =', chain, 'childSpouseSibIndex =', childSpouseSibIndex);
      // 计算配偶前的向下代数
      var genBeforeSpouse = 0;
      for (var i = 0; i < childSpouseSibIndex; i++) {
        if (chain[i] === 's' || chain[i] === 'd') genBeforeSpouse++;
      }
      console.log('[模式 7] genBeforeSpouse =', genBeforeSpouse);
      
      // 判断是否有女儿路径
      var hasDaughterPath = false;
      for (var i = 0; i < childSpouseSibIndex; i++) {
        if (chain[i] === 'd') { hasDaughterPath = true; break; }
      }
      
      // 计算姐妹后的关系
      var afterSibChain = chain.slice(childSpouseSibIndex + 1);
      console.log('[模式 7] afterSibChain =', afterSibChain);
      
      // 修复 v711-51-fix-v10: os/ls 的 s/d 是平辈的子女，不计入代数
      // 只有 os/ls 之后的 os/ls/s/d 才计入代数（外甥孙等）
      var genAfterSib = 0;
      for (var i = 0; i < afterSibChain.length; i++) {
        // 跳过第一个 s/d（那是外甥/外甥女，平辈）
        if (i === 0 && (afterSibChain[i] === 's' || afterSibChain[i] === 'd')) {
          console.log('[模式 7] 跳过外甥/外甥女，不计入代数');
          continue;
        }
        if (afterSibChain[i] === 's' || afterSibChain[i] === 'd') genAfterSib++;
        else if (afterSibChain[i] === 'f' || afterSibChain[i] === 'm') genAfterSib++;
      }
      console.log('[模式 7] genAfterSib =', genAfterSib);
      
      // 判断最后一代性别
      var lastGenGender = 'male';
      for (var i = chain.length - 1; i >= 0; i--) {
        if (chain[i] === 's' || chain[i] === 'ob' || chain[i] === 'lb' || chain[i] === 'h') {
          lastGenGender = 'male'; break;
        } else if (chain[i] === 'd' || chain[i] === 'os' || chain[i] === 'ls' || chain[i] === 'w') {
          lastGenGender = 'female'; break;
        }
      }
      
      // 总代数 = 配偶前代数 + 姐妹后代数
      var totalGen = genBeforeSpouse + genAfterSib;
      console.log('[模式 7] totalGen =', totalGen);
      var genDownPrefix = ['', '', '孙', '曾', '玄', '来', '昆', '仍', '云'];
      var prefix = genDownPrefix[totalGen] || '远';
      
      // 判断是否是配偶（最后是 h/w）
      var lastIsSpouse = (chain[chain.length - 1] === 'h' || chain[chain.length - 1] === 'w');
      
      if (lastIsSpouse) {
        // 姻孙女婿/姻孙媳等
        return '姻' + prefix + (lastGenGender === 'male' ? '孙女婿' : '孙媳');
      } else {
        // 姻孙/姻曾孙等
        return '姻' + prefix + (lastGenGender === 'male' ? '孙' : '孙女');
      }
    }
    
    // ========== 模式 8：孙子的妻子的姐妹/兄弟及其后代（姻孙/姻孙女等） ==========
    // 关系链：s + s + w + os/ls/ob/lb + ...（孙子的配偶的姐妹及其后代）
    // 例如：安爷爷→安瑞国 (s)→安文杰 (s)→付芊雨 (w)→付群芳 (os) = 姻孙女
    var hasGrandchildSpouseSib = false;
    var grandchildSpouseSibIndex = -1;
    for (var i = 0; i < chain.length - 1; i++) {
      if ((chain[i] === 'w' || chain[i] === 'h') && i < chain.length - 1) {
        var nextRel = chain[i + 1];
        if (nextRel === 'os' || nextRel === 'ls' || nextRel === 'ob' || nextRel === 'lb') {
          var genBeforeThisSpouse = 0;
          for (var k = 0; k < i; k++) {
            if (chain[k] === 's' || chain[k] === 'd') genBeforeThisSpouse++;
          }
          if (genBeforeThisSpouse >= 2) {
            hasGrandchildSpouseSib = true;
            grandchildSpouseSibIndex = i + 1;
            break;
          }
        }
      }
    }
    
    if (hasGrandchildSpouseSib && genUp === 0) {
      console.log('[模式 8 匹配] 姻孙系列，chain =', chain, 'grandchildSpouseSibIndex =', grandchildSpouseSibIndex);
      var genBeforeSpouse = 0;
      for (var i = 0; i < grandchildSpouseSibIndex; i++) {
        if (chain[i] === 's' || chain[i] === 'd') genBeforeSpouse++;
      }
      console.log('[模式 8] genBeforeSpouse =', genBeforeSpouse);
      
      var afterSibChain = chain.slice(grandchildSpouseSibIndex + 1);
      console.log('[模式 8] afterSibChain =', afterSibChain);
      
      // 修复 v711-51-fix-v12: 孙子的配偶的姐妹的子女是 +1 代（曾孙辈），不是平辈，不要跳过第一个 s/d
      var genAfterSib = 0;
      for (var i = 0; i < afterSibChain.length; i++) {
        if (afterSibChain[i] === 's' || afterSibChain[i] === 'd') genAfterSib++;
        else if (afterSibChain[i] === 'f' || afterSibChain[i] === 'm') genAfterSib++;
      }
      console.log('[模式 8] genAfterSib =', genAfterSib);
      
      var lastGenGender = 'male';
      for (var i = chain.length - 1; i >= 0; i--) {
        if (chain[i] === 's' || chain[i] === 'ob' || chain[i] === 'lb') { lastGenGender = 'male'; break; }
        else if (chain[i] === 'd' || chain[i] === 'os' || chain[i] === 'ls') { lastGenGender = 'female'; break; }
        else if (chain[i] === 'h') { lastGenGender = 'male'; break; }
        else if (chain[i] === 'w') { lastGenGender = 'female'; break; }
      }
      
      var sibGender = 'female';
      var sibRel = chain[grandchildSpouseSibIndex];
      if (sibRel === 'ob' || sibRel === 'lb') sibGender = 'male';
      else if (sibRel === 'os' || sibRel === 'ls') sibGender = 'female';
      
      // 总代数 = 配偶前代数 + 姐妹后代数
      var totalGen = genBeforeSpouse + genAfterSib;
      console.log('[模式 8] totalGen =', totalGen);
      
      // 判断是否是配偶（最后是 h/w）
      var lastIsSpouse = (chain.length > 0 && (chain[chain.length - 1] === 'h' || chain[chain.length - 1] === 'w'));
      
      // 修复 v711-51-fix-v13: 使用完整称谓前缀（带"孙"字）
      var genDownPrefixFull = ['', '', '孙', '曾孙', '玄孙', '来孙', '昆孙', '仍孙', '云孙'];
      var prefix = genDownPrefixFull[totalGen] || '远孙';
      
      if (lastIsSpouse) {
        // 配偶称谓
        return '姻' + prefix + (lastGenGender === 'male' ? '女婿' : '媳');
      } else if (genAfterSib === 0 && afterSibChain.length === 0) {
        // 只有姐妹，没有后代
        var basePrefix = genDownPrefixFull[genBeforeSpouse] || '远孙';
        return '姻' + basePrefix + (sibGender === 'female' ? '女' : '');
      } else {
        // 有后代
        return '姻' + prefix + (lastGenGender === 'female' ? '女' : '');
      }
    }
    
    // ========== 模式 9：孙子的妻子的父母（姻侄/姻侄女等） ==========
    // 关系链：s + s + w + f/m（孙子的配偶的父母）
    // 例如：安爷爷→安瑞国 (s)→安文杰 (s)→付芊雨 (w)→付廷绪 (f) = 姻侄
    // 例如：安爷爷→安瑞国 (s)→安文杰 (s)→付芊雨 (w)→唐文有 (m) = 姻侄媳
    // 修复 v711-51-fix-v14: genUp 可以是 1（因为 f/m 是向上 1 代）
    if (chain.length >= 3) {
      var lastRel = chain[chain.length - 1];
      if ((lastRel === 'f' || lastRel === 'm') && chain[chain.length - 2] === 'w') {
        var genBeforeW = 0;
        for (var i = 0; i < chain.length - 2; i++) {
          if (chain[i] === 's' || chain[i] === 'd') genBeforeW++;
        }
        
        if (genBeforeW >= 2) {
          console.log('[模式 9 匹配] 姻侄系列，chain =', chain, 'genBeforeW =', genBeforeW);
          // genBeforeW=2 → 姻侄/姻侄媳，genBeforeW=3 → 姻侄孙/姻侄孙女，genBeforeW=4 → 姻侄曾孙/姻侄曾孙女
          var genDownPrefix = ['', '', '侄', '侄孙', '侄曾孙', '侄玄孙'];
          var basePrefix = genDownPrefix[genBeforeW] || '侄';
          if (lastRel === 'f') {
            return '姻' + basePrefix;
          } else {
            // 修复 v711-51-fix-v13: 妻子的母亲 = 姻侄媳（不是姻侄女）
            return '姻' + basePrefix + '媳';
          }
        }
      }
    }
    
    return null;
  }

// 正向关系数据（我称呼她/他）- 来自电子家谱 v703-07 已验证逻辑
var mainData = {
  '': ['自己', '我'],
  'f': ['爸爸', '父亲'],
  'm': ['妈妈', '母亲'],
  // v711-51-fix-v82 修复：爸爸的爸爸 = 爷爷（爷爷在前，祖父在后）
  'f,f': ['爷爷'],
  'f,m': ['奶奶'],
  'm,f': ['外公', '姥爷'],
  'm,m': ['外婆', '姥姥'],
  'f,f,f': ['曾祖父', '太公'],
  'f,f,m': ['曾祖母'],
  'f,m,f': ['曾外祖父'],
  'f,m,m': ['曾外祖母'],
  'm,f,f': ['外曾祖父'],
  'm,f,m': ['外曾祖母'],
  'm,m,f': ['外曾外祖父'],
  'm,m,m': ['外曾外祖母'],
  'f,f,f,f': ['高祖父', '天祖'],
  'f,f,f,m': ['高祖母'],
  'f,f,m,f': ['高外祖父'],
  'f,f,m,m': ['高外祖母'],
  'f,f,m,f,m': ['天祖母'],
  'f,m,f,f': ['外高祖父'],
  'f,m,f,m': ['外高祖母'],
  'f,m,m,f': ['外高外祖父'],
  'f,m,m,m': ['外高外祖母'],
  'm,f,f,f': ['外曾高祖父'],
  'm,f,f,m': ['外曾高祖母'],
  'm,f,m,f': ['外高外祖父'],
  'm,f,m,m': ['外高外祖母'],
  'm,m,f,f': ['外高外祖父'],
  'm,m,f,m': ['外高外祖母'],
  'm,m,m,f': ['外高外外祖父'],
  'm,m,m,m': ['外高外外祖母'],
  // === 第6代：烈祖父 ===
  'f,f,f,f,f': ['烈祖父', '烈祖'],
  'f,f,f,f,m': ['烈祖母'],
  'f,f,f,m,f': ['烈外祖父'],
  'f,f,f,m,m': ['烈外祖母'],
  'f,f,m,f,f': ['外烈祖父'],
  'f,f,m,f,m': ['外烈祖母'],
  'f,f,m,m,f': ['外烈外祖父'],
  'f,f,m,m,m': ['外烈外祖母'],
  'f,m,f,f,f': ['外烈祖父'],
  'f,m,f,f,m': ['外烈祖母'],
  'f,m,f,m,f': ['外烈外祖父'],
  'f,m,f,m,m': ['外烈外祖母'],
  'f,m,m,f,f': ['外烈外祖父'],
  'f,m,m,f,m': ['外烈外祖母'],
  'f,m,m,m,f': ['外烈外外祖父'],
  'f,m,m,m,m': ['外烈外外祖母'],
  'm,f,f,f,f': ['外曾烈祖父'],
  'm,f,f,f,m': ['外曾烈祖母'],
  'm,f,f,m,f': ['外曾烈外祖父'],
  'm,f,f,m,m': ['外曾烈外祖母'],
  'm,f,m,f,f': ['外曾烈外祖父'],
  'm,f,m,f,m': ['外曾烈外祖母'],
  'm,f,m,m,f': ['外曾烈外外祖父'],
  'm,f,m,m,m': ['外曾烈外外祖母'],
  'm,m,f,f,f': ['外曾烈外祖父'],
  'm,m,f,f,m': ['外曾烈外祖母'],
  'm,m,f,m,f': ['外曾烈外外祖父'],
  'm,m,f,m,m': ['外曾烈外外祖母'],
  'm,m,m,f,f': ['外曾烈外外祖父'],
  'm,m,m,f,m': ['外曾烈外外祖母'],
  'm,m,m,m,f': ['外曾烈外外外祖父'],
  'm,m,m,m,m': ['外曾烈外外外祖母'],
  // === 第7代：太祖父 ===
  'f,f,f,f,f,f': ['太祖父', '太祖'],
  'f,f,f,f,f,m': ['太祖母'],
  'f,f,f,f,m,f': ['太外祖父'],
  'f,f,f,f,m,m': ['太外祖母'],
  'f,f,f,m,f,f': ['外太祖父'],
  'f,f,f,m,f,m': ['外太祖母'],
  'f,f,f,m,m,f': ['外太外祖父'],
  'f,f,f,m,m,m': ['外太外祖母'],
  'f,f,m,f,f,f': ['外太祖父'],
  'f,f,m,f,f,m': ['外太祖母'],
  'f,f,m,f,m,f': ['外太外祖父'],
  'f,f,m,f,m,m': ['外太外祖母'],
  'f,f,m,m,f,f': ['外太外祖父'],
  'f,f,m,m,f,m': ['外太外祖母'],
  'f,f,m,m,m,f': ['外太外外祖父'],
  'f,f,m,m,m,m': ['外太外外祖母'],
  'f,m,f,f,f,f': ['外太祖父'],
  'f,m,f,f,f,m': ['外太祖母'],
  'f,m,f,f,m,f': ['外太外祖父'],
  'f,m,f,f,m,m': ['外太外祖母'],
  'f,m,f,m,f,f': ['外太外祖父'],
  'f,m,f,m,f,m': ['外太外祖母'],
  'f,m,f,m,m,f': ['外太外外祖父'],
  'f,m,f,m,m,m': ['外太外外祖母'],
  'f,m,m,f,f,f': ['外太外祖父'],
  'f,m,m,f,f,m': ['外太外祖母'],
  'f,m,m,f,m,f': ['外太外外祖父'],
  'f,m,m,f,m,m': ['外太外外祖母'],
  'f,m,m,m,f,f': ['外太外外祖父'],
  'f,m,m,m,f,m': ['外太外外祖母'],
  'f,m,m,m,m,f': ['外太外外外祖父'],
  'f,m,m,m,m,m': ['外太外外外祖母'],
  'm,f,f,f,f,f': ['外曾太祖父'],
  'm,f,f,f,f,m': ['外曾太祖母'],
  'm,f,f,f,m,f': ['外曾太外祖父'],
  'm,f,f,f,m,m': ['外曾太外祖母'],
  'm,f,f,m,f,f': ['外曾太外祖父'],
  'm,f,f,m,f,m': ['外曾太外祖母'],
  'm,f,f,m,m,f': ['外曾太外外祖父'],
  'm,f,f,m,m,m': ['外曾太外外祖母'],
  'm,f,m,f,f,f': ['外曾太外祖父'],
  'm,f,m,f,f,m': ['外曾太外祖母'],
  'm,f,m,f,m,f': ['外曾太外外祖父'],
  'm,f,m,f,m,m': ['外曾太外外祖母'],
  'm,f,m,m,f,f': ['外曾太外外祖父'],
  'm,f,m,m,f,m': ['外曾太外外祖母'],
  'm,f,m,m,m,f': ['外曾太外外外祖父'],
  'm,f,m,m,m,m': ['外曾太外外外祖母'],
  'm,m,f,f,f,f': ['外曾太外祖父'],
  'm,m,f,f,f,m': ['外曾太外祖母'],
  'm,m,f,f,m,f': ['外曾太外外祖父'],
  'm,m,f,f,m,m': ['外曾太外外祖母'],
  'm,m,f,m,f,f': ['外曾太外外祖父'],
  'm,m,f,m,f,m': ['外曾太外外祖母'],
  'm,m,f,m,m,f': ['外曾太外外外祖父'],
  'm,m,f,m,m,m': ['外曾太外外外祖母'],
  'm,m,m,f,f,f': ['外曾太外外祖父'],
  'm,m,m,f,f,m': ['外曾太外外祖母'],
  'm,m,m,f,m,f': ['外曾太外外外祖父'],
  'm,m,m,f,m,m': ['外曾太外外外祖母'],
  'm,m,m,m,f,f': ['外曾太外外外祖父'],
  'm,m,m,m,f,m': ['外曾太外外外祖母'],
  'm,m,m,m,m,f': ['外曾太外外外外祖父'],
  'm,m,m,m,m,m': ['外曾太外外外外祖母'],
  'f,ob': ['伯父', '伯伯'],
  'f,ob,w': ['伯母'],
  'f,lb': ['叔叔', '叔父'],
  'f,lb,w': ['婶婶', '婶母'],
  'f,xs': ['姑妈', '姑姑'],
  'f,xs,h': ['姑父', '姑丈'],
  'm,xb': ['舅舅', '舅父'],
  'm,xb,w': ['舅妈', '妗子'],
  'm,ob,s': ['表兄弟'],  // 妈妈的哥哥的儿子 = 表兄弟
  'm,ob,d': ['表姐妹'],  // 妈妈的哥哥的女儿 = 表姐妹
  'm,lb,s': ['表兄弟'],  // 妈妈的弟弟的儿子 = 表兄弟
  'm,lb,d': ['表姐妹'],  // 妈妈的弟弟的女儿 = 表姐妹
  'm,xs': ['姨妈', '姨母'],
  'm,os': ['姨妈'],  // 妈妈的姐姐
  'm,ls': ['姨妈'],  // 妈妈的妹妹
  'm,m,ob': ['舅公'],  // 妈妈的妈妈的哥哥
  'm,m,lb': ['舅公'],  // 妈妈的妈妈的弟弟
  'm,m,os': ['舅公'],  // 妈妈的妈妈的姐姐
  'm,m,ls': ['舅公'],  // 妈妈的妈妈的妹妹
  'm,xs,h': ['姨父', '姨丈'],
  'h': ['丈夫', '老公'],
  'w': ['妻子', '老婆'],
  's': ['儿子'],
  's,w': ['儿媳', '儿媳妇'],
  'd': ['女儿'],
  'd,h': ['女婿', '姑爷'],
  'ob': ['哥哥', '兄长'],
  'ob,w': ['嫂子', '嫂嫂'],
  'lb': ['弟弟', '兄弟'],
  'lb,w': ['弟媳', '弟妹'],
  'os': ['姐姐', '姊姊'],
  'os,h': ['姐夫'],
  'ls': ['妹妹', '妹子'],
  'ls,h': ['妹夫'],
  // v711-51-fix: 兄弟姐妹统称简化结果（simplifyChain 循环简化输出）
  'xs': ['姐姐/妹妹'],  // 姐妹统称 = 姐姐或妹妹（无法判断长幼）
  'xs,h': ['姐夫', '妹夫', '姐妹夫'],  // 姐妹统称的丈夫 = 姐夫/妹夫/姐妹夫
  'xs,w': ['嫂子', '弟媳', '兄弟媳'],  // 姐妹统称的妻子（女同）
  'xb': ['哥哥/弟弟'],  // 兄弟统称 = 哥哥或弟弟（无法判断长幼）
  // 兄弟姐妹之间的称谓（v43 新增）
  'ob,os': ['姐姐'],  // 哥哥的姐姐 = 姐姐
  'ob,ls': ['姐姐/妹妹'],  // 哥哥的妹妹 = 姐妹（无法判断长幼）
  'os,ob': ['哥哥'],  // 姐姐的哥哥 = 哥哥
  'os,lb': ['哥哥/弟弟'],  // 姐姐的弟弟 = 兄弟（无法判断长幼）
  'lb,os': ['姐姐/妹妹'],  // 弟弟的姐姐 = 姐妹（无法判断长幼）
  'lb,ls': ['妹妹'],  // 弟弟的妹妹 = 妹妹
  'os,ls': ['姐姐/妹妹'],  // 姐姐的妹妹 = 姐妹（无法判断长幼）
  'ls,os': ['姐姐/妹妹'],  // 妹妹的姐姐 = 姐妹（无法判断长幼）
  // 兄弟姐妹的兄弟姐妹的子女（v43 新增）
  'ob,os,ls': ['姐姐/妹妹'],  // 哥哥的姐姐的妹妹 = 姐妹
  'ob,os,ls,h': ['姐夫', '妹夫', '姐妹夫'],  // 哥哥的姐姐的妹妹的丈夫 = 姐妹夫
  'ob,os,s': ['外甥', '外甥女'],  // 哥哥的姐姐的儿子
  'ob,os,d': ['外甥女', '外甥'],  // 哥哥的姐姐的女儿
  'ob,ls,s': ['外甥', '外甥女'],  // 哥哥的妹妹的儿子
  'ob,ls,d': ['外甥女', '外甥'],  // 哥哥的妹妹的女儿
  'os,ob,s': ['侄子', '侄女'],  // 姐姐的哥哥的儿子
  'os,ob,d': ['侄女', '侄子'],  // 姐姐的哥哥的女儿
  'os,lb,s': ['侄子/外甥', '侄女/外甥女'],  // 姐姐的弟弟的儿子
  'os,lb,d': ['侄女/外甥女', '侄子/外甥'],  // 姐姐的弟弟的女儿
  'lb,os,s': ['外甥', '外甥女'],  // 弟弟的姐姐的儿子
  'lb,os,d': ['外甥女', '外甥'],  // 弟弟的姐姐的女儿
  'lb,ls,s': ['外甥', '外甥女'],  // 弟弟的妹妹的儿子
  'lb,ls,d': ['外甥女', '外甥'],  // 弟弟的妹妹的女儿
  'xb,s': ['侄子', '侄儿'],
  'xb,s,w': ['侄媳'],
  'xb,d': ['侄女'],
  'xb,d,h': ['侄女婿'],
  'xs,s': ['外甥', '甥儿'],
  'xs,s,w': ['外甥媳'],
  'xs,d': ['外甥女', '甥女'],
  'xs,d,h': ['外甥女婿'],
  // 姐妹的孙辈（v703-31 修复：明确区分性别）
  'xs,s,s': ['外甥孙'],
  'xs,s,d': ['外甥孙女'],
  'xs,d,s': ['外甥外孙'],
  'xs,d,d': ['外甥外孙女'],
  // 姐姐的孙辈
  'os,s,s': ['外甥孙'],
  'os,s,d': ['外甥孙女'],
  'os,d,s': ['外甥外孙'],
  'os,d,d': ['外甥外孙女'],
  // 妹妹的孙辈
  'ls,s,s': ['外甥孙'],
  'ls,s,d': ['外甥孙女'],
  'ls,d,s': ['外甥外孙'],
  'ls,d,d': ['外甥外孙女'],
  // 兄弟的孙辈
  'xb,s,s': ['侄孙'],
  'xb,s,d': ['侄孙女'],
  'xb,d,s': ['侄外孙'],
  'xb,d,d': ['侄外孙女'],
  'ob,s,s': ['侄孙'],
  'ob,s,d': ['侄孙女'],
  'ob,d,s': ['侄外孙'],
  'ob,d,d': ['侄外孙女'],
  'lb,s,s': ['侄孙'],
  'lb,s,d': ['侄孙女'],
  'lb,d,s': ['侄外孙'],
  'lb,d,d': ['侄外孙女'],
  's,s': ['孙子', '孙儿'],
  's,s,w': ['孙媳'],
  's,d': ['孙女'],
  's,d,h': ['孙女婿'],
  'd,s': ['外孙', '外孙儿'],
  'd,s,w': ['外孙媳'],
  'd,d': ['外孙女'],
  'd,d,h': ['外孙女婿'],
  's,s,s': ['曾孙', '曾孙子'],
  's,s,d': ['曾孙女'],
  's,d,s': ['曾外孙'],
  's,d,d': ['曾外孙女'],
  'd,s,s': ['外曾孙'],
  'd,s,d': ['外曾孙女'],
  'd,d,s': ['外曾外孙'],
  'd,d,d': ['外曾外孙女'],
  's,s,s,s': ['玄孙'],
  's,s,s,d': ['玄孙女'],
  's,s,d,s': ['玄外孙'],
  's,s,d,d': ['玄外孙女'],
  's,d,s,s': ['玄外外孙'],
  's,d,s,d': ['玄外外孙女'],
  'd,s,s,s': ['外玄孙'],
  'd,s,s,d': ['外玄孙女'],
  'd,d,s,s': ['外玄外孙'],
  'd,d,d,d': ['外玄外孙女'],
  // === 第6代：来孙 ===
  's,s,s,s,s': ['来孙'],
  's,s,s,s,d': ['来孙女'],
  's,s,s,d,s': ['来外孙'],
  's,s,s,d,d': ['来外孙女'],
  's,s,d,s,s': ['来外外孙'],
  's,s,d,s,d': ['来外外孙女'],
  's,d,s,s,s': ['来外外孙'],
  's,d,s,s,d': ['来外外孙女'],
  'd,s,s,s,s': ['外来孙'],
  'd,s,s,s,d': ['外来孙女'],
  'd,d,s,s,s': ['外来外孙'],
  'd,d,d,d,d': ['外来外外孙女'],
  // === 第7代：晜孙 ===
  's,s,s,s,s,s': ['晜孙', '昆孙'],
  's,s,s,s,s,d': ['晜孙女'],
  's,s,s,s,d,s': ['晜外孙'],
  's,s,s,s,d,d': ['晜外孙女'],
  's,s,s,d,s,s': ['晜外外孙'],
  's,s,s,d,s,d': ['晜外外孙女'],
  's,s,d,s,s,s': ['晜外外孙'],
  's,s,d,s,s,d': ['晜外外孙女'],
  's,d,s,s,s,s': ['晜外外孙'],
  's,d,s,s,s,d': ['晜外外孙女'],
  'd,s,s,s,s,s': ['外晜孙'],
  'd,s,s,s,s,d': ['外晜孙女'],
  'd,d,s,s,s,s': ['外晜外孙'],
  'd,d,d,d,d,d': ['外晜外外孙女'],
  // === 第8代：仍孙 ===
  's,s,s,s,s,s,s': ['仍孙'],
  's,s,s,s,s,s,d': ['仍孙女'],
  's,s,s,s,s,d,s': ['仍外孙'],
  's,s,s,s,s,d,d': ['仍外孙女'],
  's,s,s,s,d,s,s': ['仍外外孙'],
  's,s,s,s,d,s,d': ['仍外外孙女'],
  's,s,s,d,s,s,s': ['仍外外孙'],
  's,s,d,s,s,s,s': ['仍外外孙'],
  's,d,s,s,s,s,s': ['仍外外孙'],
  'd,s,s,s,s,s,s': ['外仍孙'],
  'd,s,s,s,s,s,d': ['外仍孙女'],
  'd,d,s,s,s,s,s': ['外仍外孙'],
  'd,d,d,d,d,d,d': ['外仍外外孙女'],
  'xb,s,s': ['侄孙'],
  'xb,s,d': ['侄孙女'],
  'xb,d,s': ['侄外孙'],
  'xb,d,d': ['侄外孙女'],
  'xs,s,s': ['外甥孙'],
  'xs,s,d': ['外甥孙女'],
  'xs,d,s': ['外甥外孙'],
  'xs,d,d': ['外甥外孙女'],
  
  // 妻子的亲属（男性视角 - 我称呼她）
  'w,f': ['岳父', '丈人'],
  'w,m': ['岳母', '丈母娘'],
  'w,os': ['大姨姐', '大姨子'],
  'w,os,h': ['连襟'],
  'w,os,s': ['外甥', '姨侄'],
  'w,os,d': ['外甥女', '姨侄女'],
  'w,os,s,s': ['外甥孙', '姨侄孙'],
  'w,os,s,d': ['外甥孙女', '姨侄孙女'],
  'w,os,d,s': ['外甥外孙'],
  'w,os,d,d': ['外甥外孙女'],
  'w,os,s,s,s': ['外甥曾孙'],
  'w,os,s,s,d': ['外甥曾孙女'],
  'w,os,s,d,s': ['外甥曾外孙'],
  'w,os,s,d,d': ['外甥曾外孙女'],
  'w,os,s,s,s,s': ['外甥玄孙'],
  'w,os,s,s,s,s,s': ['外甥来孙'],
  'w,ls': ['小姨子'],
  'w,ls,h': ['连襟'],
  'w,ls,s': ['外甥'],
  'w,ls,d': ['外甥女'],
  'w,ls,s,s': ['外甥孙'],
  'w,ls,s,d': ['外甥孙女'],
  'w,ls,d,s': ['外甥外孙'],
  'w,ls,d,d': ['外甥外孙女'],
  'w,lb': ['小舅子', '内弟'],
  'w,lb,w': ['舅媳'],
  'w,lb,s': ['外甥'],
  'w,lb,d': ['外甥女'],
  'w,lb,s,s': ['外甥孙'],
  'w,lb,s,d': ['外甥孙女'],
  'w,lb,d,s': ['外甥外孙'],
  'w,lb,d,d': ['外甥外孙女'],
  'w,xb': ['小舅子'],
  'w,xb,w': ['舅媳'],
  'w,xb,s': ['外甥'],
  'w,xb,d': ['外甥女'],
  'w,xb,s,s': ['外甥孙'],
  'w,xb,s,d': ['外甥孙女'],
  'w,xb,d,s': ['外甥外孙'],
  'w,xb,d,d': ['外甥外孙女'],
  'w,xb,s,s,s': ['外甥曾孙'],
  'w,xb,s,s,d': ['外甥曾孙女'],
  'w,xb,s,s,s,s': ['外甥玄孙'],
  'w,xb,s,s,s,s,s': ['外甥来孙'],
  
  // 丈夫的亲属（女性视角 - 我称呼她）
  'h,f': ['公公', '父'],
  'h,m': ['婆婆', '母'],
  'h,ob': ['大伯哥', '大伯'],
  'h,ob,w': ['妯娌', '大嫂'],
  'h,ob,s': ['侄子'],
  'h,ob,d': ['侄女'],
  'h,lb': ['小叔子'],
  'h,lb,w': ['妯娌', '弟媳'],
  'h,lb,s': ['侄子'],
  'h,lb,d': ['侄女'],
  'h,os': ['大姑姐'],
  'h,os,h': ['连襟'],
  'h,os,s': ['外甥'],
  'h,os,d': ['外甥女'],
  'h,ls': ['小姑子'],
  'h,ls,h': ['连襟'],
  'h,ls,s': ['外甥'],
  'h,ls,d': ['外甥女'],
  
  // 亲家关系
  's,w,f': ['亲家公'],
  's,w,m': ['亲家母'],
  'd,h,f': ['亲家公'],
  'd,h,m': ['亲家母'],
  
  // ========== 妻子的兄弟姐妹的配偶及后代系列（模式 0e/0f）==========
  'w,os,h': ['姐夫'],
  'w,ls,h': ['妹夫'],
  'w,os,s,w': ['外甥媳'],
  'w,os,d,h': ['外甥女婿'],
  'w,ls,s,w': ['外甥媳'],
  'w,ls,d,h': ['外甥女婿'],
  'w,os,s,s': ['外甥孙'],
  'w,os,s,d': ['外甥孙女'],
  'w,os,d,s': ['外甥外孙'],
  'w,os,d,d': ['外甥外孙女'],
  'w,ls,s,s': ['外甥孙'],
  'w,ls,s,d': ['外甥孙女'],
  'w,ls,d,s': ['外甥外孙'],
  'w,ls,d,d': ['外甥外孙女'],
  
  // ========== 妻子的兄弟的妻子的亲属系列（模式 0e-2）==========
  'w,ob,w': ['嫂子'],
  'w,lb,w': ['弟媳'],
  'w,ob,w,f': ['姻伯'],
  'w,ob,w,m': ['姻伯母'],
  'w,ob,w,os': ['姻姐'],
  'w,ob,w,ls': ['姻妹'],
  'w,ob,w,ob': ['姻兄'],
  'w,ob,w,lb': ['姻弟'],
  'w,ob,w,s': ['姻侄'],
  'w,ob,w,d': ['姻侄女'],
  'w,lb,w,f': ['姻伯'],
  'w,lb,w,m': ['姻伯母'],
  'w,lb,w,os': ['姻姐'],
  'w,lb,w,ls': ['姻妹'],
  'w,lb,w,ob': ['姻兄'],
  'w,lb,w,lb': ['姻弟'],
  'w,lb,w,s': ['姻侄'],
  'w,lb,w,d': ['姻侄女'],
  'w,lb,w,os,h': ['姻姐夫'],
  'w,lb,w,os,s': ['姻侄'],
  'w,lb,w,os,d': ['姻侄女'],
  'w,lb,w,ls,h': ['姻妹夫'],
  'w,lb,w,ls,s': ['姻侄'],
  'w,lb,w,ls,d': ['姻侄女'],
  
  // ========== 妻子的姐妹的丈夫的亲属系列（模式 0f）==========
  'w,os,h,f': ['姻伯'],
  'w,os,h,m': ['姻伯母'],
  'w,os,h,ob': ['姻兄'],
  'w,os,h,lb': ['姻弟'],
  'w,os,h,os': ['姻姐'],
  'w,os,h,ls': ['姻妹'],
  'w,os,h,s': ['姻侄'],
  'w,os,h,d': ['姻侄女'],
  'w,os,h,ob,s': ['姻侄'],
  'w,os,h,ob,d': ['姻侄女'],
  'w,os,h,lb,s': ['姻侄'],
  'w,os,h,lb,d': ['姻侄女'],
  'w,ls,h,f': ['姻伯'],
  'w,ls,h,m': ['姻伯母'],
  'w,ls,h,ob': ['姻兄'],
  'w,ls,h,lb': ['姻弟'],
  'w,ls,h,s': ['姻侄'],
  'w,ls,h,d': ['姻侄女'],
  
  // ========== 妈妈的弟弟的妻子的亲属系列（模式 0g-1）==========
  'm,lb,w': ['舅妈'],
  'm,lb,w,m': ['姻外祖母'],
  'm,lb,w,f': ['姻外祖父'],
  'm,lb,w,os': ['姻伯母'],
  'm,lb,w,ls': ['姻姨母'],
  'm,lb,w,s': ['姻兄弟'],
  'm,lb,w,d': ['姻姐妹'],
  'm,lb,w,os,h': ['姻伯'],
  'm,lb,w,os,s': ['姻侄'],
  'm,lb,w,os,d': ['姻侄女'],
  
  // ========== 妈妈的妹妹的丈夫的亲属系列（模式 0g-2）==========
  'm,ls,h': ['姨父'],
  'm,ls,h,ob': ['姻伯'],
  'm,ls,h,lb': ['姻叔'],
  'm,ls,h,os': ['姻姑母'],
  'm,ls,h,ls': ['姻姨母'],
  'm,ls,h,s': ['姻表兄弟'],
  'm,ls,h,d': ['姻表姐妹'],
  'm,ls,h,ob,s': ['姻表兄弟'],
  'm,ls,h,ob,d': ['姻表姐妹'],
  
  // ========== 丈夫的妈妈的亲属系列（模式 0g-3，女性视角）==========
  'h,m,f': ['外公'],
  'h,m,m': ['外婆'],
  'h,m,os': ['姨母'],
  'h,m,ls': ['姨母'],
  'h,m,os,h': ['姨父'],
  'h,m,os,d': ['表姐妹'],
  'h,m,os,s': ['表侄'],
  'h,m,ls,d': ['表姐妹'],
  'h,m,ls,s': ['表侄'],
  'h,m,os,ls': ['姨母'],
  'h,m,os,ls,h': ['姨父'],
  
  // ========== 妻子的妈妈的亲属系列（模式 0g-4，男性视角）==========
  'w,m,f': ['外公'],
  'w,m,m': ['外婆'],
  'w,m,os': ['姨母'],
  'w,m,ls': ['姨母'],
  'w,m,os,h': ['姨父'],
  'w,m,os,d': ['表姐妹'],
  'w,m,os,s': ['表兄弟'],
  'w,m,ls,d': ['表姐妹'],
  'w,m,ls,s': ['表兄弟'],
  'w,m,os,ls': ['姨母'],
  'w,m,os,ls,h': ['姨父'],
  'w,m,os,s,w': ['表兄弟媳'],
  'w,m,os,s,d': ['表侄女'],
  'w,m,os,s,s': ['表侄'],
  
  // ========== 爸爸的妈妈的亲属系列（模式 0h-1）==========
  'f,m,f': ['曾祖父'],
  'f,m,m': ['曾祖母'],
  'f,m,ob': ['舅祖父'],
  'f,m,lb': ['舅祖父'],
  'f,m,os': ['姨祖母'],
  'f,m,ls': ['姨祖母'],
  'f,m,ob,w': ['舅祖母'],
  'f,m,lb,w': ['舅祖母'],
  'f,m,os,h': ['姨祖父'],
  'f,m,ls,h': ['姨祖父'],
  'f,m,ls,d': ['表姑'],
  'f,m,ls,s': ['表叔'],
  'f,m,os,d': ['表姑'],
  'f,m,os,s': ['表叔'],
  'f,m,ob,s': ['表叔'],
  'f,m,ob,d': ['表姑'],
  
  // ========== 姐妹的丈夫的亲属系列（模式 0d）==========
  'os,h,f': ['姻伯'],
  'os,h,m': ['姻伯母'],
  'os,h,ob': ['姻兄'],
  'os,h,lb': ['姻弟'],
  'os,h,os': ['姻姐'],
  'os,h,ls': ['姻妹'],
  'os,h,s': ['姻侄'],
  'os,h,d': ['姻侄女'],
  'os,h,ob,s': ['姻侄'],
  'os,h,ob,d': ['姻侄女'],
  'os,h,lb,s': ['姻侄'],
  'os,h,lb,d': ['姻侄女'],
  'ls,h,f': ['姻伯'],
  'ls,h,m': ['姻伯母'],
  'ls,h,ob': ['姻兄'],
  'ls,h,lb': ['姻弟'],
  'ls,h,os': ['姻姐'],
  'ls,h,ls': ['姻妹'],
  'ls,h,s': ['姻侄'],
  'ls,h,d': ['姻侄女'],
  'ls,h,ob,s': ['姻侄'],
  'ls,h,ob,d': ['姻侄女'],
  
  // ========== 兄弟的妻子的亲属系列（模式 0d-1）==========
  'ob,w,f': ['姻伯'],
  'ob,w,m': ['姻伯母'],
  'ob,w,ob': ['姻兄'],
  'ob,w,lb': ['姻弟'],
  'ob,w,os': ['姻姐'],
  'ob,w,ls': ['姻妹'],
  'ob,w,s': ['姻侄'],
  'ob,w,d': ['姻侄女'],
  'ob,w,os,h': ['姻姐夫'],
  'ob,w,os,s': ['姻侄'],
  'ob,w,os,d': ['姻侄女'],
  'lb,w,f': ['姻伯'],
  'lb,w,m': ['姻伯母'],
  'lb,w,ob': ['姻兄'],
  'lb,w,lb': ['姻弟'],
  'lb,w,os': ['姻姐'],
  'lb,w,ls': ['姻妹'],
  'lb,w,s': ['姻侄'],
  'lb,w,d': ['姻侄女'],
  'lb,w,os,h': ['姻姐夫'],
  'lb,w,os,s': ['姻侄'],
  'lb,w,os,d': ['姻侄女'],
  'lb,w,ls,h': ['姻妹夫'],
  'lb,w,ls,s': ['姻侄'],
  'lb,w,ls,d': ['姻侄女'],
  
  // ========== 女儿的丈夫的亲属系列（模式 0d）==========
  'd,h,ob': ['姻侄'],
  'd,h,os': ['姻侄女'],
  'd,h,ob,s': ['姻侄孙'],
  'd,h,ob,d': ['姻侄孙女'],
  
  // ========== 儿子的妻子的亲属系列（模式 0e）==========
  's,w,os': ['姻侄女'],
  's,w,ls': ['姻侄女'],
  's,w,os,h': ['姻侄女婿'],
  's,w,os,s': ['姻侄孙'],
  's,w,os,d': ['姻侄孙女'],
  's,w,ls,s': ['姻侄孙'],
  's,w,ls,d': ['姻侄孙女'],
  
  // ========== 模式 9：孙子的妻子的父母（v711-51-fix-v70 新增）==========
  's,s,w,f': ['姻侄'],
  's,s,w,m': ['姻侄媳'],
  's,s,s,w,f': ['姻侄孙'],
  's,s,s,w,m': ['姻侄孙女'],
  's,s,s,s,w,f': ['姻侄曾孙'],
  's,s,s,s,w,m': ['姻侄曾孙女'],
  
  // ========== 孙子的妻子的兄弟姐妹系列（v711-51-fix-v70 新增）==========
  's,s,w,ob': ['姻舅'],
  's,s,w,lbs': ['姻舅'],
  's,s,w,os': ['姻侄女'],
  's,s,w,ls': ['姻侄女'],
  's,s,w,ob,s': ['姻表侄'],
  's,s,w,ob,d': ['姻表侄女'],
  's,s,w,os,s': ['姻表侄'],
  's,s,w,os,d': ['姻表侄女'],
  
  // ========== 模式 2：姻系列（姐妹的配偶的亲属）- 来自电子家谱 v711-69 ==========
  // 姐妹的丈夫的爸爸/妈妈
  'os,h,f': ['姻伯父'],
  'os,h,m': ['姻伯母'],
  'ls,h,f': ['姻伯父'],
  'ls,h,m': ['姻伯母'],
  
  // 姐妹的丈夫的哥哥/弟弟/姐姐/妹妹
  'os,h,ob': ['姻兄'],
  'os,h,lb': ['姻弟'],
  'os,h,os': ['姻姐'],
  'os,h,ls': ['姻妹'],
  'ls,h,ob': ['姻兄'],
  'ls,h,lb': ['姻弟'],
  'ls,h,os': ['姻姐'],
  'ls,h,ls': ['姻妹'],
  
  // 姐妹的丈夫的子女
  'os,h,s': ['姻侄'],
  'os,h,d': ['姻侄女'],
  'ls,h,s': ['姻侄'],
  'ls,h,d': ['姻侄女'],
  
  // 姐妹的丈夫的兄弟姐妹的子女
  'os,h,ob,s': ['姻侄'],
  'os,h,ob,d': ['姻侄女'],
  'os,h,lb,s': ['姻侄'],
  'os,h,lb,d': ['姻侄女'],
  'os,h,os,s': ['姻侄'],
  'os,h,os,d': ['姻侄女'],
  'os,h,ls,s': ['姻侄'],
  'os,h,ls,d': ['姻侄女'],
  
  // ========== 模式 4：表系列（有姐妹，有向下）- 来自电子家谱 ==========
  // 妈妈的姐妹的儿子/女儿（表亲）
  'm,os,s': ['表兄'],
  'm,os,d': ['表姐'],
  'm,ls,s': ['表兄'],
  'm,ls,d': ['表姐'],
  
  // 妈妈的姐妹的儿子的儿子/女儿（表侄/表外甥）
  'm,os,s,s': ['表侄'],
  'm,os,s,d': ['表侄女'],
  'm,ls,s,s': ['表侄'],
  'm,ls,s,d': ['表侄女'],
  
  // 妈妈的姐妹的女儿的儿子/女儿（表外甥）
  'm,os,d,s': ['表外甥'],
  'm,os,d,d': ['表外甥女'],
  'm,ls,d,s': ['表外甥'],
  'm,ls,d,d': ['表外甥女'],
  
  // 爸爸的姐妹的儿子/女儿（表亲）
  'f,os,s': ['表兄'],
  'f,os,d': ['表姐'],
  'f,ls,s': ['表兄'],
  'f,ls,d': ['表姐'],
  
  // 爸爸的姐妹的儿子的儿子/女儿（表侄）
  'f,os,s,s': ['表侄'],
  'f,os,s,d': ['表侄女'],
  'f,ls,s,s': ['表侄'],
  'f,ls,s,d': ['表侄女'],
  
  // 爸爸的姐妹的女儿的儿子/女儿（表外甥）
  'f,os,d,s': ['表外甥'],
  'f,os,d,d': ['表外甥女'],
  'f,ls,d,s': ['表外甥'],
  'f,ls,d,d': ['表外甥女'],
  
  // ========== 远代表亲（向上辈分）- 来自电子家谱 ==========
  // 妈妈的妈妈的姐妹（姨祖母）
  'm,m,os': ['姨祖母'],
  'm,m,ls': ['姨祖母'],
  'm,m,os,h': ['姨祖父'],
  'm,m,ls,h': ['姨祖父'],
  
  // 妈妈的妈妈的姐妹的儿子/女儿（表舅/表姨）
  'm,m,os,s': ['表舅'],
  'm,m,os,d': ['表姨'],
  'm,m,ls,s': ['表舅'],
  'm,m,ls,d': ['表姨'],
  
  // 爸爸的妈妈的姐妹（姨祖母）
  'f,m,os': ['姨祖母'],
  'f,m,ls': ['姨祖母'],
  'f,m,os,h': ['姨祖父'],
  'f,m,ls,h': ['姨祖父'],
  
  // 爸爸的妈妈的姐妹的儿子/女儿（表叔/表姑）
  'f,m,os,s': ['表叔'],
  'f,m,os,d': ['表姑'],
  'f,m,ls,s': ['表叔'],
  'f,m,ls,d': ['表姑'],
  
  // 爸爸的妈妈的兄弟（舅祖父）
  'f,m,ob': ['舅祖父'],
  'f,m,lb': ['舅祖父'],
  'f,m,ob,w': ['舅祖母'],
  'f,m,lb,w': ['舅祖母'],
  
  // 爸爸的妈妈的兄弟的儿子/女儿（表叔/表姑）
  'f,m,ob,s': ['表叔'],
  'f,m,ob,d': ['表姑'],
  'f,m,lb,s': ['表叔'],
  'f,m,lb,d': ['表姑'],
  
  // ========== 妻子的爸爸的妈妈的亲属（模式 0i）==========
  'w,f,m,os': ['姨祖母'],
  'w,f,m,ls': ['姨祖母'],
  'w,f,m,os,h': ['姨祖父'],
  'w,f,m,ls,h': ['姨祖父'],
  'w,f,m,os,s': ['表叔'],
  'w,f,m,os,d': ['表姑'],
  'w,f,m,ls,s': ['表叔'],
  'w,f,m,ls,d': ['表姑'],
  
  // ========== 丈夫的妈妈的亲属（模式 0j，女性视角）==========
  'h,m,os,s': ['表侄'],
  'h,m,os,d': ['表侄女'],
  'h,m,ls,s': ['表侄'],
  'h,m,ls,d': ['表侄女'],
  'h,m,ob,s': ['表侄'],
  'h,m,ob,d': ['表侄女'],
  'h,m,lb,s': ['表侄'],
  'h,m,lb,d': ['表侄女']
};

// ES5 兼容的 includes 实现
function includes(arr, value) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === value) return true;
  }
  return false;
}

// ES5 兼容的 endsWith 实现
function endsWith(str, suffix) {
  if (!str || !suffix) return false;
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// ES5 兼容的数组去重
function uniqueArray(arr) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    if (result.indexOf(arr[i]) === -1) {
      result.push(arr[i]);
    }
  }
  return result;
}

// 反向关系数据（她/他称呼我）- 来自电子家谱已验证逻辑
var reverseData = {
  // 基础反向
  'f': ['儿子', '女儿'],
  'm': ['儿子', '女儿'],
  'h': ['妻子'],
  'w': ['丈夫'],
  's': ['爸爸', '妈妈'],
  's,w': ['公公', '婆婆'],
  'd': ['爸爸', '妈妈'],
  'd,h': ['岳父', '岳母'],
  'ob': ['弟弟', '妹妹'],
  'ob,w': ['小叔子', '小姑子'],
  'lb': ['哥哥', '姐姐'],
  'lb,w': ['大伯哥', '大姑姐'],
  'os': ['弟弟', '妹妹'],  // v43修复：姐姐称呼我=弟弟(男)/妹妹(女)
  'os,h': ['小舅子', '小姨子'],
  'ls': ['哥哥', '姐姐'],
  'ls,h': ['大伯哥', '大姨姐'],
  
  // 祖父母反向
  'f,f': ['孙子', '孙女'],
  'f,m': ['孙子', '孙女'],
  'm,f': ['外孙', '外孙女'],
  'm,m': ['外孙', '外孙女'],
  
  // 曾祖父母反向
  'f,f,f': ['曾孙', '曾孙女'],
  'f,f,m': ['曾孙', '曾孙女'],
  'f,m,f': ['曾外孙', '曾外孙女'],
  'f,m,m': ['曾外孙', '曾外孙女'],
  'm,f,f': ['外曾孙', '外曾孙女'],
  'm,f,m': ['外曾孙', '外曾孙女'],
  'm,m,f': ['外曾外孙', '外曾外孙女'],
  'm,m,m': ['外曾外孙', '外曾外孙女'],
  
  // 高祖父母反向
  'f,f,f,f': ['玄孙', '玄孙女'],
  'f,f,f,m': ['玄孙', '玄孙女'],
  'f,f,m,f': ['玄外孙', '玄外孙女'],
  'f,f,m,m': ['玄外孙', '玄外孙女'],
  
  // 伯叔姑反向
  'f,ob': ['侄子', '侄女'],
  'f,lb': ['侄子', '侄女'],
  'f,xs': ['侄子', '侄女'],
  'f,ob,w': ['侄子', '侄女'],
  'f,lb,w': ['侄子', '侄女'],
  'f,xs,h': ['侄子', '侄女'],
  
  // 舅姨反向
  'm,xb': ['外甥', '外甥女'],
  'm,xs': ['外甥', '外甥女'],
  'm,xb,w': ['外甥', '外甥女'],
  'm,xs,h': ['外甥', '外甥女'],
  'm,os': ['外甥', '外甥女'],  // 妈妈的姐姐反向：姨妈称呼我
  'm,ls': ['外甥', '外甥女'],  // 妈妈的妹妹反向：姨妈称呼我
  'm,m,ob': ['外甥孙'],  // 妈妈的妈妈的哥哥反向：舅公称呼我
  'm,m,lb': ['外甥孙'],  // 妈妈的妈妈的弟弟反向：舅公称呼我
  'm,m,os': ['外甥孙'],  // 妈妈的妈妈的姐姐反向：舅公称呼我
  'm,m,ls': ['外甥孙'],  // 妈妈的妈妈的妹妹反向：舅公称呼我
  'xs,h': ['舅子', '兄弟'],  // v3: 姐妹的丈夫反向 = 舅子/兄弟
  'xs,w': ['舅子', '兄弟'],  // v3: 姐妹的妻子反向 = 舅子/兄弟
  'm,ob,s': ['表兄弟'],  // v3: 妈妈的哥哥的儿子反向 = 表兄弟
  'm,lb,s': ['表兄弟'],  // v3: 妈妈的弟弟的儿子反向 = 表兄弟
  'm,ob,d': ['表姐妹'],  // v3: 妈妈的哥哥的女儿反向 = 表姐妹
  'm,lb,d': ['表姐妹'],  // v3: 妈妈的弟弟的女儿反向 = 表姐妹
  
  // 兄弟姐妹反向
  'xb': ['哥哥', '弟弟', '姐姐', '妹妹'],
  'xs': ['哥哥', '弟弟', '姐姐', '妹妹'],
  'ob': ['弟弟', '妹妹'],
  'lb': ['哥哥', '姐姐'],
  'os': ['妹妹', '弟弟'],
  'ls': ['哥哥', '姐姐'],
  
  // 兄弟姐妹的子女反向
  'xb,s': ['叔叔', '姑姑'],
  'xb,d': ['叔叔', '姑姑'],
  'xs,s': ['舅舅', '姨妈'],
  'xs,d': ['舅舅', '姨妈'],
  'ob,s': ['伯父', '姑姑'],  // v43修复：哥哥的儿子称呼我=伯父(男)/姑姑(女)
  'ob,d': ['伯父', '姑姑'],  // v43修复：哥哥的女儿称呼我=伯父(男)/姑姑(女)
  'lb,s': ['伯父/叔父', '姑姑'],  // v43修复：弟弟的儿子称呼我=伯父/叔父(男)/姑姑(女)
  'lb,d': ['伯父/叔父', '姑姑'],  // v43修复：弟弟的女儿称呼我=伯父/叔父(男)/姑姑(女)
  'os,s': ['舅舅', '姨妈'],
  'os,d': ['舅舅', '姨妈'],
  'ls,s': ['伯父/叔父', '姑姑'],  // v43修复：妹妹的儿子称呼我=伯父/叔父(男)/姑姑(女)
  'ls,d': ['伯父/叔父', '姑姑'],  // v43修复：妹妹的女儿称呼我=伯父/叔父(男)/姑姑(女)
  
  // 兄弟姐妹之间的反向（v43 新增：对方称呼我）
  'ob,os': ['弟弟', '妹妹'],  // 哥哥的姐姐称呼我
  'ob,ls': ['弟弟/哥哥', '妹妹/姐姐'],  // 哥哥的妹妹称呼我
  'os,ob': ['弟弟', '妹妹'],  // 姐姐的哥哥称呼我
  'os,lb': ['弟弟/哥哥', '妹妹/姐姐'],  // 姐姐的弟弟称呼我
  'lb,os': ['弟弟/哥哥', '妹妹/姐姐'],  // 弟弟的姐姐称呼我
  'lb,ls': ['哥哥', '姐姐'],  // 弟弟的妹妹称呼我
  // 兄弟姐妹的兄弟姐妹的子女反向（v43 新增）
  'ob,os,s': ['舅舅', '姨妈'],  // 哥哥的姐姐的儿子称呼我
  'ob,os,d': ['舅舅', '姨妈'],  // 哥哥的姐姐的女儿称呼我
  'ob,ls,s': ['舅舅', '姨妈'],  // 哥哥的妹妹的儿子称呼我
  'ob,ls,d': ['舅舅', '姨妈'],  // 哥哥的妹妹的女儿称呼我
  'os,ob,s': ['伯父', '姑姑'],  // 姐姐的哥哥的儿子称呼我
  'os,ob,d': ['伯父', '姑姑'],  // 姐姐的哥哥的女儿称呼我
  'os,lb,s': ['伯父/叔父', '姑姑'],  // 姐姐的弟弟的儿子称呼我
  'os,lb,d': ['伯父/叔父', '姑姑'],  // 姐姐的弟弟的女儿称呼我
  'lb,os,s': ['舅舅', '姨妈'],  // 弟弟的姐姐的儿子称呼我
  'lb,os,d': ['舅舅', '姨妈'],  // 弟弟的姐姐的女儿称呼我
  'lb,ls,s': ['伯父/叔父', '姑姑'],  // 弟弟的妹妹的儿子称呼我
  'lb,ls,d': ['伯父/叔父', '姑姑'],  // 弟弟的妹妹的女儿称呼我
  
  // 兄弟姐妹的孙辈反向
  'xb,s,s': ['侄子', '侄女'],
  'xb,s,d': ['侄子', '侄女'],
  'xb,d,s': ['侄子', '侄女'],
  'xb,d,d': ['侄子', '侄女'],
  'xs,s,s': ['外甥', '外甥女'],
  'xs,s,d': ['外甥', '外甥女'],
  'xs,d,s': ['外甥', '外甥女'],
  'xs,d,d': ['外甥', '外甥女'],
  'ob,s,s': ['侄子', '侄女'],
  'ob,s,d': ['侄子', '侄女'],
  'ob,d,s': ['侄子', '侄女'],
  'ob,d,d': ['侄子', '侄女'],
  'lb,s,s': ['侄子', '侄女'],
  'lb,s,d': ['侄子', '侄女'],
  'lb,d,s': ['侄子', '侄女'],
  'lb,d,d': ['侄子', '侄女'],
  'os,s,s': ['外甥孙'],
  'os,s,d': ['外甥孙女'],
  'os,d,s': ['外甥孙'],
  'os,d,d': ['外甥孙女'],
  'ls,s,s': ['侄子', '侄女'],
  'ls,s,d': ['侄子', '侄女'],
  'ls,d,s': ['侄子', '侄女'],
  'ls,d,d': ['侄子', '侄女'],
  
  // 配偶父母反向（关键修复）
  'w,f': ['女婿'],
  'w,m': ['女婿'],
  'h,f': ['儿媳'],
  'h,m': ['儿媳'],
  'h,f,f': ['孙媳'],
  'h,f,m': ['孙媳'],
  'h,m,f': ['孙媳'],
  'h,m,m': ['孙媳'],
  'h,f,f,f': ['曾孙媳'],
  'h,f,f,f,f': ['玄孙媳'],
  
  // 配偶方反向 - 妻子的亲属称呼我
  'w,os': ['妹夫', '连襟'],
  'w,ls': ['姐夫', '连襟'],
  'w,lb': ['姐夫', '姑爷'],
  'w,xb': ['姐夫', '姑爷'],
  
  // 妻子的姐妹的子女称呼我
  'w,os,s': ['姨父', '姨丈'],
  'w,os,d': ['姨父', '姨丈'],
  'w,ls,s': ['姨父', '姨丈'],
  'w,ls,d': ['姨父', '姨丈'],
  
  // 妻子的姐妹的孙辈称呼我
  'w,os,s,s': ['姨外公', '姨公'],
  'w,os,s,d': ['姨外公', '姨公'],
  'w,os,d,s': ['姨外公', '姨公'],
  'w,os,d,d': ['姨外公', '姨公'],
  'w,ls,s,s': ['姨外公', '姨公'],
  'w,ls,s,d': ['姨外公', '姨公'],
  'w,ls,d,s': ['姨外公', '姨公'],
  'w,ls,d,d': ['姨外公', '姨公'],
  
  // 妻子的姐妹的曾孙辈称呼我
  'w,os,s,s,s': ['姨曾外祖父'],
  'w,os,s,d,s': ['姨曾外祖父'],
  'w,os,d,s,s': ['姨曾外祖父'],
  'w,os,d,d,s': ['姨曾外祖父'],
  
  // 妻子的姐妹的玄孙辈称呼我
  'w,os,s,s,s,s': ['姨高外祖父'],
  
  // 妻子的兄弟的子女称呼我
  'w,lb,s': ['姨父', '姨丈'],
  'w,lb,d': ['姨父', '姨丈'],
  'w,xb,s': ['姨父', '姨丈'],
  'w,xb,d': ['姨父', '姨丈'],
  
  // 妻子的兄弟的孙辈称呼我
  'w,lb,s,s': ['姨外公', '姨公'],
  'w,lb,s,d': ['姨外公', '姨公'],
  'w,lb,d,s': ['姨外公', '姨公'],
  'w,lb,d,d': ['姨外公', '姨公'],
  'w,xb,s,s': ['姨外公', '姨公'],
  'w,xb,s,d': ['姨外公', '姨公'],
  'w,xb,d,s': ['姨外公', '姨公'],
  'w,xb,d,d': ['姨外公', '姨公'],
  
  // 妻子的兄弟的曾孙辈称呼我
  'w,lb,s,s,s': ['姨曾外祖父'],
  'w,xb,s,s,s': ['姨曾外祖父'],
  
  // 妻子的兄弟的玄孙辈称呼我
  'w,lb,s,s,s,s': ['姨高外祖父'],
  'w,xb,s,s,s,s': ['姨高外祖父'],
  
  // 丈夫方反向 - 丈夫的亲属称呼我（女性用户）
  'h,ob': ['弟媳', '弟妹'],
  'h,lb': ['嫂子', '嫂嫂'],
  'h,os': ['弟媳', '弟妹'],
  'h,ls': ['嫂子', '嫂嫂'],
  
  // 丈夫的兄弟姐妹的子女称呼我
  'h,ob,s': ['伯母', '大妈'],
  'h,ob,d': ['伯母', '大妈'],
  'h,lb,s': ['婶婶', '婶母'],
  'h,lb,d': ['婶婶', '婶母'],
  'h,os,s': ['姑妈', '姑姑'],
  'h,os,d': ['姑妈', '姑姑'],
  'h,ls,s': ['姑妈', '姑姑'],
  'h,ls,d': ['姑妈', '姑姑'],
  
  // 丈夫的父母反向
  'h,f,f': ['孙媳'],
  'h,f,m': ['孙媳'],
  'h,m,f': ['孙媳'],
  'h,m,m': ['孙媳'],
  
  // 丈夫的爸爸的爸爸反向
  'h,f,f': ['孙媳'],
  'h,f,f,f': ['曾孙媳'],
  'h,f,f,f,f': ['玄孙媳'],
  
  // 孙辈反向
  's,s': ['爷爷', '奶奶'],
  's,d': ['爷爷', '奶奶'],
  's,s,w': ['爷爷', '奶奶'],
  's,d,h': ['爷爷', '奶奶'],
  'd,s': ['外公', '外婆'],
  'd,d': ['外公', '外婆'],
  'd,s,w': ['外公', '外婆'],
  'd,d,h': ['外公', '外婆'],
  
  // 曾孙辈反向
  's,s,s': ['曾祖父', '曾祖母'],
  's,s,d': ['曾祖父', '曾祖母'],
  's,d,s': ['曾外祖父', '曾外祖母'],
  's,d,d': ['曾外祖父', '曾外祖母'],
  'd,s,s': ['外曾祖父', '外曾祖母'],
  'd,s,d': ['外曾祖父', '外曾祖母'],
  'd,d,s': ['外曾外祖父', '外曾外祖母'],
  'd,d,d': ['外曾外祖母'],
  
  // 玄孙辈反向
  's,s,s,s': ['高祖父', '高祖母'],
  's,s,s,d': ['高祖父', '高祖母'],
  
  // ========== 模式 9 反向：孙子的妻子的父母反向（v711-51-fix-v70 新增）==========
  // 从姻侄的视角：我称呼他为姻侄，他称呼我 = 女儿的丈夫的长辈
  // v711-51-fix-v82 修复：女儿的丈夫的爸爸称呼我 = 亲家公（非姻伯父）
  'd,h,f': ['亲家公'],
  'd,h,m': ['亲家母'],
  'd,h,f,f': ['姻祖父'],
  'd,h,f,m': ['姻祖母'],
  'd,h,m,f': ['姻外祖父'],
  'd,h,m,m': ['姻外祖母'],
  'd,h,f,f,f': ['姻曾祖父'],
  'd,h,f,f,m': ['姻曾祖母'],
  
  // ========== 孙子的妻子的兄弟姐妹反向（v711-51-fix-v70 新增）==========
  // 从姻舅/姻姨的视角：我称呼他/她为姻舅/姻姨，他/她称呼我 = 妹妹/姐姐的丈夫的爸爸
  'ls,h,f': ['姻伯父'],
  'ls,h,m': ['姻伯母'],
  'os,h,f': ['姻伯父'],
  'os,h,m': ['姻伯母'],
  'ls,h,f,f': ['姻祖父'],
  'os,h,f,f': ['姻祖父'],
  
  // 侄子/外甥反向
  'xb,s': ['伯伯', '叔叔', '姑姑'],
  'xb,d': ['伯伯', '叔叔', '姑姑'],
  'xs,s': ['舅舅', '姨妈'],
  'xs,d': ['舅舅', '姨妈'],
  
  // 侄孙/外甥孙反向
  'xb,s,s': ['伯祖父', '叔祖父', '姑奶奶'],
  'xb,s,d': ['伯祖父', '叔祖父', '姑奶奶'],
  'xs,s,s': ['舅公', '姨婆'],
  'xs,s,d': ['舅公', '姨婆'],
  
  // ========== 新增反向关系（来自家族树 v711-51-fix-v65）==========
  // 妻子的兄弟姐妹的配偶反向
  'w,os,h': ['连襟', '妹夫'],
  'w,ls,h': ['连襟', '姐夫'],
  
  // 妻子的兄弟的妻子的亲属反向
  'w,lb,w': ['大伯哥', '大姑姐'],
  'w,ob,w': ['小叔子', '小姑子'],
  
  // 妻子的姐妹的丈夫的亲属反向
  'w,os,h,f': ['连襟'],
  'w,os,h,m': ['连襟'],
  'w,ls,h,f': ['连襟'],
  'w,ls,h,m': ['连襟'],
  
  // 妈妈的弟弟的妻子的亲属反向
  'm,lb,w': ['外甥', '外甥女'],
  'm,lb,w,s': ['表兄弟'],
  'm,lb,w,d': ['表姐妹'],
  
  // 妈妈的妹妹的丈夫的亲属反向
  'm,ls,h': ['外甥', '外甥女'],
  'm,ls,h,s': ['表兄弟'],
  'm,ls,h,d': ['表姐妹'],
  
  // 丈夫的妈妈的亲属反向（女性视角）
  'h,m': ['儿媳'],
  'h,m,os': ['儿媳'],
  'h,m,ls': ['儿媳'],
  'h,m,os,d': ['表侄女'],
  'h,m,os,s': ['表侄'],
  
  // 妻子的妈妈的亲属反向（男性视角）
  'w,m': ['女婿'],
  'w,m,os': ['女婿'],
  'w,m,ls': ['女婿'],
  'w,m,os,d': ['表侄女'],
  'w,m,os,s': ['表侄'],
  
  // 爸爸的妈妈的亲属反向
  'f,m': ['孙媳妇'],
  'f,m,os': ['孙媳妇'],
  'f,m,ls': ['孙媳妇'],
  'f,m,os,d': ['表侄孙女'],
  'f,m,os,s': ['表侄孙'],
  
  // 姐妹的丈夫的亲属反向
  'os,h': ['连襟'],
  'ls,h': ['连襟'],
  'os,h,s': ['姻侄'],
  'os,h,d': ['姻侄女'],
  'ls,h,s': ['姻侄'],
  'ls,h,d': ['姻侄女'],
  // v711-51-fix-v82 修复：女性的妹妹的丈夫的爸爸称呼她 = 姻侄女（非姻侄）
  // 格式：[男性称谓，女性称谓]
  'os,h,f': ['姻侄', '姻侄女'],
  'os,h,m': ['姻侄', '姻侄女'],
  'ls,h,f': ['姻侄', '姻侄女'],
  'ls,h,m': ['姻侄', '姻侄女'],
  
  // 女儿的丈夫的亲属反向
  'd,h': ['岳父', '岳母'],
  // v711-51-fix-v82 修复：女儿的丈夫的哥哥/姐姐称呼我 = 姻伯（非连襟）
  'd,h,ob': ['姻伯'],
  'd,h,os': ['姻伯'],
  
  // 儿子的妻子的亲属反向
  's,w': ['公公', '婆婆'],
  's,w,os': ['伯父', '伯母'],  // 儿媳的姐姐称呼公公/婆婆
  's,w,ls': ['伯父', '伯母'],  // 儿媳的妹妹称呼公公/婆婆
  
  // 孙子的妻子的亲属反向（v76 新增）
  's,s,w,os': ['姻祖父', '姻祖母'],  // 孙媳的姐姐称呼我
  's,s,w,ls': ['姻祖父', '姻祖母'],  // 孙媳的妹妹称呼我
  
  // ========== 新增：表系列反向关系（来自电子家谱）==========
  // 表侄/表外甥反向
  'm,os,s': ['表姑', '表舅'],
  'm,os,d': ['表姑', '表舅'],
  'm,ls,s': ['表姑', '表舅'],
  'm,ls,d': ['表姑', '表舅'],
  'f,os,s': ['表姑', '表伯叔'],
  'f,os,d': ['表姑', '表伯叔'],
  'f,ls,s': ['表姑', '表伯叔'],
  'f,ls,d': ['表姑', '表伯叔'],
  
  // 表侄孙反向
  'm,os,s,s': ['表侄孙'],
  'm,os,s,d': ['表侄孙女'],
  'f,os,s,s': ['表侄孙'],
  'f,os,s,d': ['表侄孙女'],
  
  // 表外甥反向
  'm,os,d,s': ['表外甥'],
  'm,os,d,d': ['表外甥女'],
  'f,os,d,s': ['表外甥'],
  'f,os,d,d': ['表外甥女'],
  
  // ========== 新增：姻系列反向关系（来自电子家谱）==========
  // 注：姐妹的丈夫的亲属反向已在上面定义（带性别区分），此处不再重复
  
  // 姐妹的丈夫的兄弟姐妹反向
  'os,h,ob': ['姻兄'],
  'os,h,lb': ['姻弟'],
  'os,h,os': ['姻姐'],
  'os,h,ls': ['姻妹'],
  
  // 妻子的爸爸的妈妈的亲属反向
  'w,f,m,os': ['表侄'],
  'w,f,m,ls': ['表侄'],
  'w,f,m,os,s': ['表侄孙'],
  'w,f,m,os,d': ['表侄孙女'],
  
  // ========== 新增：模式 0k 系列反向关系 ==========
  // 丈夫的爸爸的爸爸的兄弟反向
  'h,f,f,ob': ['侄孙'],
  'h,f,f,lb': ['侄孙'],
  'h,f,f,ob,w': ['侄孙媳'],
  'h,f,f,lb,w': ['侄孙媳'],
  
  // 丈夫的爸爸的爸爸的兄弟的子女反向
  'h,f,f,ob,s': ['堂侄'],
  'h,f,f,lb,s': ['堂侄'],
  'h,f,f,ob,d': ['堂侄女'],
  'h,f,f,lb,d': ['堂侄女'],
  
  // 妻子的爸爸的爸爸的兄弟姐妹反向
  'w,f,f,ob': ['侄孙'],
  'w,f,f,lb': ['侄孙'],
  'w,f,f,os': ['侄孙'],
  'w,f,f,ls': ['侄孙'],
  'w,f,f,ob,s': ['堂侄'],
  'w,f,f,lb,s': ['堂侄'],
  'w,f,f,os,s': ['表侄'],
  'w,f,f,ls,s': ['表侄'],
  'w,f,f,ob,d': ['堂侄女'],
  'w,f,f,lb,d': ['堂侄女'],
  'w,f,f,os,d': ['表侄女'],
  'w,f,f,ls,d': ['表侄女'],
  
  // 丈夫的爸爸的妈妈的兄弟反向
  'h,f,m,ob': ['表侄'],
  'h,f,m,lb': ['表侄'],
  'h,f,m,ob,s': ['表侄'],
  'h,f,m,lb,s': ['表侄'],
  'h,f,m,ob,d': ['表侄女'],
  'h,f,m,lb,d': ['表侄女'],
  
  // 爸爸的兄弟的子女反向（堂亲系列）
  'f,ob,s': ['堂兄弟'],
  'f,lb,s': ['堂兄弟'],
  'f,ob,d': ['堂姐妹'],
  'f,lb,d': ['堂姐妹'],
  'f,ob,s,w': ['堂兄弟媳'],
  'f,lb,s,w': ['堂兄弟媳'],
  'f,ob,d,h': ['堂姐妹夫'],
  'f,lb,d,h': ['堂姐妹夫'],
  
  // 爸爸的兄弟的孙辈反向
  'f,ob,s,s': ['堂侄'],
  'f,lb,s,s': ['堂侄'],
  'f,ob,s,d': ['堂侄女'],
  'f,lb,s,d': ['堂侄女'],
  'f,ob,d,s': ['堂外甥'],
  'f,lb,d,s': ['堂外甥'],
  'f,ob,d,d': ['堂外甥女'],
  'f,lb,d,d': ['堂外甥女']
};

// 中文称谓到关系代码的映射
const chineseToCode = {
  '爸爸': 'f', '父亲': 'f',
  '妈妈': 'm', '母亲': 'm',
  '丈夫': 'h', '老公': 'h',
  '妻子': 'w', '老婆': 'w',
  '儿子': 's',
  '女儿': 'd',
  '哥哥': 'ob', '兄长': 'ob',
  '弟弟': 'lb', '兄弟': 'lb',
  '姐姐': 'os', '姊姊': 'os',
  '妹妹': 'ls',
  '爷爷': 'f,f', '祖父': 'f,f',
  '奶奶': 'f,m', '祖母': 'f,m',
  '外公': 'm,f', '姥爷': 'm,f',
  '外婆': 'm,m', '姥姥': 'm,m',
  '伯父': 'f,ob', '伯伯': 'f,ob',
  '叔叔': 'f,lb', '叔父': 'f,lb',
  '姑姑': 'f,xs', '姑妈': 'f,xs',
  '舅舅': 'm,xb', '舅父': 'm,xb',
  '姨妈': 'm,xs', '姨母': 'm,xs',
  '侄子': 'xb,s', '侄儿': 'xb,s',
  '侄女': 'xb,d',
  '外甥': 'xs,s',
  '外甥女': 'xs,d',
  '孙子': 's,s', '孙儿': 's,s',
  '孙女': 's,d',
  '外孙': 'd,s',
  '外孙女': 'd,d',
  '曾孙': 's,s,s',
  '曾孙女': 's,s,d',
  '外曾孙': 'd,s,s',
  '外曾孙女': 'd,s,d'
};

// 关系链解析
function parseChain(chain) {
  if (!chain || chain.length === 0) return '';
  var codes = [];
  for (var i = 0; i < chain.length; i++) {
    var item = chain[i];
    if (item === '我') continue;
    var code = chineseToCode[item];
    if (code) {
      codes.push(code);
    }
  }
  return codes.join(',');
}

// 简化关系链（v703-15 修复版 + 兄弟姐妹全组合修复）- 只简化血缘关系，不简化姻亲关系
// 关键修复1：循环迭代直到关系链稳定，不再只做单次遍历（解决 ob,os,ls 三连链断裂问题）
// 关键修复2：补全所有缺失的兄弟姐妹组合（14条新规则）
function simplifyChain(codes) {
  // 循环迭代：最多10次，直到关系链不再变化
  var prevStr = codes.join(',');
  for (var iter = 0; iter < 10; iter++) {
    var simplified = [];
    var i = 0;
    while (i < codes.length) {
      var code = codes[i];
      
      // 兄弟/姐妹的妈妈 = 妈妈（血缘关系可简化）
      if ((code === 'xb' || code === 'ob' || code === 'lb' || code === 'xs' || code === 'os' || code === 'ls') && i + 1 < codes.length && codes[i + 1] === 'm') {
        simplified.push('m');
        i += 2;
        continue;
      }
      // 兄弟/姐妹的爸爸 = 爸爸（血缘关系可简化）
      if ((code === 'xb' || code === 'ob' || code === 'lb' || code === 'xs' || code === 'os' || code === 'ls') && i + 1 < codes.length && codes[i + 1] === 'f') {
        simplified.push('f');
        i += 2;
        continue;
      }
      // 妻子的妈妈 = 岳母（不简化，因为 mainData 中有 w,m = 岳母）
      // 妻子的爸爸 = 岳父（不简化，因为 mainData 中有 w,f = 岳父）
      // 妈妈的丈夫 = 爸爸
      if (code === 'm' && i + 1 < codes.length && codes[i + 1] === 'h') {
        simplified.push('f');
        i += 2;
        continue;
      }
      // 爸爸的妻子 = 妈妈
      if (code === 'f' && i + 1 < codes.length && codes[i + 1] === 'w') {
        simplified.push('m');
        i += 2;
        continue;
      }
      // v703-15 关键修复：妻子的姐妹/兄弟 不再简化！
      // 因为 mainData 中有明确的 w,os = 大姨姐，w,ls = 小姨子，w,xb = 小舅子
      // 简化会导致 w,os,s,s,s,s 变成 os,s,s,s,s 匹配不到
      
      // ========== 兄弟姐妹之间的简化规则 ==========
      // 【已有6条】
      // 哥哥的姐姐 = 姐姐（可以确定）
      if (code === 'ob' && i + 1 < codes.length && codes[i + 1] === 'os') {
        simplified.push('os');
        i += 2;
        continue;
      }
      // 哥哥的妹妹 = 姐妹统称（无法判断与我的长幼）
      if (code === 'ob' && i + 1 < codes.length && codes[i + 1] === 'ls') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 姐姐的哥哥 = 哥哥（可以确定）
      if (code === 'os' && i + 1 < codes.length && codes[i + 1] === 'ob') {
        simplified.push('ob');
        i += 2;
        continue;
      }
      // 姐姐的弟弟 = 兄弟统称（无法判断与我的长幼）
      if (code === 'os' && i + 1 < codes.length && codes[i + 1] === 'lb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 弟弟的姐姐 = 姐妹统称（无法判断与我的长幼）
      if (code === 'lb' && i + 1 < codes.length && codes[i + 1] === 'os') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 弟弟的妹妹 = 妹妹（可以确定）
      if (code === 'lb' && i + 1 < codes.length && codes[i + 1] === 'ls') {
        simplified.push('ls');
        i += 2;
        continue;
      }
      
      // 【新增8条】补全所有缺失的兄弟姐妹组合
      // 姐姐的姐姐 = 姐姐（可以确定）
      if (code === 'os' && i + 1 < codes.length && codes[i + 1] === 'os') {
        simplified.push('os');
        i += 2;
        continue;
      }
      // 哥哥的哥哥 = 哥哥（可以确定）
      if (code === 'ob' && i + 1 < codes.length && codes[i + 1] === 'ob') {
        simplified.push('ob');
        i += 2;
        continue;
      }
      // 姐姐的妹妹 = 姐妹统称（无法判断与我的长幼）
      if (code === 'os' && i + 1 < codes.length && codes[i + 1] === 'ls') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 弟弟的哥哥 = 兄弟统称（无法判断与我的长幼）
      if (code === 'lb' && i + 1 < codes.length && codes[i + 1] === 'ob') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 哥哥的弟弟 = 兄弟统称（无法判断与我的长幼）
      if (code === 'ob' && i + 1 < codes.length && codes[i + 1] === 'lb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 妹妹的姐姐 = 姐妹统称（无法判断与我的长幼）
      if (code === 'ls' && i + 1 < codes.length && codes[i + 1] === 'os') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 妹妹的妹妹 = 妹妹（可以确定）
      if (code === 'ls' && i + 1 < codes.length && codes[i + 1] === 'ls') {
        simplified.push('ls');
        i += 2;
        continue;
      }
      // 妹妹的弟弟 = 兄弟统称（无法判断与我的长幼）
      if (code === 'ls' && i + 1 < codes.length && codes[i + 1] === 'lb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 妹妹的哥哥 = 兄弟统称（无法判断与我的长幼）
      if (code === 'ls' && i + 1 < codes.length && codes[i + 1] === 'ob') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 弟弟的弟弟 = 弟弟（可以确定）
      if (code === 'lb' && i + 1 < codes.length && codes[i + 1] === 'lb') {
        simplified.push('lb');
        i += 2;
        continue;
      }
      
      // 【统称+统称规则】
      // 姐妹统称的姐妹 = 姐妹统称
      if (code === 'xs' && i + 1 < codes.length && codes[i + 1] === 'xs') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 兄弟统称的兄弟 = 兄弟统称
      if (code === 'xb' && i + 1 < codes.length && codes[i + 1] === 'xb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 姐妹统称的姐姐 = 姐妹统称（无法判断长幼）
      if (code === 'xs' && i + 1 < codes.length && codes[i + 1] === 'os') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 姐妹统称的妹妹 = 姐妹统称（无法判断长幼）
      if (code === 'xs' && i + 1 < codes.length && codes[i + 1] === 'ls') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 姐妹统称的哥哥 = 兄弟统称
      if (code === 'xs' && i + 1 < codes.length && codes[i + 1] === 'ob') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 姐妹统称的弟弟 = 兄弟统称
      if (code === 'xs' && i + 1 < codes.length && codes[i + 1] === 'lb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 兄弟统称的姐姐 = 姐妹统称
      if (code === 'xb' && i + 1 < codes.length && codes[i + 1] === 'os') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 兄弟统称的妹妹 = 姐妹统称
      if (code === 'xb' && i + 1 < codes.length && codes[i + 1] === 'ls') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 兄弟统称的哥哥 = 兄弟统称
      if (code === 'xb' && i + 1 < codes.length && codes[i + 1] === 'ob') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 兄弟统称的弟弟 = 兄弟统称
      if (code === 'xb' && i + 1 < codes.length && codes[i + 1] === 'lb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      
      // 【新增8条：具体+统称】补全所有遗漏的兄弟姐妹组合
      // 姐姐的姐妹统称 = 姐妹统称
      if (code === 'os' && i + 1 < codes.length && codes[i + 1] === 'xs') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 姐姐的兄弟统称 = 兄弟统称
      if (code === 'os' && i + 1 < codes.length && codes[i + 1] === 'xb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 妹妹的姐妹统称 = 姐妹统称
      if (code === 'ls' && i + 1 < codes.length && codes[i + 1] === 'xs') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 妹妹的兄弟统称 = 兄弟统称
      if (code === 'ls' && i + 1 < codes.length && codes[i + 1] === 'xb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 哥哥的姐妹统称 = 姐妹统称
      if (code === 'ob' && i + 1 < codes.length && codes[i + 1] === 'xs') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 哥哥的兄弟统称 = 兄弟统称
      if (code === 'ob' && i + 1 < codes.length && codes[i + 1] === 'xb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      // 弟弟的姐妹统称 = 姐妹统称
      if (code === 'lb' && i + 1 < codes.length && codes[i + 1] === 'xs') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 弟弟的兄弟统称 = 兄弟统称
      if (code === 'lb' && i + 1 < codes.length && codes[i + 1] === 'xb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      
      // v711-51-fix-v2: 统称↔统称跨性别简化（修复"哥哥的弟弟的姐姐的妹妹"等混合链）
      // 兄弟统称的姐妹统称 = 姐妹统称
      if (code === 'xb' && i + 1 < codes.length && codes[i + 1] === 'xs') {
        simplified.push('xs');
        i += 2;
        continue;
      }
      // 姐妹统称的兄弟统称 = 兄弟统称
      if (code === 'xs' && i + 1 < codes.length && codes[i + 1] === 'xb') {
        simplified.push('xb');
        i += 2;
        continue;
      }
      
      simplified.push(code);
      i++;
    }
    
    // 检查是否稳定
    var currentStr = simplified.join(',');
    if (currentStr === prevStr) {
      break; // 关系链已稳定，不再迭代
    }
    prevStr = currentStr;
    codes = simplified;
  }
  return simplified;
}

// 计算称谓（主函数）- v71 完整重构版（使用通用计算）
function calculateRelation(chainStr, sex, reverse) {
  if (!chainStr || chainStr === '') return ['我'];
  
  // 反向称呼（对方称呼我）
  if (reverse) {
    return calculateReverseRelation(chainStr, sex);
  }
  
  // 简化关系链
  var codes = chainStr.split(',');
  var simplifiedCodes = simplifyChain(codes);
  var simplifiedChainStr = simplifiedCodes.join(',');
  
  console.log('原始关系链:', chainStr, '简化后:', simplifiedChainStr);
  
  // ========== v74 核心修复：优先使用精确数据匹配 ==========
  // 1. 首先尝试精确数据匹配（mainData 中有 200+ 种已验证称谓）
  var results = [];
  
  // v74 修复：先查原始关系链（更精确，含 / 分隔的统称），再查简化后的（兜底）
  if (mainData[chainStr]) {
    results = mainData[chainStr];
  }
  
  // 如果没找到，尝试简化后的关系链
  if (results.length === 0 && mainData[simplifiedChainStr]) {
    results = mainData[simplifiedChainStr];
  }
  
  // 2. 精确匹配未命中，尝试模糊匹配
  if (results.length === 0) {
    for (var key in mainData) {
      if (key === simplifiedChainStr || endsWith(key, ',' + simplifiedChainStr)) {
        var items = mainData[key];
        if (items && items.length > 0) {
          results = results.concat(items);
        }
      }
    }
  }
  
  // 3. 所有数据匹配都失败，使用通用计算作为后备
  if (results.length === 0) {
    var universalTitle = calculateUniversalTitle(simplifiedCodes, sex);
    if (universalTitle) {
      console.log('[通用计算] 关系链:', simplifiedChainStr, '称谓:', universalTitle);
      return [universalTitle];
    }
  }
  
  // 去重
  results = uniqueArray(results);
  
  // 返回第一个
  if (results.length > 0) {
    // 根据用户性别选择正确的称谓
    if (results.length >= 2 && sex === 0) {
      return [results[1]];
    }
    return [results[0]];
  }
  
  // 4. 所有方法都失败，使用旧版通用逻辑生成（后备）
  return generateRelationFromChain(codes, sex);
}

// 计算反向关系（对方称呼我）- v75 彻底修复版（使用正确的反向公式）
function calculateReverseRelation(chainStr, sex) {
  var codes = chainStr.split(',');
  
  console.log('反向关系计算 - 原始链:', chainStr, '用户性别:', sex);
  
  // v711-51-fix: 反向计算也使用简化链，解决兄弟姐妹链被误判为长辈的问题
  var simplifiedCodes = simplifyChain(codes.slice()); // 使用副本避免修改原数组
  var simplifiedChainStr = simplifiedCodes.join(',');
  console.log('[反向简化] 原始链:', chainStr, '→ 简化:', simplifiedChainStr);
  
  // ========== v75 核心修复：使用正确的反向公式（考虑起点性别）==========
  // 公式：R' = (Inv(r_n, g_{n-1}), Inv(r_{n-1}, g_{n-2}), ..., Inv(r_1, g_0))
  // 使用简化后的链推断性别
  var useCodes = simplifiedCodes;
  var genders = inferGendersFromChain(useCodes, sex);
  
  // 使用 reverseChain 函数计算反向关系链
  var reversedCodes = reverseChain(useCodes, genders);
  
  console.log('[反向转换] 简化链:', simplifiedChainStr, '反向链:', reversedCodes.join(','), '性别序列:', genders);
  
  // ========== 优先使用反向数据匹配 ==========
  // 1. 首先尝试原始链精确匹配（reverseData 中有已验证称谓）
  var results = [];
  if (reverseData[chainStr]) {
    results = reverseData[chainStr];
    console.log('[reverseData 精确匹配] chainStr =', chainStr, 'results =', results);
  }
  
  // 1b. 原始链未命中，尝试简化链匹配
  if (results.length === 0 && simplifiedChainStr !== chainStr) {
    if (reverseData[simplifiedChainStr]) {
      results = reverseData[simplifiedChainStr];
      console.log('[reverseData 简化链匹配] simplifiedChainStr =', simplifiedChainStr, 'results =', results);
    }
  }
  
  if (results.length === 0) {
    console.log('[reverseData 未命中] chainStr =', chainStr, 'simplifiedChainStr =', simplifiedChainStr);
  }
  
  // 2. 精确匹配未命中，尝试模糊匹配
  if (results.length === 0) {
    for (var key in reverseData) {
      if (key === chainStr || key === simplifiedChainStr || endsWith(key, ',' + chainStr) || endsWith(key, ',' + simplifiedChainStr)) {
        var items = reverseData[key];
        if (items && items.length > 0) {
          results = results.concat(items);
        }
      }
    }
  }
  
  // 3. 所有数据匹配都失败，使用通用计算作为后备
  if (results.length === 0) {
    var reverseTitle = calculateUniversalTitle(reversedCodes, sex);
    if (reverseTitle) {
      console.log('[通用反向计算] 称谓:', reverseTitle);
      return [reverseTitle];
    }
  }
  
  // 如果还是没找到，使用旧版通用逻辑生成（后备）
  if (results.length === 0) {
    return generateReverseRelationFromChain(useCodes, sex);
  }
  
  // 根据用户性别选择正确的称谓
  // results[0] = 男性称谓，results[1] = 女性称谓
  if (results.length >= 2 && sex === 0) {
    return [results[0]];  // 男性返回第一个称谓
  }
  if (results.length >= 2 && sex === 1) {
    return [results[1]];  // 女性返回第二个称谓
  }
  return [results[0]];
}

// 根据关系链推断性别序列 - v75 新增
// 输入：codes = 关系链数组 (如 ['f', 's']), mySex = 我的性别 (0=男，1=女)
// 输出：genders = 性别数组 (如 ['male', 'male', 'male']，包含我的性别和每个节点的性别)
function inferGendersFromChain(codes, mySex) {
  var genders = [];
  // 我的性别
  genders.push(mySex === 0 ? 'male' : 'female');
  
  // 根据关系链推断每个节点的性别
  for (var i = 0; i < codes.length; i++) {
    var code = codes[i];
    var gender = 'male'; // 默认男性
    
    if (code === 'f' || code === 'ob' || code === 'lb' || code === 's' || code === 'h') {
      gender = 'male';
    } else if (code === 'm' || code === 'os' || code === 'ls' || code === 'd' || code === 'w') {
      gender = 'female';
    }
    
    genders.push(gender);
  }
  
  return genders;
}

// 通用反向关系生成逻辑 - v703-15 扩展多代
function generateReverseRelationFromChain(codes, sex) {
  if (codes.length === 0) return ['我'];
  
  // 统计代际差
  var generationDiff = 0;
  for (var i = 0; i < codes.length; i++) {
    var code = codes[i];
    if (code === 'f' || code === 'm') generationDiff++;
    else if (code === 's' || code === 'd') generationDiff--;
  }
  
  // 妻子的父母 → 称呼我 = 女婿
  if (codes.length >= 2 && codes[0] === 'w' && (codes[1] === 'f' || codes[1] === 'm')) {
    return ['女婿'];
  }
  
  // 妻子的姐妹 → 称呼我 = 妹夫/姐夫
  if (codes.length >= 2 && codes[0] === 'w' && (codes[1] === 'os' || codes[1] === 'ls')) {
    return codes[1] === 'os' ? ['妹夫', '连襟'] : ['姐夫', '连襟'];
  }
  
  // 妻子的姐妹的子女 → 称呼我 = 姨父
  if (codes.length >= 3 && codes[0] === 'w' && (codes[1] === 'os' || codes[1] === 'ls') && (codes[2] === 's' || codes[2] === 'd')) {
    return ['姨父', '姨丈'];
  }
  
  // 妻子的姐妹的孙辈 → 称呼我 = 姨外公
  if (codes.length >= 4 && codes[0] === 'w' && (codes[1] === 'os' || codes[1] === 'ls')) {
    // 检查是否有后代代码（s/d）
    var hasDescendant = false;
    for (var i = 2; i < codes.length; i++) {
      if (codes[i] === 's' || codes[i] === 'd') { hasDescendant = true; break; }
    }
    if (hasDescendant) {
      // 有后代 = 晚辈称呼我 = 长辈称谓
      if (codes.length === 4) return ['姨外公', '姨公'];
      if (codes.length === 5) return ['姨曾外祖父'];
      if (codes.length >= 6) return ['姨高外祖父'];
    } else {
      // 无后代 = 同辈或长辈
      return ['姨外公', '姨公'];
    }
  }
  
  // 妻子的姐妹的曾孙辈 → 称呼我 = 姨曾外祖父（v703-23 修复）
  if (codes.length === 5 && codes[0] === 'w' && (codes[1] === 'os' || codes[1] === 'ls')) {
    return ['姨曾外祖父'];
  }
  
  // 妻子的姐妹的玄孙辈 → 称呼我 = 姨高外祖父（v703-23 修复）
  if (codes.length >= 6 && codes[0] === 'w' && (codes[1] === 'os' || codes[1] === 'ls')) {
    return ['姨高外祖父'];
  }
  
  // 妻子的兄弟的子女 → 称呼我 = 姨父
  if (codes.length >= 3 && codes[0] === 'w' && (codes[1] === 'xb' || codes[1] === 'lb') && (codes[2] === 's' || codes[2] === 'd')) {
    return ['姨父', '姨丈'];
  }
  
  // 妻子的兄弟的孙辈 → 称呼我 = 姨外公
  if (codes.length >= 4 && codes[0] === 'w' && (codes[1] === 'xb' || codes[1] === 'lb')) {
    return ['姨外公', '姨公'];
  }
  
  // 妻子的兄弟的曾孙辈 → 称呼我 = 姨曾外祖父
  if (codes.length >= 5 && codes[0] === 'w' && (codes[1] === 'xb' || codes[1] === 'lb')) {
    return ['姨曾外祖父'];
  }
  
  // 妻子的兄弟的玄孙辈 → 称呼我 = 姨高外祖父
  if (codes.length >= 6 && codes[0] === 'w' && (codes[1] === 'xb' || codes[1] === 'lb')) {
    return ['姨高外祖父'];
  }
  
  // 丈夫的父母 → 称呼我 = 儿媳
  if (codes.length >= 2 && codes[0] === 'h' && (codes[1] === 'f' || codes[1] === 'm')) {
    return ['儿媳'];
  }
  
  // 丈夫的兄弟姐妹的祖先 = 丈夫的祖先（v703-29 修复）
  if (codes.length >= 2 && codes[0] === 'h' && (codes[1] === 'ob' || codes[1] === 'lb' || codes[1] === 'os' || codes[1] === 'ls')) {
    var ancestorCodes = codes.slice(2);
    if (ancestorCodes.length > 0) {
      var isAllAncestors = true;
      for (var i = 0; i < ancestorCodes.length; i++) {
        if (!includes(['f', 'm'], ancestorCodes[i])) { isAllAncestors = false; break; }
      }
      if (isAllAncestors) {
        // 丈夫的兄弟姐妹的爸爸 = 丈夫的爸爸 → 称呼我 = 儿媳
        if (ancestorCodes.length === 1 && ancestorCodes[0] === 'f') return ['儿媳'];
        if (ancestorCodes.length === 1 && ancestorCodes[0] === 'm') return ['儿媳'];
        // 丈夫的兄弟姐妹的爸爸的爸爸 = 丈夫的爸爸的爸爸 → 称呼我 = 孙媳
        if (ancestorCodes.length === 2) return ['孙媳'];
        // 丈夫的兄弟姐妹的爷爷的爸爸 = 丈夫的爷爷的爸爸 → 称呼我 = 曾孙媳
        if (ancestorCodes.length === 3) return ['曾孙媳'];
        if (ancestorCodes.length >= 4) return ['玄孙媳'];
      }
    }
  }
  
  // 丈夫的爸爸的爸爸 → 称呼我 = 孙媳
  if (codes.length >= 3 && codes[0] === 'h' && codes[1] === 'f' && codes[2] === 'f') {
    return ['孙媳'];
  }
  
  // 丈夫的爸爸的爸爸的爸爸 → 称呼我 = 曾孙媳
  if (codes.length >= 4 && codes[0] === 'h' && codes[1] === 'f' && codes[2] === 'f' && codes[3] === 'f') {
    return ['曾孙媳'];
  }
  
  // 丈夫的姐妹 → 称呼我 = 弟媳/嫂子（v703-32 修复：只处理 2 代，避免误匹配孙辈）
  if (codes.length === 2 && codes[0] === 'h' && (codes[1] === 'os' || codes[1] === 'ls')) {
    return codes[1] === 'os' ? ['弟媳', '弟妹'] : ['嫂子', '嫂嫂'];
  }
  
  // 丈夫的兄弟 → 称呼我 = 弟媳/嫂子（v703-32 修复：只处理 2 代，避免误匹配孙辈）
  if (codes.length === 2 && codes[0] === 'h' && (codes[1] === 'ob' || codes[1] === 'lb')) {
    return codes[1] === 'ob' ? ['弟媳', '弟妹'] : ['嫂子', '嫂嫂'];
  }
  
  // 丈夫的兄弟姐妹的子女 → 称呼我 = 伯母/婶婶/姑妈（v703-24 修复）
  if (codes.length === 3 && codes[0] === 'h') {
    if (codes[1] === 'ob' && (codes[2] === 's' || codes[2] === 'd')) return ['伯母', '大妈'];
    if (codes[1] === 'lb' && (codes[2] === 's' || codes[2] === 'd')) return ['婶婶', '婶母'];
    if ((codes[1] === 'os' || codes[1] === 'ls') && (codes[2] === 's' || codes[2] === 'd')) return ['姑妈', '姑姑'];
  }
  
  // 丈夫的兄弟姐妹的孙辈 → 称呼我 = 姑奶奶/伯祖母/婶祖母（v703-24 修复）
  if (codes.length === 4 && codes[0] === 'h') {
    if ((codes[1] === 'os' || codes[1] === 'ls')) return ['姑奶奶', '姑婆'];
    if (codes[1] === 'ob') return ['伯祖母'];
    if (codes[1] === 'lb') return ['婶祖母'];
  }
  
  // 丈夫的兄弟姐妹的曾孙辈 → 称呼我 = 姑曾祖母/伯曾祖母（v703-24 修复）
  if (codes.length === 5 && codes[0] === 'h') {
    if ((codes[1] === 'os' || codes[1] === 'ls')) return ['姑曾祖母'];
    if (codes[1] === 'ob' || codes[1] === 'lb') return ['伯曾祖母'];
  }
  
  // 丈夫的妈妈的儿子（丈夫的兄弟）→ 称呼我 = 嫂子/弟媳
  if (codes.length >= 3 && codes[0] === 'h' && codes[1] === 'm' && codes[2] === 's') {
    return ['嫂子', '弟媳'];
  }
  
  // 通用代际逻辑 - 多代扩展（v703-24 修复：只在纯直系亲属时使用）
  var hasSibling = false;
  for (var i = 0; i < codes.length; i++) {
    if (includes(['ob', 'lb', 'os', 'ls', 'xb', 'xs'], codes[i])) { hasSibling = true; break; }
  }
  
  // 只有纯直系亲属（无兄弟姐妹）才使用通用代际逻辑
  if (!hasSibling) {
    // v703-25 修复：纯后代链（只有 s/d）的反向称谓
    var isPureDescendant = true;
    for (var i = 0; i < codes.length; i++) {
      if (!includes(['s', 'd'], codes[i])) { isPureDescendant = false; break; }
    }
    
    if (isPureDescendant) {
      // 纯后代链：反向称谓 = 祖先称谓（v703-27 修复）
      // 对方是我的后代 → 对方称呼我 = 长辈
      if (codes.length === 1) return ['爸爸', '妈妈'];
      if (codes.length === 2) return ['爷爷', '奶奶'];
      if (codes.length === 3) return ['曾祖父', '曾祖母'];
      if (codes.length === 4) return ['高祖父', '高祖母'];
      if (codes.length === 5) return ['天祖父', '天祖母'];
      if (codes.length === 6) return ['烈祖父', '烈祖母'];
      if (codes.length === 7) return ['太祖父', '太祖母'];
      if (codes.length >= 8) return ['远祖'];
    }
    
    // 纯祖先链（只有 f/m）：反向称谓 = 后代称谓（v703-27 修复）
    var isPureAncestor = true;
    for (var i = 0; i < codes.length; i++) {
      if (!includes(['f', 'm'], codes[i])) { isPureAncestor = false; break; }
    }
    
    if (isPureAncestor) {
      // 对方是我的祖先 → 对方称呼我 = 晚辈
      if (codes.length === 1) return sex === 1 ? ['孙子'] : ['孙女'];
      if (codes.length === 2) return sex === 1 ? ['曾孙'] : ['曾孙女'];
      if (codes.length === 3) return sex === 1 ? ['玄孙'] : ['玄孙女'];
      if (codes.length === 4) return sex === 1 ? ['来孙'] : ['来孙女'];
      if (codes.length === 5) return sex === 1 ? ['晜孙'] : ['晜孙女'];
      if (codes.length >= 6) return ['远孙'];
    }
    
    // 混合链：使用代际差计算
    if (generationDiff === 1) return sex === 1 ? ['儿子'] : ['女儿'];
    if (generationDiff === 2) return sex === 1 ? ['孙子'] : ['孙女'];
    if (generationDiff === 3) return sex === 1 ? ['曾孙'] : ['曾孙女'];
    if (generationDiff === 4) return sex === 1 ? ['玄孙'] : ['玄孙女'];
    if (generationDiff === 5) return sex === 1 ? ['来孙'] : ['来孙女'];
    
    if (generationDiff === -1) return ['爸爸', '妈妈'];
    if (generationDiff === -2) return ['爷爷', '奶奶'];
    if (generationDiff === -3) return ['曾祖父', '曾祖母'];
    if (generationDiff === -4) return ['高祖父', '高祖母'];
    if (generationDiff <= -5) return ['远祖'];
  }
  
  return ['亲戚'];
}

// ========== 反向称谓推导核心函数（v711-68 新增）==========

// Inv(r, g) 映射函数 - 根据正向关系中起点的性别推导反向关系
// r = 正向关系代码，g = 正向关系起点的性别 ('male' 或 'female')
function inverseRelation(relationCode, startGender) {
  // 爸爸/妈妈 → 儿子/女儿（根据起点性别）
  if (relationCode === 'f' || relationCode === 'm') {
    return startGender === 'male' ? 's' : 'd';
  }
  
  // 儿子/女儿 → 爸爸/妈妈（根据起点性别）
  if (relationCode === 's') {
    return startGender === 'male' ? 'f' : 'm';
  }
  if (relationCode === 'd') {
    return startGender === 'male' ? 'f' : 'm';
  }
  
  // 兄弟姐妹关系（根据起点性别和长幼）
  // 妹妹：起点男→哥哥，起点女→姐姐
  if (relationCode === 'ls') {
    return startGender === 'male' ? 'ob' : 'os';
  }
  // 姐姐：起点男→弟弟，起点女→妹妹
  if (relationCode === 'os') {
    return startGender === 'male' ? 'lb' : 'ls';
  }
  // 哥哥：起点男→弟弟，起点女→妹妹
  if (relationCode === 'ob') {
    return startGender === 'male' ? 'lb' : 'ls';
  }
  // 弟弟：起点男→哥哥，起点女→姐姐
  if (relationCode === 'lb') {
    return startGender === 'male' ? 'ob' : 'os';
  }
  
  // 姐妹统称：起点男→弟弟，起点女→妹妹（反向是平辈男性/女性的年轻一代）
  if (relationCode === 'xs') {
    return startGender === 'male' ? 'lb' : 'ls';
  }
  // 兄弟统称：起点男→弟弟，起点女→妹妹
  if (relationCode === 'xb') {
    return startGender === 'male' ? 'lb' : 'ls';
  }
  
  // 配偶关系
  if (relationCode === 'h') {
    return 'w';
  }
  if (relationCode === 'w') {
    return 'h';
  }
  
  // 默认返回原关系
  return relationCode;
}

// 反向关系链推导函数 - v711-68 核心实现
// 公式：R' = (Inv(r_n, g_{n-1}), Inv(r_{n-1}, g_{n-2}), ..., Inv(r_1, g_0))
// 输入：forwardChain = 正向关系链数组 (如 ['f', 'f'])
//       genders = 节点性别数组 (如 ['male', 'male', 'male']，包含我的性别)
// 输出：反向关系链数组 (如 ['s', 's'])
function reverseChain(forwardChain, genders) {
  if (!forwardChain || forwardChain.length === 0) {
    return [];
  }
  
  var reverseResult = [];
  
  // 从后向前遍历正向关系链
  for (var i = forwardChain.length - 1; i >= 0; i--) {
    var relationCode = forwardChain[i];
    // 获取正向关系起点的性别（g_{i}，即第 i 步的起点）
    var startGender = genders[i];
    
    // 应用 Inv 映射
    var inverseCode = inverseRelation(relationCode, startGender);
    reverseResult.push(inverseCode);
  }
  
  return reverseResult;
}

// 将关系链代码转换为中文描述
function chainToChinese(chain, genders) {
  if (!chain || chain.length === 0) {
    return '我';
  }
  
  var codeToChinese = {
    'f': '爸爸', 'm': '妈妈',
    's': '儿子', 'd': '女儿',
    'ob': '哥哥', 'lb': '弟弟',
    'os': '姐姐', 'ls': '妹妹',
    'h': '丈夫', 'w': '妻子'
  };
  
  var result = '我的';
  for (var i = 0; i < chain.length; i++) {
    var code = chain[i];
    var chinese = codeToChinese[code] || code;
    result += chinese;
    if (i < chain.length - 1) {
      result += '的';
    }
  }
  
  return result;
}

// 通用正向关系生成逻辑 - v703-25 彻底重构
function generateRelationFromChain(codes, sex) {
  if (codes.length === 0) return ['我'];
  
  // ========== 第一步：纯后代链检查（移到最前面，v703-25 彻底修复）==========
  var isPureDescendant = true;
  for (var i = 0; i < codes.length; i++) {
    if (!includes(['s', 'd'], codes[i])) { isPureDescendant = false; break; }
  }
  
  if (isPureDescendant) {
    if (codes.length === 1) {
      if (codes[0] === 's') return ['儿子'];
      if (codes[0] === 'd') return ['女儿'];
    }
    if (codes.length === 2) {
      if (codes[0] === 's' && codes[1] === 's') return ['孙子'];
      if (codes[0] === 's' && codes[1] === 'd') return ['孙女'];
      if (codes[0] === 'd' && codes[1] === 's') return ['外孙'];
      if (codes[0] === 'd' && codes[1] === 'd') return ['外孙女'];
    }
    if (codes.length === 3) {
      if (codes[0] === 's' && codes[1] === 's' && codes[2] === 's') return ['曾孙'];
      if (codes[0] === 's' && codes[1] === 's' && codes[2] === 'd') return ['曾孙女'];
      if (codes[0] === 's' && codes[1] === 'd' && codes[2] === 's') return ['曾外孙'];
      if (codes[0] === 's' && codes[1] === 'd' && codes[2] === 'd') return ['曾外孙女'];
      if (codes[0] === 'd' && codes[1] === 's' && codes[2] === 's') return ['外曾孙'];
      if (codes[0] === 'd' && codes[1] === 's' && codes[2] === 'd') return ['外曾孙女'];
      if (codes[0] === 'd' && codes[1] === 'd' && codes[2] === 's') return ['外曾外孙'];
      if (codes[0] === 'd' && codes[1] === 'd' && codes[2] === 'd') return ['外曾外孙女'];
    }
    if (codes.length === 4) {
      if (codes[0] === 's' && codes[1] === 's' && codes[2] === 's' && codes[3] === 's') return ['玄孙'];
      if (codes[0] === 's' && codes[1] === 's' && codes[2] === 's' && codes[3] === 'd') return ['玄孙女'];
      if (codes[0] === 's' && codes[1] === 'd' && codes[2] === 's' && codes[3] === 's') return ['玄外孙'];
      if (codes[0] === 's' && codes[1] === 'd' && codes[2] === 's' && codes[3] === 'd') return ['玄外孙女'];
      if (codes[0] === 'd' && codes[1] === 's' && codes[2] === 's' && codes[3] === 's') return ['外玄孙'];
      if (codes[0] === 'd' && codes[1] === 's' && codes[2] === 's' && codes[3] === 'd') return ['外玄孙女'];
      return ['玄孙'];
    }
    if (codes.length === 5) {
      if (codes[0] === 's' && codes[1] === 's' && codes[2] === 's' && codes[3] === 's' && codes[4] === 's') return ['来孙'];
      if (codes[0] === 's' && codes[1] === 's' && codes[2] === 's' && codes[3] === 's' && codes[4] === 'd') return ['来孙女'];
      if (codes[0] === 's' && codes[1] === 'd' && codes[2] === 's' && codes[3] === 's' && codes[4] === 's') return ['来外孙'];
      if (codes[0] === 'd' && codes[1] === 's' && codes[2] === 's' && codes[3] === 's' && codes[4] === 's') return ['外玄孙'];
      return ['来孙'];
    }
    if (codes.length === 6) return ['晜孙'];
    if (codes.length === 7) return ['仍孙'];
    if (codes.length >= 8) return ['云孙'];
  }
  
  // ========== 第二步：纯祖先链检查（v703-25 修复）==========
  var isPureAncestor = true;
  for (var i = 0; i < codes.length; i++) {
    if (!includes(['f', 'm'], codes[i])) { isPureAncestor = false; break; }
  }
  
  if (isPureAncestor) {
    if (codes.length === 1) {
      if (codes[0] === 'f') return ['爸爸'];
      if (codes[0] === 'm') return ['妈妈'];
    }
    if (codes.length === 2) {
      if (codes[0] === 'f' && codes[1] === 'f') return ['爷爷'];
      if (codes[0] === 'f' && codes[1] === 'm') return ['奶奶'];
      if (codes[0] === 'm' && codes[1] === 'f') return ['外公'];
      if (codes[0] === 'm' && codes[1] === 'm') return ['外婆'];
    }
    if (codes.length === 3) {
      if (codes[0] === 'f' && codes[1] === 'f' && codes[2] === 'f') return ['曾祖父'];
      if (codes[0] === 'f' && codes[1] === 'f' && codes[2] === 'm') return ['曾祖母'];
      if (codes[0] === 'f' && codes[1] === 'm' && codes[2] === 'f') return ['曾外祖父'];
      if (codes[0] === 'f' && codes[1] === 'm' && codes[2] === 'm') return ['曾外祖母'];
      if (codes[0] === 'm' && codes[1] === 'f' && codes[2] === 'f') return ['外曾祖父'];
      if (codes[0] === 'm' && codes[1] === 'f' && codes[2] === 'm') return ['外曾祖母'];
      if (codes[0] === 'm' && codes[1] === 'm' && codes[2] === 'f') return ['外曾外祖父'];
      if (codes[0] === 'm' && codes[1] === 'm' && codes[2] === 'm') return ['外曾外祖母'];
    }
    if (codes.length === 4) {
      if (codes[0] === 'f' && codes[1] === 'f' && codes[2] === 'f' && codes[3] === 'f') return ['高祖父'];
      if (codes[0] === 'f' && codes[1] === 'f' && codes[2] === 'f' && codes[3] === 'm') return ['高祖母'];
      if (codes[0] === 'f' && codes[1] === 'f' && codes[2] === 'm') return ['高外祖父'];
      if (codes[0] === 'f' && codes[1] === 'm' && codes[2] === 'f') return ['高外祖父'];
      if (codes[0] === 'f' && codes[1] === 'm' && codes[2] === 'm') return ['高外祖母'];
      if (codes[0] === 'm' && codes[1] === 'f') return ['外高祖父'];
      if (codes[0] === 'm' && codes[1] === 'm') return ['外高祖母'];
      return ['高祖'];
    }
    if (codes.length === 5) {
      if (codes[0] === 'f' && codes[1] === 'm' && codes[2] === 'f' && codes[3] === 'm' && codes[4] === 'f') return ['高外祖父'];
      if (codes[0] === 'f' && codes[1] === 'm' && codes[2] === 'f' && codes[3] === 'f') return ['高外祖父'];
      if (codes[0] === 'f' && codes[1] === 'f' && codes[2] === 'm' && codes[3] === 'f') return ['高外祖父'];
      if (codes[0] === 'f' && codes[1] === 'f' && codes[2] === 'f' && codes[3] === 'm') return ['高祖父'];
      if (codes[0] === 'f' && codes[1] === 'f' && codes[2] === 'f' && codes[3] === 'f' && codes[4] === 'f') return ['高祖父'];
      if (codes[0] === 'm') return ['外高祖父'];
      return ['高祖'];
    }
    if (codes.length >= 8) return ['远祖'];
  }
  
  // ========== 第三步：配偶相关 ==========
  // 配偶
  if (codes.length === 1 && (codes[0] === 'h' || codes[0] === 'w')) {
    return [codes[0] === 'h' ? '丈夫' : '妻子'];
  }
  
  // 配偶的父母
  if (codes.length === 2 && codes[0] === 'w') {
    if (codes[1] === 'f') return ['岳父'];
    if (codes[1] === 'm') return ['岳母'];
  }
  
  if (codes.length === 2 && codes[0] === 'h') {
    if (codes[1] === 'f') return ['公公'];
    if (codes[1] === 'm') return ['婆婆'];
  }
  
  // 配偶的祖父母（v703-32 修复）
  if (codes.length === 3 && codes[0] === 'h') {
    if (codes[1] === 'f' && codes[2] === 'f') return ['爷爷'];
    if (codes[1] === 'f' && codes[2] === 'm') return ['奶奶'];
    if (codes[1] === 'm' && codes[2] === 'f') return ['外公'];
    if (codes[1] === 'm' && codes[2] === 'm') return ['外婆'];
  }
  if (codes.length === 3 && codes[0] === 'w') {
    if (codes[1] === 'f' && codes[2] === 'f') return ['爷爷'];
    if (codes[1] === 'f' && codes[2] === 'm') return ['奶奶'];
    if (codes[1] === 'm' && codes[2] === 'f') return ['外公'];
    if (codes[1] === 'm' && codes[2] === 'm') return ['外婆'];
  }
  
  // ========== 第四步：兄弟姐妹及其后代 ==========
  // 兄弟姐妹
  if (codes.length === 1) {
    if (codes[0] === 'ob') return ['哥哥'];
    if (codes[0] === 'lb') return ['弟弟'];
    if (codes[0] === 'os') return ['姐姐'];
    if (codes[0] === 'ls') return ['妹妹'];
  }
  
  // 父母的兄弟姐妹
  if (codes.length === 2) {
    if (codes[0] === 'f' && codes[1] === 'ob') return ['伯父'];
    if (codes[0] === 'f' && codes[1] === 'lb') return ['叔叔'];
    if (codes[0] === 'f' && codes[1] === 'xs') return ['姑姑'];
    if (codes[0] === 'm' && codes[1] === 'xb') return ['舅舅'];
    if (codes[0] === 'm' && codes[1] === 'xs') return ['姨妈'];
  }
  
  // 兄弟姐妹的子女
  if (codes.length === 2) {
    if ((codes[0] === 'ob' || codes[0] === 'lb') && codes[1] === 's') return ['侄子'];
    if ((codes[0] === 'ob' || codes[0] === 'lb') && codes[1] === 'd') return ['侄女'];
    if ((codes[0] === 'os' || codes[0] === 'ls') && codes[1] === 's') return ['外甥'];
    if ((codes[0] === 'os' || codes[0] === 'ls') && codes[1] === 'd') return ['外甥女'];
  }
  
  // 兄弟姐妹的孙辈及后代（v703-27 修复：根据最后一个代码判断性别）
  if (codes.length >= 3) {
    // 获取最后一个代码判断性别
    var lastCode = codes[codes.length - 1];
    var isMale = lastCode === 's';
    
    if ((codes[0] === 'ob' || codes[0] === 'lb')) {
      // 兄弟的后代 = 侄孙/侄孙女
      if (codes.length === 3) return isMale ? ['侄孙'] : ['侄孙女'];
      if (codes.length === 4) return isMale ? ['侄曾孙'] : ['侄曾孙女'];
      if (codes.length >= 5) return isMale ? ['侄玄孙'] : ['侄玄孙女'];
    }
    if ((codes[0] === 'os' || codes[0] === 'ls')) {
      // 姐妹的后代 = 外甥孙/外甥孙女
      if (codes.length === 3) return isMale ? ['外甥孙'] : ['外甥孙女'];
      if (codes.length === 4) return isMale ? ['外甥曾孙'] : ['外甥曾孙女'];
      if (codes.length >= 5) return isMale ? ['外甥玄孙'] : ['外甥玄孙女'];
    }
  }
  
  // ========== 第五步：配偶的兄弟姐妹及其后代 ==========
  // 配偶的兄弟姐妹的祖先 = 配偶的祖先（v703-29 修复）
  if (codes.length >= 2 && (codes[0] === 'h' || codes[0] === 'w')) {
    if ((codes[1] === 'ob' || codes[1] === 'lb' || codes[1] === 'os' || codes[1] === 'ls')) {
      // 跳过配偶的兄弟姐妹，直接追溯到配偶的祖先
      var ancestorCodes = codes.slice(2); // 从第 3 个代码开始
      if (ancestorCodes.length > 0) {
        // 检查是否全是祖先代码（f/m）
        var isAllAncestors = true;
        for (var i = 0; i < ancestorCodes.length; i++) {
          if (!includes(['f', 'm'], ancestorCodes[i])) { isAllAncestors = false; break; }
        }
        if (isAllAncestors) {
          // 重新计算配偶的祖先称谓
          var spouseAncestorCodes = ancestorCodes;
          if (codes[0] === 'h') {
            // 丈夫的祖先 = 自己的祖先
            if (spouseAncestorCodes.length === 1 && spouseAncestorCodes[0] === 'f') return ['公公'];
            if (spouseAncestorCodes.length === 1 && spouseAncestorCodes[0] === 'm') return ['婆婆'];
            if (spouseAncestorCodes.length === 2 && spouseAncestorCodes[0] === 'f' && spouseAncestorCodes[1] === 'f') return ['爷爷'];
            if (spouseAncestorCodes.length === 2 && spouseAncestorCodes[0] === 'f' && spouseAncestorCodes[1] === 'm') return ['奶奶'];
            if (spouseAncestorCodes.length === 2 && spouseAncestorCodes[0] === 'm' && spouseAncestorCodes[1] === 'f') return ['外公'];
            if (spouseAncestorCodes.length === 2 && spouseAncestorCodes[0] === 'm' && spouseAncestorCodes[1] === 'm') return ['外婆'];
          } else {
            // 妻子的祖先 = 岳父/岳母
            if (spouseAncestorCodes.length === 1 && spouseAncestorCodes[0] === 'f') return ['岳父'];
            if (spouseAncestorCodes.length === 1 && spouseAncestorCodes[0] === 'm') return ['岳母'];
            if (spouseAncestorCodes.length === 2) return ['外祖父'];
          }
          if (spouseAncestorCodes.length >= 3) return ['高祖'];
        }
      }
    }
  }
  
  // 配偶的兄弟姐妹
  if (codes.length === 2 && codes[0] === 'w') {
    if (codes[1] === 'os') return ['大姨姐'];
    if (codes[1] === 'ls') return ['小姨子'];
    if (codes[1] === 'xb' || codes[1] === 'lb') return ['小舅子'];
  }
  
  if (codes.length === 2 && codes[0] === 'h') {
    if (codes[1] === 'ob') return ['大伯哥'];
    if (codes[1] === 'lb') return ['小叔子'];
    if (codes[1] === 'os') return ['大姑姐'];
    if (codes[1] === 'ls') return ['小姑子'];
  }
  
  // 配偶的兄弟姐妹的子女
  if (codes.length === 3 && codes[0] === 'w') {
    if ((codes[1] === 'os' || codes[1] === 'ls' || codes[1] === 'xb') && codes[2] === 's') return ['外甥'];
    if ((codes[1] === 'os' || codes[1] === 'ls' || codes[1] === 'xb') && codes[2] === 'd') return ['外甥女'];
  }
  
  if (codes.length === 3 && codes[0] === 'h') {
    if ((codes[1] === 'os' || codes[1] === 'ls') && codes[2] === 's') return ['外甥'];
    if ((codes[1] === 'os' || codes[1] === 'ls') && codes[2] === 'd') return ['外甥女'];
    if ((codes[1] === 'ob' || codes[1] === 'lb') && codes[2] === 's') return ['侄子'];
    if ((codes[1] === 'ob' || codes[1] === 'lb') && codes[2] === 'd') return ['侄女'];
  }
  
  // 配偶的兄弟姐妹的孙辈
  if (codes.length >= 4 && codes[0] === 'w') {
    if ((codes[1] === 'os' || codes[1] === 'ls' || codes[1] === 'xb')) {
      return ['外甥孙'];
    }
  }
  
  if (codes.length >= 4 && codes[0] === 'h') {
    if ((codes[1] === 'os' || codes[1] === 'ls')) {
      return ['外甥孙'];
    }
    if ((codes[1] === 'ob' || codes[1] === 'lb')) {
      return ['侄孙'];
    }
  }
  
  // 配偶的兄弟姐妹的曾孙辈（v703-24 修复）
  if (codes.length === 5 && codes[0] === 'h') {
    if ((codes[1] === 'os' || codes[1] === 'ls')) {
      return ['外甥曾孙'];
    }
    if ((codes[1] === 'ob' || codes[1] === 'lb')) {
      return ['侄曾孙'];
    }
  }
  
  if (codes.length === 5 && codes[0] === 'w') {
    if ((codes[1] === 'os' || codes[1] === 'ls' || codes[1] === 'xb')) {
      return ['外甥曾孙'];
    }
  }
  
  // 妻子的姐妹的后代（v703-23 修复）
  if (codes.length >= 5 && codes[0] === 'w' && (codes[1] === 'os' || codes[1] === 'ls')) {
    if (codes[2] === 'd' && codes[3] === 's' && codes[4] === 's') return ['姨外曾孙'];
    if (codes[2] === 's' && codes[3] === 's' && codes[4] === 's') return ['姨外曾孙'];
    return ['姨外曾孙'];
  }
  
  if (codes.length >= 6 && codes[0] === 'w' && (codes[1] === 'os' || codes[1] === 'ls')) {
    return ['姨外玄孙'];
  }
  
  // 妻子的兄弟的后代（v703-23 修复）
  if (codes.length >= 5 && codes[0] === 'w' && (codes[1] === 'xb' || codes[1] === 'lb')) {
    return ['舅外曾孙'];
  }
  
  // ========== 第六步：女儿的丈夫相关（v703-24 修复）==========
  // 女儿的丈夫 = 女婿
  if (codes.length === 2 && codes[0] === 'd' && codes[1] === 'h') {
    return ['女婿'];
  }
  
  // 女儿的丈夫的父母 = 姻家公/姻家婆
  if (codes.length === 3 && codes[0] === 'd' && codes[1] === 'h') {
    if (codes[2] === 'f') return ['姻家公'];
    if (codes[2] === 'm') return ['姻家婆'];
  }
  
  // 女儿的丈夫的兄弟姐妹
  if (codes.length === 3 && codes[0] === 'd' && codes[1] === 'h' && codes[2] === 'ob') return ['姻侄'];
  if (codes.length === 3 && codes[0] === 'd' && codes[1] === 'h' && codes[2] === 'os') return ['姻侄女'];
  
  // ========== 第七步：其他姻亲关系 ==========
  // 子女的配偶
  if (codes.length === 2 && codes[0] === 's' && codes[1] === 'w') return ['儿媳'];
  if (codes.length === 2 && codes[0] === 'd' && codes[1] === 'h') return ['女婿'];
  
  // 默认返回
  return ['亲戚'];
}

Page({
  data: {
    mode: 'query',
    relationChain: [],
    gender: 'male',
    direction: 'call_other',
    queryResult: null,
    result: null,
    parseInput: null,
    parseResult: null,
    aiInput: '',
    aiMessages: [],
    useAI: true,
    apiKey: 'YOUR_DASHSCOPE_API_KEY_HERE',
    aiProvider: 'ali',
    lastRelationGender: null,
    showFuncMenu: false,
    disableSpouse: false,
    disableHusband: false,
    disableWife: false,
    lastRelationCode: '',
    directionPronoun: '他',
    directionLabel: '我称呼他：',
    shareContent: '',
    reverseChainTestResult: null
  },

  onLoad: function () {
    this.loadAIConfig();
    console.log('关系数据量:', Object.keys(mainData).length, '反向数据量:', Object.keys(reverseData).length);
    
    // v711-68 新增：运行 reverseChain() 测试
    this.testReverseChain();
    
    // v703-13/v703-14 关键修复：初始化时根据用户性别禁用配偶按钮
    var userGender = this.data.gender;
    var disableHusbandInit = (userGender === 'male');
    var disableWifeInit = (userGender === 'female');
    
    this.setData({
      disableHusband: disableHusbandInit,
      disableWife: disableWifeInit,
      disableSpouse: disableHusbandInit || disableWifeInit
    });
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },
  
  // v711-68 新增：reverseChain() 测试函数
  testReverseChain: function () {
    console.log('========== v711-68 reverseChain() 测试 ==========');
    
    // 测试用例 1：我的爸爸的爸爸 (f,f) - 我是男性
    // 正向：['f', 'f']，性别序列：['male', 'male', 'male']
    // 反向推导：
    //   Step 2: Inv(f, male) = s (爸爸的起点是男性→儿子)
    //   Step 1: Inv(f, male) = s (爸爸的起点是男性→儿子)
    // 结果：['s', 's'] = 我的儿子的儿子
    var test1Chain = ['f', 'f'];
    var test1Genders = ['male', 'male', 'male'];
    var test1Result = reverseChain(test1Chain, test1Genders);
    console.log('测试 1 - 我的爸爸的爸爸 (我=男):');
    console.log('  正向链:', test1Chain.join(','));
    console.log('  性别序列:', test1Genders.join(','));
    console.log('  反向链:', test1Result.join(','));
    console.log('  期望：s,s (我的儿子的儿子)');
    console.log('  结果:', test1Result.join(',') === 's,s' ? '✓ 正确' : '✗ 错误');
    
    // 测试用例 2：我的爸爸的爸爸 (f,f) - 我是女性
    // 正向：['f', 'f']，性别序列：['female', 'male', 'male']
    // 反向推导：
    //   Step 2: Inv(f, male) = s
    //   Step 1: Inv(f, female) = d
    // 结果：['s', 'd'] = 我的儿子的女儿
    var test2Chain = ['f', 'f'];
    var test2Genders = ['female', 'male', 'male'];
    var test2Result = reverseChain(test2Chain, test2Genders);
    console.log('测试 2 - 我的爸爸的爸爸 (我=女):');
    console.log('  正向链:', test2Chain.join(','));
    console.log('  性别序列:', test2Genders.join(','));
    console.log('  反向链:', test2Result.join(','));
    console.log('  期望：s,d (我的儿子的女儿)');
    console.log('  结果:', test2Result.join(',') === 's,d' ? '✓ 正确' : '✗ 错误');
    
    // 测试用例 3：我的爸爸的妈妈的爸爸的妈妈的妹妹的儿子
    // 正向：['f', 'm', 'f', 'm', 'ls', 's']
    // 性别序列：['male', 'male', 'female', 'male', 'female', 'female', 'male']
    // 反向推导：
    //   Step 6: Inv(s, female) = m (儿子的起点是女性→妈妈)
    //   Step 5: Inv(ls, female) = os (妹妹的起点是女性→姐姐)
    //   Step 4: Inv(m, male) = s (妈妈的起点是男性→儿子)
    //   Step 3: Inv(f, female) = d (爸爸的起点是女性→女儿)
    //   Step 2: Inv(m, male) = s (妈妈的起点是男性→儿子)
    //   Step 1: Inv(f, male) = s (爸爸的起点是男性→儿子)
    // 结果：['m', 'os', 's', 'd', 's', 's']
    var test3Chain = ['f', 'm', 'f', 'm', 'ls', 's'];
    var test3Genders = ['male', 'male', 'female', 'male', 'female', 'female', 'male'];
    var test3Result = reverseChain(test3Chain, test3Genders);
    console.log('测试 3 - 我的爸爸的妈妈的爸爸的妈妈的妹妹的儿子 (我=男):');
    console.log('  正向链:', test3Chain.join(','));
    console.log('  性别序列:', test3Genders.join(','));
    console.log('  反向链:', test3Result.join(','));
    console.log('  期望：m,os,s,d,s,s');
    console.log('  结果:', test3Result.join(',') === 'm,os,s,d,s,s' ? '✓ 正确' : '✗ 错误');
    
    // 测试用例 4：我的儿子 (s) - 我是男性
    // 正向：['s']，性别序列：['male', 'male']
    // 反向推导：
    //   Step 1: Inv(s, male) = f (儿子的起点是男性→爸爸)
    // 结果：['f'] = 我的爸爸
    var test4Chain = ['s'];
    var test4Genders = ['male', 'male'];
    var test4Result = reverseChain(test4Chain, test4Genders);
    console.log('测试 4 - 我的儿子 (我=男):');
    console.log('  正向链:', test4Chain.join(','));
    console.log('  性别序列:', test4Genders.join(','));
    console.log('  反向链:', test4Result.join(','));
    console.log('  期望：f (我的爸爸)');
    console.log('  结果:', test4Result.join(',') === 'f' ? '✓ 正确' : '✗ 错误');
    
    // 测试用例 5：我的女儿 (d) - 我是女性
    // 正向：['d']，性别序列：['female', 'female']
    // 反向推导：
    //   Step 1: Inv(d, female) = m (女儿的起点是女性→妈妈)
    // 结果：['m'] = 我的妈妈
    var test5Chain = ['d'];
    var test5Genders = ['female', 'female'];
    var test5Result = reverseChain(test5Chain, test5Genders);
    console.log('测试 5 - 我的女儿 (我=女):');
    console.log('  正向链:', test5Chain.join(','));
    console.log('  性别序列:', test5Genders.join(','));
    console.log('  反向链:', test5Result.join(','));
    console.log('  期望：m (我的妈妈)');
    console.log('  结果:', test5Result.join(',') === 'm' ? '✓ 正确' : '✗ 错误');
    
    // 测试用例 6：我的哥哥的儿子的儿子 (我=男)
    var test6Chain = ['ob', 's', 's'];
    var test6Genders = ['male', 'male', 'male', 'male'];
    var test6Result = reverseChain(test6Chain, test6Genders);
    console.log('测试 6 - 我的哥哥的儿子的儿子 (我=男):');
    console.log('  正向链:', test6Chain.join(','));
    console.log('  性别序列:', test6Genders.join(','));
    console.log('  反向链:', test6Result.join(','));
    console.log('  期望：f,f,lb');
    console.log('  结果:', test6Result.join(',') === 'f,f,lb' ? '✓ 正确' : '✗ 错误');
    
    // 测试用例 7：用户的完整例子 - 我的爸爸的爸爸的妈妈的爸爸的妈妈的妹妹的儿子 (我=男)
    var test7Chain = ['f', 'f', 'm', 'f', 'm', 'ls', 's'];
    var test7Genders = ['male', 'male', 'male', 'female', 'male', 'female', 'female', 'male'];
    var test7Result = reverseChain(test7Chain, test7Genders);
    console.log('测试 7 - 我的爸爸的爸爸的妈妈的爸爸的妈妈的妹妹的儿子 (我=男):');
    console.log('  正向链:', test7Chain.join(','));
    console.log('  性别序列:', test7Genders.join(','));
    console.log('  反向链:', test7Result.join(','));
    console.log('  期望：m,os,s,d,s,s,s');
    console.log('  结果:', test7Result.join(',') === 'm,os,s,d,s,s,s' ? '✓ 正确' : '✗ 错误');
    
    console.log('========== v711-68 reverseChain() 测试结束 ==========');
    
    // 保存测试结果到 data
    this.setData({
      reverseChainTestResult: {
        test1: test1Result.join(','),
        test2: test2Result.join(','),
        test3: test3Result.join(','),
        test4: test4Result.join(','),
        test5: test5Result.join(','),
        test6: test6Result.join(','),
        test7: test7Result.join(',')
      }
    });
  },

  onShareAppMessage: function () {
    var content = this.data.shareContent || '亲戚计算器 - 智能计算亲戚称谓';
    return {
      title: content,
      path: '/pages/relationship-calculator/relationship-calculator',
      imageUrl: ''
    };
  },

  onShareTimeline: function () {
    var content = this.data.shareContent || '亲戚计算器 - 智能计算亲戚称谓';
    return {
      title: content,
      query: '',
      imageUrl: ''
    };
  },

  loadAIConfig: function () {
    try {
      var apiKey = 'YOUR_DASHSCOPE_API_KEY_HERE';
      wx.setStorageSync('relationship_apiKey', apiKey);
      wx.setStorageSync('relationship_useAI', true);
      wx.setStorageSync('relationship_aiProvider', 'ali');
      
      this.setData({
        useAI: true,
        aiProvider: 'ali',
        apiKey: apiKey
      });
      
      console.log('AI 配置已自动加载：通义千问');
    } catch (e) {
      console.error('加载 AI 配置失败', e);
    }
  },

  switchMode: function (e) {
    var mode = e.currentTarget.dataset.mode;
    this.setData({
      mode: mode,
      result: null,
      parseResult: null
    });
  },

  // v703-13 修复：添加丈夫按钮（检查禁用状态）
  addHusband: function (e) {
    var disabled = e.currentTarget.dataset.disabled;
    if (disabled) {
      return;
    }
    this.addQuickRelation({ currentTarget: { dataset: { relation: 'husband' } } });
  },

  // v703-13 修复：添加妻子按钮（检查禁用状态）
  addWife: function (e) {
    var disabled = e.currentTarget.dataset.disabled;
    if (disabled) {
      return;
    }
    this.addQuickRelation({ currentTarget: { dataset: { relation: 'wife' } } });
  },

  // 添加快捷关系
  addQuickRelation: function (e) {
    var relation = e.currentTarget.dataset.relation;
    var chain = this.data.relationChain;
    var userGender = this.data.gender;
    
    var quickRelationMap = {
      'grandfather': ['爸爸', '爸爸'],
      'grandmother': ['爸爸', '妈妈'],
      'maternal_grandfather': ['妈妈', '爸爸'],
      'maternal_grandmother': ['妈妈', '妈妈'],
      'uncle': ['爸爸', '哥哥'],
      'younger_uncle': ['爸爸', '弟弟'],
      'aunt': ['爸爸', '姐姐'],
      'maternal_uncle': ['妈妈', '哥哥'],
      'maternal_aunt': ['妈妈', '姐姐'],
      'nephew': ['兄弟', '儿子'],
      'niece': ['兄弟', '女儿'],
      'nephew_son': ['姐妹', '儿子'],
      'niece_daughter': ['姐妹', '女儿'],
      'grandson': ['儿子', '儿子'],
      'granddaughter': ['儿子', '女儿'],
      'maternal_grandson': ['女儿', '儿子'],
      'maternal_granddaughter': ['女儿', '女儿'],
      'father': ['爸爸'],
      'mother': ['妈妈'],
      'husband': ['丈夫'],
      'wife': ['妻子'],
      'son': ['儿子'],
      'daughter': ['女儿'],
      'brother': ['哥哥'],
      'younger_brother': ['弟弟'],
      'sister': ['姐姐'],
      'younger_sister': ['妹妹']
    };
    
    var relationChain = quickRelationMap[relation] || [relation];
    
    if (chain.length === 0) {
      chain.push('我');
    }
    
    // 先将新关系添加到 chain
    for (var i = 0; i < relationChain.length; i++) {
      chain.push(relationChain[i]);
    }
    
    // 更新最后添加的关系的性别和关系代码
    var lastRelation = relationChain[relationChain.length - 1];
    var lastGender = null;
    var lastCode = '';
    
    if (lastRelation === '爸爸' || lastRelation === '哥哥' || lastRelation === '弟弟' || lastRelation === '儿子' || lastRelation === '丈夫' || lastRelation === '孙子' || lastRelation === '外孙' || lastRelation === '侄子' || lastRelation === '外甥') {
      lastGender = 'male';
      lastCode = 's';
    } else if (lastRelation === '妈妈' || lastRelation === '姐姐' || lastRelation === '妹妹' || lastRelation === '女儿' || lastRelation === '妻子' || lastRelation === '孙女' || lastRelation === '外孙女' || lastRelation === '侄女' || lastRelation === '外甥女') {
      lastGender = 'female';
      lastCode = 'd';
    }
    
    // v703-13 修复：根据最后一个关系的性别禁用配偶按钮
    var disableHusband = (lastCode === 's');
    var disableWife = (lastCode === 'd');
    
    this.setData({ 
      lastRelationGender: lastGender,
      lastRelationCode: lastCode,
      disableSpouse: disableHusband || disableWife,
      disableHusband: disableHusband,
      disableWife: disableWife
    });
    
    this.setData({ relationChain: chain, result: null });
  },

  // 撤销最后一个关系
  cancelLastRelation: function () {
    var chain = this.data.relationChain;
    var userGender = this.data.gender;
    if (chain.length > 1) {
      chain.pop();
      if (chain.length > 1) {
        var lastRelation = chain[chain.length - 1];
        var lastGender = null;
        var lastCode = '';
        
        // 根据关系名称判断性别
        if (lastRelation === '爸爸' || lastRelation === '哥哥' || lastRelation === '弟弟' || lastRelation === '儿子' || lastRelation === '丈夫' || lastRelation === '孙子' || lastRelation === '外孙' || lastRelation === '侄子' || lastRelation === '外甥') {
          lastGender = 'male';
          lastCode = 's';
        } else if (lastRelation === '妈妈' || lastRelation === '姐姐' || lastRelation === '妹妹' || lastRelation === '女儿' || lastRelation === '妻子' || lastRelation === '孙女' || lastRelation === '外孙女' || lastRelation === '侄女' || lastRelation === '外甥女') {
          lastGender = 'female';
          lastCode = 'd';
        }
        
        var disableHusband = (lastCode === 's');
        var disableWife = (lastCode === 'd');
        
        this.setData({
          lastRelationGender: lastGender,
          lastRelationCode: lastCode,
          disableSpouse: disableHusband || disableWife,
          disableHusband: disableHusband,
          disableWife: disableWife
        });
      } else {
        var disableHusbandInit = (userGender === 'male');
        var disableWifeInit = (userGender === 'female');
        this.setData({
          lastRelationGender: null,
          lastRelationCode: '',
          disableSpouse: disableHusbandInit || disableWifeInit,
          disableHusband: disableHusbandInit,
          disableWife: disableWifeInit
        });
      }
      this.setData({ relationChain: chain, result: null });
    }
  },

  // 获取关系的关系代码
  getRelationCode: function (relation) {
    var codeMap = {
      '爸爸': 'f', '妈妈': 'm',
      '哥哥': 'ob', '弟弟': 'lb', '姐姐': 'os', '妹妹': 'ls',
      '丈夫': 'h', '妻子': 'w',
      '儿子': 's', '女儿': 'd',
      '孙子': 's,s', '孙女': 's,d', '外孙': 'd,s', '外孙女': 'd,d',
      '侄子': 'xb,s', '侄女': 'xb,d', '外甥': 'xs,s', '外甥女': 'xs,d',
      '侄儿': 'xb,s', '内侄': 'w,lb,s', '姨侄': 'w,os,s',
      '内侄女': 'w,lb,d', '姨侄女': 'w,os,d'
    };
    var code = codeMap[relation] || '';
    if (code.indexOf(',') !== -1) {
      var codes = code.split(',');
      return codes[codes.length - 1];
    }
    return code;
  },

  // 清空关系链
  clearRelation: function () {
    var userGender = this.data.gender;
    var disableHusbandInit = (userGender === 'male');
    var disableWifeInit = (userGender === 'female');
    
    this.setData({ 
      relationChain: [], 
      result: null, 
      queryResult: null, 
      lastRelationGender: null, 
      lastRelationCode: '', 
      disableSpouse: disableHusbandInit || disableWifeInit, 
      disableHusband: disableHusbandInit, 
      disableWife: disableWifeInit, 
      directionPronoun: '他', 
      directionLabel: '我称呼他：' 
    });
  },

  shareToWechat: function () {
    var that = this;
    var content = '';
    if (that.data.queryResult) {
      content = that.data.relationChain.join('的') + '，' + (that.data.direction === 'call_other' ? that.data.directionLabel : that.data.directionPronoun === 'female' ? '她称呼我：' : '他称呼我：') + that.data.queryResult;
    } else {
      content = '亲戚计算器 - 智能计算亲戚称谓';
    }
    
    // 设置分享卡片内容
    that.setData({ shareContent: content });
    
    // 触发分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    // 提示用户点击右上角分享
    wx.showToast({
      title: '请点击右上角「…」分享',
      icon: 'none',
      duration: 2000
    });
  },

  showFuncMenu: function () {
    this.setData({ showFuncMenu: true });
  },

  hideFuncMenu: function () {
    this.setData({ showFuncMenu: false });
  },

  goToParse: function () {
    this.hideFuncMenu();
    this.setData({ mode: 'parse' });
  },

  goToAI: function () {
    this.hideFuncMenu();
    this.setData({ mode: 'ai' });
  },

  setGender: function (e) {
    var gender = e.currentTarget.dataset.gender;
    this.setData({ gender: gender });
    // 切换性别时重新计算配偶按钮禁用状态
    if (this.data.relationChain.length <= 1) {
      var disableHusband = (gender === 'male');
      var disableWife = (gender === 'female');
      this.setData({
        disableHusband: disableHusband,
        disableWife: disableWife
      });
    }
  },

  // v703-13 修复：切换称谓方向（根据性别动态更新代词）
  toggleDirection: function () {
    var currentDirection = this.data.direction;
    var newDirection = (currentDirection === 'call_other') ? 'called_by_other' : 'call_other';
    
    var lastRelation = this.data.relationChain[this.data.relationChain.length - 1];
    var lastGender = this.getGenderOfRelation(lastRelation);
    var pronoun = (lastGender === 'female') ? '她' : '他';
    
    var newLabel = (newDirection === 'call_other') ? 
      (lastGender === 'female' ? '我称呼她：' : '我称呼他：') : 
      (lastGender === 'female' ? '她称呼我：' : '他称呼我：');
    
    this.setData({ 
      direction: newDirection,
      directionPronoun: pronoun,
      directionLabel: newLabel
    });
    
    this.queryRelation();
  },

  // 查询称谓
  queryRelation: function () {
    var chain = this.data.relationChain;
    var gender = this.data.gender;
    var direction = this.data.direction;
    
    if (chain.length <= 1) {
      wx.showToast({ title: '请先添加关系', icon: 'none' });
      return;
    }
    
    // 解析关系链
    var chainStr = parseChain(chain);
    console.log('关系链:', chain, '代码:', chainStr);
    
    // 使用本地计算逻辑
    // sex 参数：0=男，1=女
    var isReverse = (direction === 'called_by_other');
    var result = calculateRelation(chainStr, gender === 'male' ? 0 : 1, isReverse);
    
    // 根据最后一个成员的性别，动态更新显示文本
    var lastRelation = chain[chain.length - 1];
    var lastGender = this.getGenderOfRelation(lastRelation);
    var pronoun = (lastGender === 'female') ? '她' : '他';
    var label = (direction === 'call_other') ? 
      (lastGender === 'female' ? '我称呼她：' : '我称呼他：') : 
      (lastGender === 'female' ? '她称呼我：' : '他称呼我：');
    
    if (result && result.length > 0) {
      this.setData({
        queryResult: result[0],
        directionPronoun: pronoun,
        directionLabel: label
      });
    }
    
    // 如果本地计算结果不理想，自动调用 AI
    if (result.length === 0 || result[0] === '亲戚' || result[0].indexOf('关系较远') !== -1 || result[0].indexOf('的') !== -1) {
      wx.showToast({ title: 'AI 计算中...', icon: 'loading', duration: 10000 });
      var question = '请根据以下关系链给出最准确的称谓：' + chain.join('') + '。只需要回答一个最常见的称谓即可，不要解释。';
      this.callTongyiAPIForRelation(question, chain);
    } else {
      this.setData({ result: result });
    }
  },

  callTongyiAPIForRelation: function (question, chain) {
    var that = this;
    var apiKey = this.data.apiKey;
    
    wx.request({
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'qwen-turbo',
        messages: [
            { role: 'system', content: '你是一个亲戚关系称谓计算助手。请根据以下中国亲属关系规则给出准确称谓：爸爸的爸爸=爷爷，爸爸的妈妈=奶奶，妈妈的爸爸=外公/姥爷，妈妈的妈妈=外婆/姥姥；爸爸的哥哥=伯父/伯伯，爸爸的弟弟=叔叔，爸爸的姐妹=姑姑/姑妈；妈妈的兄弟=舅舅/舅父，妈妈的姐妹=姨妈/姨母；兄弟的儿子=侄子，姐妹的儿子=外甥；儿子的儿子=孙子，女儿的儿子=外孙；妻子的父母=岳父/岳母，丈夫的父母=公公/婆婆；爸爸的兄弟的子女=堂兄弟姐妹，爸爸的姐妹/妈妈的兄弟姐妹的子女=表兄弟姐妹。请只回答一个最常见的称谓，不要解释，不要有多余文字。' },
            { role: 'user', content: question }
          ]
      },
      success: function (res) {
        console.log('AI 响应:', res.data);
        wx.hideToast();
        var content = '';
        if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
          content = res.data.choices[0].message.content;
        } else if (res.data.output && res.data.output.text) {
          content = res.data.output.text;
        }
        var answer = content ? content.trim() : '抱歉，无法计算。';
        answer = answer.replace(/^[^的]*的/, '').replace(/[。,\\.!！?？]$/, '').trim();
        that.setData({ result: [answer] });
      },
      fail: function (err) {
        console.error('AI 请求失败:', err);
        wx.hideToast();
        that.setData({ result: ['计算失败，请重试'] });
      }
    });
  },

  // 获取关系的性别
  getGenderOfRelation: function (relation) {
    var maleRelations = ['爸爸', '哥哥', '弟弟', '儿子', '孙子', '外孙', '丈夫', '爷爷', '外公', '伯父', '叔叔', '舅舅', '侄子', '外甥', '女婿', '姑父', '姨父', '舅父', '侄儿', '内侄', '姨侄', '曾孙', '玄孙', '曾祖父', '高祖父'];
    var femaleRelations = ['妈妈', '姐姐', '妹妹', '女儿', '孙女', '外孙女', '妻子', '奶奶', '外婆', '姑姑', '姨妈', '侄女', '外甥女', '儿媳', '媳妇', '伯母', '婶婶', '舅妈', '姨母', '内侄女', '姨侄女', '曾孙女', '玄孙女', '曾祖母', '高祖母'];
    
    if (maleRelations.indexOf(relation) !== -1) {
      return 'male';
    } else if (femaleRelations.indexOf(relation) !== -1) {
      return 'female';
    }
    return null;
  },

  onParseInput: function (e) {
    this.setData({ parseInput: e.detail.value });
  },

  parseRelation: function () {
    var input = this.data.parseInput;
    if (!input) {
      wx.showToast({ title: '请输入称谓', icon: 'none' });
      return;
    }
    
    var result = this.findRelationChain(input);
    this.setData({ parseResult: result });
  },

  findRelationChain: function (term) {
    var input = term.trim();
    if (!input) return '解析结果：请输入称谓';
    
    // === 第一步：在 mainData 中精确查找 ===
    for (var key in mainData) {
      var values = mainData[key];
      if (values && values.indexOf(input) !== -1) {
        var chain = this.codeToChinese(key);
        return '解析结果：' + input + ' = ' + chain;
      }
    }
    
    // === 第二步：在 reverseData 中精确查找 ===
    for (var rkey in reverseData) {
      var rvalues = reverseData[rkey];
      if (rvalues && rvalues.indexOf(input) !== -1) {
        var rchain = this.codeToChinese(rkey);
        return '解析结果：' + input + ' = ' + rchain + '（反向：对方这样称呼我）';
      }
    }
    
    // === 第三步：模糊匹配 - 在 mainData 所有值中搜索包含输入词的结果 ===
    var fuzzyMatches = [];
    for (var fkey in mainData) {
      var fvalues = mainData[fkey];
      if (fvalues) {
        for (var vi = 0; vi < fvalues.length; vi++) {
          if (fvalues[vi].indexOf(input) !== -1) {
            var fchain = this.codeToChinese(fkey);
            fuzzyMatches.push(input + ' ≈ ' + fvalues[vi] + '（关系链：' + fchain + '）');
          }
        }
      }
    }
    if (fuzzyMatches.length > 0) {
      return '解析结果：未找到完全匹配 "' + input + '" 的称谓\n\n近似匹配：\n' + fuzzyMatches.join('\n');
    }
    
    // === 第四步：在 reverseData 中模糊匹配 ===
    var fuzzyReverseMatches = [];
    for (var rfkey in reverseData) {
      var rfvalues = reverseData[rfkey];
      if (rfvalues) {
        for (var rvi = 0; rvi < rfvalues.length; rvi++) {
          if (rfvalues[rvi].indexOf(input) !== -1) {
            var rfchain = this.codeToChinese(rfkey);
            fuzzyReverseMatches.push(input + ' ≈ ' + rfvalues[rvi] + '（关系链：' + rfchain + '）');
          }
        }
      }
    }
    if (fuzzyReverseMatches.length > 0) {
      return '解析结果：未找到完全匹配 "' + input + '" 的称谓\n\n反向近似匹配：\n' + fuzzyReverseMatches.join('\n');
    }
    
    // === 第五步：尝试用 tryLocalAnswer 智能解析 ===
    var localAnswer = this.tryLocalAnswer(input);
    if (localAnswer) {
      return '解析结果：' + localAnswer;
    }
    
    // === 第六步：所有本地方法都失败，调用 AI 千问模型兜底 ===
    this.callTongyiAPIForParse(input);
    return '正在查询 AI 模型，请稍候...';
  },
  
  // AI 兜底：为关系链解析调用千问模型
  callTongyiAPIForParse: function (term) {
    var that = this;
    var apiKey = this.data.apiKey;
    
    wx.request({
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'qwen-turbo',
        messages: [
            { role: 'system', content: '你是一个中国亲戚关系称谓解析专家。用户输入一个称谓，你需要解析出这个称谓对应的关系链（从"我"出发，经过哪些亲属关系到达目标人物）。请用简洁的中文回答，格式如："XX = 爸爸的爸爸的爸爸"。如果不确定，请基于中国传统亲属制度给出最合理的答案。只回答称谓和关系链，不要多余解释。' },
            { role: 'user', content: '请解析这个称谓的关系链：' + term }
          ],
      },
      success: function (res) {
        console.log('AI 解析响应:', res.data);
        var content = '';
        if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
          content = res.data.choices[0].message.content;
        } else if (res.data.output && res.data.output.text) {
          content = res.data.output.text;
        }
        var answer = content ? content.trim() : 'AI 暂时无法解析该称谓';
        that.setData({ parseResult: 'AI 解析结果：' + answer });
      },
      fail: function (err) {
        console.error('AI 解析请求失败:', err);
        that.setData({ parseResult: 'AI 网络请求失败，无法解析 "' + term + '"' });
      }
    });
  },

  codeToChinese: function (codeStr) {
    if (!codeStr) return '自己';
    
    var codes = codeStr.split(',');
    var chinese = [];
    
    var codeToChineseMap = {
      'f': '爸爸',
      'm': '妈妈',
      'h': '丈夫',
      'w': '妻子',
      's': '儿子',
      'd': '女儿',
      'ob': '哥哥',
      'lb': '弟弟',
      'os': '姐姐',
      'ls': '妹妹',
      'xb': '兄弟',
      'xs': '姐妹'
    };
    
    for (var i = 0; i < codes.length; i++) {
      var code = codes[i];
      if (code && codeToChineseMap[code]) {
        chinese.push(codeToChineseMap[code]);
      }
    }
    
    return chinese.join('的');
  },

  onAiInput: function (e) {
    this.setData({ aiInput: e.detail.value });
  },

  sendAiMessage: function () {
    var input = this.data.aiInput;
    if (!input) {
      wx.showToast({ title: '请输入问题', icon: 'none' });
      return;
    }
    
    var messages = this.data.aiMessages;
    messages.push({ role: 'user', content: input });
    this.setData({ 
      aiInput: '', 
      aiMessages: messages
    });
    
    // 先用本地关系数据尝试回答，找不到再调用 AI
    var localAnswer = this.tryLocalAnswer(input);
    if (localAnswer) {
      messages.push({ role: 'ai', content: localAnswer });
      this.setData({ aiMessages: messages });
      return;
    }
    
    this.callTongyiAPI(input);
  },

  // 尝试用本地关系数据回答用户问题（优先于 AI）
  tryLocalAnswer: function (question) {
    var input = question.trim();
    if (!input) return '';
    
    // 非关系类问题，不处理
    var isRelQuestion = (input.indexOf('叫') !== -1 || input.indexOf('什么') !== -1 || 
      input.indexOf('关系') !== -1 || input.indexOf('称谓') !== -1 || 
      input.indexOf('称呼') !== -1 || input.indexOf('该叫') !== -1 ||
      input.indexOf('爸爸') !== -1 || input.indexOf('妈妈') !== -1 ||
      input.indexOf('哥哥') !== -1 || input.indexOf('弟弟') !== -1 ||
      input.indexOf('姐姐') !== -1 || input.indexOf('妹妹') !== -1 ||
      input.indexOf('儿子') !== -1 || input.indexOf('女儿') !== -1 ||
      input.indexOf('爷爷') !== -1 || input.indexOf('奶奶') !== -1 ||
      input.indexOf('外公') !== -1 || input.indexOf('外婆') !== -1 ||
      input.indexOf('叔叔') !== -1 || input.indexOf('伯父') !== -1 ||
      input.indexOf('姑姑') !== -1 || input.indexOf('舅舅') !== -1 ||
      input.indexOf('姨妈') !== -1 || input.indexOf('侄子') !== -1 ||
      input.indexOf('外甥') !== -1 || input.indexOf('孙子') !== -1 ||
      input.indexOf('外孙') !== -1 || input.indexOf('曾孙') !== -1 ||
      input.indexOf('丈夫') !== -1 || input.indexOf('妻子') !== -1 ||
      input.indexOf('老公') !== -1 || input.indexOf('老婆') !== -1);
    
    if (!isRelQuestion) return '';
    
    // 提取所有已知关系词
    var relTerms = [
      '爸爸', '父亲', '妈妈', '母亲', '丈夫', '老公', '妻子', '老婆',
      '儿子', '女儿', '哥哥', '兄长', '弟弟', '兄弟', '姐姐', '姊姊', '妹妹', '妹子',
      '爷爷', '祖父', '奶奶', '祖母', '外公', '姥爷', '外婆', '姥姥',
      '伯父', '伯伯', '叔叔', '叔父', '姑妈', '姑姑', '舅舅', '舅父', '姨妈', '姨母',
      '侄子', '侄儿', '侄女', '外甥', '外甥女',
      '孙子', '孙儿', '孙女', '外孙', '外孙女',
      '曾祖父', '太公', '曾祖母', '曾孙', '曾孙女', '外曾孙', '外曾孙女',
      '公公', '婆婆', '岳父', '丈人', '岳母', '丈母娘',
      '姑父', '姑丈', '舅妈', '妗子', '姨父', '姨丈',
      '嫂子', '嫂嫂', '弟媳', '弟妹', '姐夫', '妹夫',
      '儿媳', '儿媳妇', '女婿', '姑爷',
      '大姨姐', '大姨子', '小姨子', '小舅子', '内弟',
      '连襟', '妯娌', '婆媳', '翁婿',
      '堂兄', '堂弟', '堂姐', '堂妹', '表哥', '表弟', '表姐', '表妹',
      '堂哥', '堂嫂', '堂侄', '堂侄女', '表侄', '表侄女',
      '曾外祖父', '曾外祖母', '外曾祖父', '外曾祖母',
      '高祖父', '高祖母', '天祖', '烈祖', '太祖', '远祖',
      '舅姥爷', '舅爷爷', '姨奶奶', '姑奶奶', '姑爷爷', '姨爷爷'
    ];
    
    // 按长度降序排列，优先匹配长词
    var sortedTerms = relTerms.sort(function(a, b) { return b.length - a.length; });
    
    var extractedChain = [];
    var remaining = input;
    
    for (var i = 0; i < sortedTerms.length; i++) {
      var term = sortedTerms[i];
      while (remaining.indexOf(term) !== -1) {
        var idx = remaining.indexOf(term);
        extractedChain.push(term);
        // 移除已匹配的词
        remaining = remaining.substring(0, idx) + remaining.substring(idx + term.length);
      }
    }
    
    if (extractedChain.length === 0) return '';
    
    // 去重并保持顺序
    var uniqueChain = [];
    for (var j = 0; j < extractedChain.length; j++) {
      var t = extractedChain[j];
      if (uniqueChain.indexOf(t) === -1) {
        uniqueChain.push(t);
      }
    }
    
    // 方式1: 直接用关系词链在 mainData 中查找
    var chainStr = '';
    for (var k = 0; k < uniqueChain.length; k++) {
      if (k > 0) chainStr += ',';
      chainStr += uniqueChain[k];
    }
    
    // 在 mainData 中搜索包含所有这些关系词的键
    var allValues = '';
    for (var key in mainData) {
      var vals = mainData[key];
      if (vals) {
        allValues += vals.join(',') + ',';
      }
    }
    
    // 检查提取的关系链是否都在数据中
    var allFound = true;
    for (var l = 0; l < uniqueChain.length; l++) {
      if (allValues.indexOf(uniqueChain[l]) === -1) {
        allFound = false;
        break;
      }
    }
    
    if (!allFound) {
      // 尝试用 chineseToCode 转换
      var codeChain = [];
      for (var m = 0; m < uniqueChain.length; m++) {
        if (chineseToCode[uniqueChain[m]]) {
          codeChain.push(chineseToCode[uniqueChain[m]]);
        }
      }
      if (codeChain.length > 0) {
        var codeStr = codeChain.join(',');
        // 尝试计算
        var calcResult = calculateRelation(codeStr, 0, false); // 先试男性
        if (calcResult && calcResult.length > 0 && calcResult[0] !== '亲戚') {
          return '「' + uniqueChain.join('的') + '」的称谓是：' + calcResult.join(' / ');
        }
        calcResult = calculateRelation(codeStr, 1, false); // 再试女性
        if (calcResult && calcResult.length > 0 && calcResult[0] !== '亲戚') {
          return '「' + uniqueChain.join('的') + '」的称谓是：' + calcResult.join(' / ');
        }
      }
      return '';
    }
    
    // 方式2: 用 parseChain + calculateRelation
    if (uniqueChain.length >= 1) {
      var parsedChain = parseChain(uniqueChain);
      if (parsedChain) {
        var result = calculateRelation(parsedChain, 0, false);
        if (result && result.length > 0 && result[0] !== '亲戚') {
          return '「' + uniqueChain.join('的') + '」的称谓是：' + result.join(' / ');
        }
        result = calculateRelation(parsedChain, 1, false);
        if (result && result.length > 0 && result[0] !== '亲戚') {
          return '「' + uniqueChain.join('的') + '」的称谓是：' + result.join(' / ');
        }
      }
    }
    
    return '';
  },

  callTongyiAPI: function (question) {
    var that = this;
    var apiKey = this.data.apiKey;
    
    wx.request({
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'qwen-turbo',
        messages: [
            { role: 'system', content: '你是一个中国亲戚关系称谓问答助手。请根据以下规则回答：\n1. 爸爸的爸爸=爷爷，爸爸的妈妈=奶奶，妈妈的爸爸=外公/姥爷，妈妈的妈妈=外婆/姥姥\n2. 爸爸的哥哥=伯父/伯伯，爸爸的弟弟=叔叔，爸爸的姐妹=姑姑/姑妈\n3. 妈妈的兄弟=舅舅/舅父，妈妈的姐妹=姨妈/姨母\n4. 兄弟的儿子=侄子，姐妹的儿子=外甥\n5. 儿子的儿子=孙子，女儿的儿子=外孙\n6. 妻子的父母=岳父/岳母，丈夫的父母=公公/婆婆\n7. 爸爸的兄弟的子女=堂兄弟姐妹，爸爸的姐妹/妈妈的兄弟姐妹的子女=表兄弟姐妹\n如果问题在上述规则范围内，请直接给出准确称谓。如果超出范围，请基于中国传统亲属制度进行合理推断。回答要简洁准确，不要有多余解释。' },
            { role: 'user', content: question }
          ]
      },
      success: function (res) {
        console.log('AI 响应:', res.data);
        var content = '';
        if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
          content = res.data.choices[0].message.content;
        } else if (res.data.output && res.data.output.text) {
          content = res.data.output.text;
        }
        var answer = content ? content.trim() : '抱歉，我无法回答这个问题。';
        
        var messages = that.data.aiMessages;
        messages.push({ role: 'ai', content: answer });
        that.setData({ aiMessages: messages });
      },
      fail: function (err) {
        console.error('AI 请求失败:', err);
        var messages = that.data.aiMessages;
        messages.push({ role: 'ai', content: '抱歉，网络请求失败，请稍后再试。' });
        that.setData({ aiMessages: messages });
      }
    });
  },
  
  // 分享功能（v703-32 修复：直接调用微信分享）
  onShareAppMessage: function (res) {
    var that = this;
    var content = '';
    if (that.data.queryResult) {
      content = that.data.relationChain.join('的') + '，' + (that.data.direction === 'call_other' ? that.data.directionLabel : that.data.directionPronoun === 'female' ? '她称呼我：' : '他称呼我：') + that.data.queryResult;
    } else {
      content = '亲戚计算器 - 智能计算亲戚称谓';
    }
    
    return {
      title: content,
      path: '/pages/relationship-calculator/relationship-calculator',
      imageUrl: '' // 使用默认分享图
    };
  }
});
