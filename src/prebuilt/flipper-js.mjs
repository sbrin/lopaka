/**
 * This module was built from original https://github.com/flipperdevices/lab.flipper.net sources 
 * All rights reserved to Flipper Devices Inc.
 */
var b = Object.defineProperty;
var r = (s, n) => b(s, "name", { value: n, configurable: !0 });
var commonjsGlobal = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, indexMinimal = {}, minimal$1 = {}, aspromise = asPromise;
function asPromise(s, n) {
  for (var o = new Array(arguments.length - 1), t = 0, e = 2, i = !0; e < arguments.length; )
    o[t++] = arguments[e++];
  return new Promise(/* @__PURE__ */ r(function(c, l) {
    o[t] = /* @__PURE__ */ r(function(f) {
      if (i)
        if (i = !1, f)
          l(f);
        else {
          for (var p = new Array(arguments.length - 1), d = 0; d < p.length; )
            p[d++] = arguments[d];
          c.apply(null, p);
        }
    }, "callback");
    try {
      s.apply(n || null, o);
    } catch (a) {
      i && (i = !1, l(a));
    }
  }, "executor"));
}
r(asPromise, "asPromise");
var base64$1 = {};
(function(s) {
  var n = s;
  n.length = /* @__PURE__ */ r(function(c) {
    var l = c.length;
    if (!l)
      return 0;
    for (var a = 0; --l % 4 > 1 && c.charAt(l) === "="; )
      ++a;
    return Math.ceil(c.length * 3) / 4 - a;
  }, "length");
  for (var o = new Array(64), t = new Array(123), e = 0; e < 64; )
    t[o[e] = e < 26 ? e + 65 : e < 52 ? e + 71 : e < 62 ? e - 4 : e - 59 | 43] = e++;
  n.encode = /* @__PURE__ */ r(function(c, l, a) {
    for (var f = null, p = [], d = 0, y = 0, R; l < a; ) {
      var h = c[l++];
      switch (y) {
        case 0:
          p[d++] = o[h >> 2], R = (h & 3) << 4, y = 1;
          break;
        case 1:
          p[d++] = o[R | h >> 4], R = (h & 15) << 2, y = 2;
          break;
        case 2:
          p[d++] = o[R | h >> 6], p[d++] = o[h & 63], y = 0;
          break;
      }
      d > 8191 && ((f || (f = [])).push(String.fromCharCode.apply(String, p)), d = 0);
    }
    return y && (p[d++] = o[R], p[d++] = 61, y === 1 && (p[d++] = 61)), f ? (d && f.push(String.fromCharCode.apply(String, p.slice(0, d))), f.join("")) : String.fromCharCode.apply(String, p.slice(0, d));
  }, "encode");
  var i = "invalid encoding";
  n.decode = /* @__PURE__ */ r(function(c, l, a) {
    for (var f = a, p = 0, d, y = 0; y < c.length; ) {
      var R = c.charCodeAt(y++);
      if (R === 61 && p > 1)
        break;
      if ((R = t[R]) === void 0)
        throw Error(i);
      switch (p) {
        case 0:
          d = R, p = 1;
          break;
        case 1:
          l[a++] = d << 2 | (R & 48) >> 4, d = R, p = 2;
          break;
        case 2:
          l[a++] = (d & 15) << 4 | (R & 60) >> 2, d = R, p = 3;
          break;
        case 3:
          l[a++] = (d & 3) << 6 | R, p = 0;
          break;
      }
    }
    if (p === 1)
      throw Error(i);
    return a - f;
  }, "decode"), n.test = /* @__PURE__ */ r(function(c) {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(c);
  }, "test");
})(base64$1);
var eventemitter = EventEmitter;
function EventEmitter() {
  this._listeners = {};
}
r(EventEmitter, "EventEmitter");
EventEmitter.prototype.on = /* @__PURE__ */ r(function(n, o, t) {
  return (this._listeners[n] || (this._listeners[n] = [])).push({
    fn: o,
    ctx: t || this
  }), this;
}, "on");
EventEmitter.prototype.off = /* @__PURE__ */ r(function(n, o) {
  if (n === void 0)
    this._listeners = {};
  else if (o === void 0)
    this._listeners[n] = [];
  else
    for (var t = this._listeners[n], e = 0; e < t.length; )
      t[e].fn === o ? t.splice(e, 1) : ++e;
  return this;
}, "off");
EventEmitter.prototype.emit = /* @__PURE__ */ r(function(n) {
  var o = this._listeners[n];
  if (o) {
    for (var t = [], e = 1; e < arguments.length; )
      t.push(arguments[e++]);
    for (e = 0; e < o.length; )
      o[e].fn.apply(o[e++].ctx, t);
  }
  return this;
}, "emit");
var float = factory(factory);
function factory(s) {
  return typeof Float32Array < "u" ? function() {
    var n = new Float32Array([-0]), o = new Uint8Array(n.buffer), t = o[3] === 128;
    function e(l, a, f) {
      n[0] = l, a[f] = o[0], a[f + 1] = o[1], a[f + 2] = o[2], a[f + 3] = o[3];
    }
    r(e, "writeFloat_f32_cpy");
    function i(l, a, f) {
      n[0] = l, a[f] = o[3], a[f + 1] = o[2], a[f + 2] = o[1], a[f + 3] = o[0];
    }
    r(i, "writeFloat_f32_rev"), s.writeFloatLE = t ? e : i, s.writeFloatBE = t ? i : e;
    function u(l, a) {
      return o[0] = l[a], o[1] = l[a + 1], o[2] = l[a + 2], o[3] = l[a + 3], n[0];
    }
    r(u, "readFloat_f32_cpy");
    function c(l, a) {
      return o[3] = l[a], o[2] = l[a + 1], o[1] = l[a + 2], o[0] = l[a + 3], n[0];
    }
    r(c, "readFloat_f32_rev"), s.readFloatLE = t ? u : c, s.readFloatBE = t ? c : u;
  }() : function() {
    function n(t, e, i, u) {
      var c = e < 0 ? 1 : 0;
      if (c && (e = -e), e === 0)
        t(1 / e > 0 ? (
          /* positive */
          0
        ) : (
          /* negative 0 */
          2147483648
        ), i, u);
      else if (isNaN(e))
        t(2143289344, i, u);
      else if (e > 34028234663852886e22)
        t((c << 31 | 2139095040) >>> 0, i, u);
      else if (e < 11754943508222875e-54)
        t((c << 31 | Math.round(e / 1401298464324817e-60)) >>> 0, i, u);
      else {
        var l = Math.floor(Math.log(e) / Math.LN2), a = Math.round(e * Math.pow(2, -l) * 8388608) & 8388607;
        t((c << 31 | l + 127 << 23 | a) >>> 0, i, u);
      }
    }
    r(n, "writeFloat_ieee754"), s.writeFloatLE = n.bind(null, writeUintLE), s.writeFloatBE = n.bind(null, writeUintBE);
    function o(t, e, i) {
      var u = t(e, i), c = (u >> 31) * 2 + 1, l = u >>> 23 & 255, a = u & 8388607;
      return l === 255 ? a ? NaN : c * (1 / 0) : l === 0 ? c * 1401298464324817e-60 * a : c * Math.pow(2, l - 150) * (a + 8388608);
    }
    r(o, "readFloat_ieee754"), s.readFloatLE = o.bind(null, readUintLE), s.readFloatBE = o.bind(null, readUintBE);
  }(), typeof Float64Array < "u" ? function() {
    var n = new Float64Array([-0]), o = new Uint8Array(n.buffer), t = o[7] === 128;
    function e(l, a, f) {
      n[0] = l, a[f] = o[0], a[f + 1] = o[1], a[f + 2] = o[2], a[f + 3] = o[3], a[f + 4] = o[4], a[f + 5] = o[5], a[f + 6] = o[6], a[f + 7] = o[7];
    }
    r(e, "writeDouble_f64_cpy");
    function i(l, a, f) {
      n[0] = l, a[f] = o[7], a[f + 1] = o[6], a[f + 2] = o[5], a[f + 3] = o[4], a[f + 4] = o[3], a[f + 5] = o[2], a[f + 6] = o[1], a[f + 7] = o[0];
    }
    r(i, "writeDouble_f64_rev"), s.writeDoubleLE = t ? e : i, s.writeDoubleBE = t ? i : e;
    function u(l, a) {
      return o[0] = l[a], o[1] = l[a + 1], o[2] = l[a + 2], o[3] = l[a + 3], o[4] = l[a + 4], o[5] = l[a + 5], o[6] = l[a + 6], o[7] = l[a + 7], n[0];
    }
    r(u, "readDouble_f64_cpy");
    function c(l, a) {
      return o[7] = l[a], o[6] = l[a + 1], o[5] = l[a + 2], o[4] = l[a + 3], o[3] = l[a + 4], o[2] = l[a + 5], o[1] = l[a + 6], o[0] = l[a + 7], n[0];
    }
    r(c, "readDouble_f64_rev"), s.readDoubleLE = t ? u : c, s.readDoubleBE = t ? c : u;
  }() : function() {
    function n(t, e, i, u, c, l) {
      var a = u < 0 ? 1 : 0;
      if (a && (u = -u), u === 0)
        t(0, c, l + e), t(1 / u > 0 ? (
          /* positive */
          0
        ) : (
          /* negative 0 */
          2147483648
        ), c, l + i);
      else if (isNaN(u))
        t(0, c, l + e), t(2146959360, c, l + i);
      else if (u > 17976931348623157e292)
        t(0, c, l + e), t((a << 31 | 2146435072) >>> 0, c, l + i);
      else {
        var f;
        if (u < 22250738585072014e-324)
          f = u / 5e-324, t(f >>> 0, c, l + e), t((a << 31 | f / 4294967296) >>> 0, c, l + i);
        else {
          var p = Math.floor(Math.log(u) / Math.LN2);
          p === 1024 && (p = 1023), f = u * Math.pow(2, -p), t(f * 4503599627370496 >>> 0, c, l + e), t((a << 31 | p + 1023 << 20 | f * 1048576 & 1048575) >>> 0, c, l + i);
        }
      }
    }
    r(n, "writeDouble_ieee754"), s.writeDoubleLE = n.bind(null, writeUintLE, 0, 4), s.writeDoubleBE = n.bind(null, writeUintBE, 4, 0);
    function o(t, e, i, u, c) {
      var l = t(u, c + e), a = t(u, c + i), f = (a >> 31) * 2 + 1, p = a >>> 20 & 2047, d = 4294967296 * (a & 1048575) + l;
      return p === 2047 ? d ? NaN : f * (1 / 0) : p === 0 ? f * 5e-324 * d : f * Math.pow(2, p - 1075) * (d + 4503599627370496);
    }
    r(o, "readDouble_ieee754"), s.readDoubleLE = o.bind(null, readUintLE, 0, 4), s.readDoubleBE = o.bind(null, readUintBE, 4, 0);
  }(), s;
}
r(factory, "factory");
function writeUintLE(s, n, o) {
  n[o] = s & 255, n[o + 1] = s >>> 8 & 255, n[o + 2] = s >>> 16 & 255, n[o + 3] = s >>> 24;
}
r(writeUintLE, "writeUintLE");
function writeUintBE(s, n, o) {
  n[o] = s >>> 24, n[o + 1] = s >>> 16 & 255, n[o + 2] = s >>> 8 & 255, n[o + 3] = s & 255;
}
r(writeUintBE, "writeUintBE");
function readUintLE(s, n) {
  return (s[n] | s[n + 1] << 8 | s[n + 2] << 16 | s[n + 3] << 24) >>> 0;
}
r(readUintLE, "readUintLE");
function readUintBE(s, n) {
  return (s[n] << 24 | s[n + 1] << 16 | s[n + 2] << 8 | s[n + 3]) >>> 0;
}
r(readUintBE, "readUintBE");
var inquire_1 = inquire;
function inquire(moduleName) {
  try {
    var mod = eval("quire".replace(/^/, "re"))(moduleName);
    if (mod && (mod.length || Object.keys(mod).length))
      return mod;
  } catch (s) {
  }
  return null;
}
r(inquire, "inquire");
var utf8$2 = {};
(function(s) {
  var n = s;
  n.length = /* @__PURE__ */ r(function(t) {
    for (var e = 0, i = 0, u = 0; u < t.length; ++u)
      i = t.charCodeAt(u), i < 128 ? e += 1 : i < 2048 ? e += 2 : (i & 64512) === 55296 && (t.charCodeAt(u + 1) & 64512) === 56320 ? (++u, e += 4) : e += 3;
    return e;
  }, "utf8_length"), n.read = /* @__PURE__ */ r(function(t, e, i) {
    var u = i - e;
    if (u < 1)
      return "";
    for (var c = null, l = [], a = 0, f; e < i; )
      f = t[e++], f < 128 ? l[a++] = f : f > 191 && f < 224 ? l[a++] = (f & 31) << 6 | t[e++] & 63 : f > 239 && f < 365 ? (f = ((f & 7) << 18 | (t[e++] & 63) << 12 | (t[e++] & 63) << 6 | t[e++] & 63) - 65536, l[a++] = 55296 + (f >> 10), l[a++] = 56320 + (f & 1023)) : l[a++] = (f & 15) << 12 | (t[e++] & 63) << 6 | t[e++] & 63, a > 8191 && ((c || (c = [])).push(String.fromCharCode.apply(String, l)), a = 0);
    return c ? (a && c.push(String.fromCharCode.apply(String, l.slice(0, a))), c.join("")) : String.fromCharCode.apply(String, l.slice(0, a));
  }, "utf8_read"), n.write = /* @__PURE__ */ r(function(t, e, i) {
    for (var u = i, c, l, a = 0; a < t.length; ++a)
      c = t.charCodeAt(a), c < 128 ? e[i++] = c : c < 2048 ? (e[i++] = c >> 6 | 192, e[i++] = c & 63 | 128) : (c & 64512) === 55296 && ((l = t.charCodeAt(a + 1)) & 64512) === 56320 ? (c = 65536 + ((c & 1023) << 10) + (l & 1023), ++a, e[i++] = c >> 18 | 240, e[i++] = c >> 12 & 63 | 128, e[i++] = c >> 6 & 63 | 128, e[i++] = c & 63 | 128) : (e[i++] = c >> 12 | 224, e[i++] = c >> 6 & 63 | 128, e[i++] = c & 63 | 128);
    return i - u;
  }, "utf8_write");
})(utf8$2);
var pool_1 = pool;
function pool(s, n, o) {
  var t = o || 8192, e = t >>> 1, i = null, u = t;
  return /* @__PURE__ */ r(function(l) {
    if (l < 1 || l > e)
      return s(l);
    u + l > t && (i = s(t), u = 0);
    var a = n.call(i, u, u += l);
    return u & 7 && (u = (u | 7) + 1), a;
  }, "pool_alloc");
}
r(pool, "pool");
var longbits, hasRequiredLongbits;
function requireLongbits() {
  if (hasRequiredLongbits)
    return longbits;
  hasRequiredLongbits = 1, longbits = n;
  var s = requireMinimal();
  function n(i, u) {
    this.lo = i >>> 0, this.hi = u >>> 0;
  }
  r(n, "LongBits");
  var o = n.zero = new n(0, 0);
  o.toNumber = function() {
    return 0;
  }, o.zzEncode = o.zzDecode = function() {
    return this;
  }, o.length = function() {
    return 1;
  };
  var t = n.zeroHash = "\0\0\0\0\0\0\0\0";
  n.fromNumber = /* @__PURE__ */ r(function(u) {
    if (u === 0)
      return o;
    var c = u < 0;
    c && (u = -u);
    var l = u >>> 0, a = (u - l) / 4294967296 >>> 0;
    return c && (a = ~a >>> 0, l = ~l >>> 0, ++l > 4294967295 && (l = 0, ++a > 4294967295 && (a = 0))), new n(l, a);
  }, "fromNumber"), n.from = /* @__PURE__ */ r(function(u) {
    if (typeof u == "number")
      return n.fromNumber(u);
    if (s.isString(u))
      if (s.Long)
        u = s.Long.fromString(u);
      else
        return n.fromNumber(parseInt(u, 10));
    return u.low || u.high ? new n(u.low >>> 0, u.high >>> 0) : o;
  }, "from"), n.prototype.toNumber = /* @__PURE__ */ r(function(u) {
    if (!u && this.hi >>> 31) {
      var c = ~this.lo + 1 >>> 0, l = ~this.hi >>> 0;
      return c || (l = l + 1 >>> 0), -(c + l * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
  }, "toNumber"), n.prototype.toLong = /* @__PURE__ */ r(function(u) {
    return s.Long ? new s.Long(this.lo | 0, this.hi | 0, !!u) : { low: this.lo | 0, high: this.hi | 0, unsigned: !!u };
  }, "toLong");
  var e = String.prototype.charCodeAt;
  return n.fromHash = /* @__PURE__ */ r(function(u) {
    return u === t ? o : new n(
      (e.call(u, 0) | e.call(u, 1) << 8 | e.call(u, 2) << 16 | e.call(u, 3) << 24) >>> 0,
      (e.call(u, 4) | e.call(u, 5) << 8 | e.call(u, 6) << 16 | e.call(u, 7) << 24) >>> 0
    );
  }, "fromHash"), n.prototype.toHash = /* @__PURE__ */ r(function() {
    return String.fromCharCode(
      this.lo & 255,
      this.lo >>> 8 & 255,
      this.lo >>> 16 & 255,
      this.lo >>> 24,
      this.hi & 255,
      this.hi >>> 8 & 255,
      this.hi >>> 16 & 255,
      this.hi >>> 24
    );
  }, "toHash"), n.prototype.zzEncode = /* @__PURE__ */ r(function() {
    var u = this.hi >> 31;
    return this.hi = ((this.hi << 1 | this.lo >>> 31) ^ u) >>> 0, this.lo = (this.lo << 1 ^ u) >>> 0, this;
  }, "zzEncode"), n.prototype.zzDecode = /* @__PURE__ */ r(function() {
    var u = -(this.lo & 1);
    return this.lo = ((this.lo >>> 1 | this.hi << 31) ^ u) >>> 0, this.hi = (this.hi >>> 1 ^ u) >>> 0, this;
  }, "zzDecode"), n.prototype.length = /* @__PURE__ */ r(function() {
    var u = this.lo, c = (this.lo >>> 28 | this.hi << 4) >>> 0, l = this.hi >>> 24;
    return l === 0 ? c === 0 ? u < 16384 ? u < 128 ? 1 : 2 : u < 2097152 ? 3 : 4 : c < 16384 ? c < 128 ? 5 : 6 : c < 2097152 ? 7 : 8 : l < 128 ? 9 : 10;
  }, "length"), longbits;
}
r(requireLongbits, "requireLongbits");
var hasRequiredMinimal;
function requireMinimal() {
  return hasRequiredMinimal || (hasRequiredMinimal = 1, function(s) {
    var n = s;
    n.asPromise = aspromise, n.base64 = base64$1, n.EventEmitter = eventemitter, n.float = float, n.inquire = inquire_1, n.utf8 = utf8$2, n.pool = pool_1, n.LongBits = requireLongbits(), n.isNode = !!(typeof commonjsGlobal < "u" && commonjsGlobal && commonjsGlobal.process && commonjsGlobal.process.versions && commonjsGlobal.process.versions.node), n.global = n.isNode && commonjsGlobal || typeof window < "u" && window || typeof self < "u" && self || commonjsGlobal, n.emptyArray = Object.freeze ? Object.freeze([]) : (
      /* istanbul ignore next */
      []
    ), n.emptyObject = Object.freeze ? Object.freeze({}) : (
      /* istanbul ignore next */
      {}
    ), n.isInteger = Number.isInteger || /* istanbul ignore next */
    /* @__PURE__ */ r(function(i) {
      return typeof i == "number" && isFinite(i) && Math.floor(i) === i;
    }, "isInteger"), n.isString = /* @__PURE__ */ r(function(i) {
      return typeof i == "string" || i instanceof String;
    }, "isString"), n.isObject = /* @__PURE__ */ r(function(i) {
      return i && typeof i == "object";
    }, "isObject"), n.isset = /**
     * Checks if a property on a message is considered to be present.
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    n.isSet = /* @__PURE__ */ r(function(i, u) {
      var c = i[u];
      return c != null && i.hasOwnProperty(u) ? typeof c != "object" || (Array.isArray(c) ? c.length : Object.keys(c).length) > 0 : !1;
    }, "isSet"), n.Buffer = function() {
      try {
        var e = n.inquire("buffer").Buffer;
        return e.prototype.utf8Write ? e : (
          /* istanbul ignore next */
          null
        );
      } catch {
        return null;
      }
    }(), n._Buffer_from = null, n._Buffer_allocUnsafe = null, n.newBuffer = /* @__PURE__ */ r(function(i) {
      return typeof i == "number" ? n.Buffer ? n._Buffer_allocUnsafe(i) : new n.Array(i) : n.Buffer ? n._Buffer_from(i) : typeof Uint8Array > "u" ? i : new Uint8Array(i);
    }, "newBuffer"), n.Array = typeof Uint8Array < "u" ? Uint8Array : Array, n.Long = /* istanbul ignore next */
    n.global.dcodeIO && /* istanbul ignore next */
    n.global.dcodeIO.Long || /* istanbul ignore next */
    n.global.Long || n.inquire("long"), n.key2Re = /^true|false|0|1$/, n.key32Re = /^-?(?:0|[1-9][0-9]*)$/, n.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/, n.longToHash = /* @__PURE__ */ r(function(i) {
      return i ? n.LongBits.from(i).toHash() : n.LongBits.zeroHash;
    }, "longToHash"), n.longFromHash = /* @__PURE__ */ r(function(i, u) {
      var c = n.LongBits.fromHash(i);
      return n.Long ? n.Long.fromBits(c.lo, c.hi, u) : c.toNumber(!!u);
    }, "longFromHash");
    function o(e, i, u) {
      for (var c = Object.keys(i), l = 0; l < c.length; ++l)
        (e[c[l]] === void 0 || !u) && (e[c[l]] = i[c[l]]);
      return e;
    }
    r(o, "merge"), n.merge = o, n.lcFirst = /* @__PURE__ */ r(function(i) {
      return i.charAt(0).toLowerCase() + i.substring(1);
    }, "lcFirst");
    function t(e) {
      function i(u, c) {
        if (!(this instanceof i))
          return new i(u, c);
        Object.defineProperty(this, "message", { get: function() {
          return u;
        } }), Error.captureStackTrace ? Error.captureStackTrace(this, i) : Object.defineProperty(this, "stack", { value: new Error().stack || "" }), c && o(this, c);
      }
      return r(i, "CustomError"), (i.prototype = Object.create(Error.prototype)).constructor = i, Object.defineProperty(i.prototype, "name", { get: function() {
        return e;
      } }), i.prototype.toString = /* @__PURE__ */ r(function() {
        return this.name + ": " + this.message;
      }, "toString"), i;
    }
    r(t, "newError"), n.newError = t, n.ProtocolError = t("ProtocolError"), n.oneOfGetter = /* @__PURE__ */ r(function(i) {
      for (var u = {}, c = 0; c < i.length; ++c)
        u[i[c]] = 1;
      return function() {
        for (var l = Object.keys(this), a = l.length - 1; a > -1; --a)
          if (u[l[a]] === 1 && this[l[a]] !== void 0 && this[l[a]] !== null)
            return l[a];
      };
    }, "getOneOf"), n.oneOfSetter = /* @__PURE__ */ r(function(i) {
      return function(u) {
        for (var c = 0; c < i.length; ++c)
          i[c] !== u && delete this[i[c]];
      };
    }, "setOneOf"), n.toJSONOptions = {
      longs: String,
      enums: String,
      bytes: String,
      json: !0
    }, n._configure = function() {
      var e = n.Buffer;
      if (!e) {
        n._Buffer_from = n._Buffer_allocUnsafe = null;
        return;
      }
      n._Buffer_from = e.from !== Uint8Array.from && e.from || /* istanbul ignore next */
      /* @__PURE__ */ r(function(u, c) {
        return new e(u, c);
      }, "Buffer_from"), n._Buffer_allocUnsafe = e.allocUnsafe || /* istanbul ignore next */
      /* @__PURE__ */ r(function(u) {
        return new e(u);
      }, "Buffer_allocUnsafe");
    };
  }(minimal$1)), minimal$1;
}
r(requireMinimal, "requireMinimal");
var writer = Writer$1, util$4 = requireMinimal(), BufferWriter$1, LongBits$1 = util$4.LongBits, base64 = util$4.base64, utf8$1 = util$4.utf8;
function Op(s, n, o) {
  this.fn = s, this.len = n, this.next = void 0, this.val = o;
}
r(Op, "Op");
function noop() {
}
r(noop, "noop");
function State(s) {
  this.head = s.head, this.tail = s.tail, this.len = s.len, this.next = s.states;
}
r(State, "State");
function Writer$1() {
  this.len = 0, this.head = new Op(noop, 0, 0), this.tail = this.head, this.states = null;
}
r(Writer$1, "Writer$1");
var create$1 = /* @__PURE__ */ r(function s() {
  return util$4.Buffer ? /* @__PURE__ */ r(function() {
    return (Writer$1.create = /* @__PURE__ */ r(function() {
      return new BufferWriter$1();
    }, "create_buffer"))();
  }, "create_buffer_setup") : /* @__PURE__ */ r(function() {
    return new Writer$1();
  }, "create_array");
}, "create");
Writer$1.create = create$1();
Writer$1.alloc = /* @__PURE__ */ r(function s(n) {
  return new util$4.Array(n);
}, "alloc");
util$4.Array !== Array && (Writer$1.alloc = util$4.pool(Writer$1.alloc, util$4.Array.prototype.subarray));
Writer$1.prototype._push = /* @__PURE__ */ r(function s(n, o, t) {
  return this.tail = this.tail.next = new Op(n, o, t), this.len += o, this;
}, "push");
function writeByte(s, n, o) {
  n[o] = s & 255;
}
r(writeByte, "writeByte");
function writeVarint32(s, n, o) {
  for (; s > 127; )
    n[o++] = s & 127 | 128, s >>>= 7;
  n[o] = s;
}
r(writeVarint32, "writeVarint32");
function VarintOp(s, n) {
  this.len = s, this.next = void 0, this.val = n;
}
r(VarintOp, "VarintOp");
VarintOp.prototype = Object.create(Op.prototype);
VarintOp.prototype.fn = writeVarint32;
Writer$1.prototype.uint32 = /* @__PURE__ */ r(function s(n) {
  return this.len += (this.tail = this.tail.next = new VarintOp(
    (n = n >>> 0) < 128 ? 1 : n < 16384 ? 2 : n < 2097152 ? 3 : n < 268435456 ? 4 : 5,
    n
  )).len, this;
}, "write_uint32");
Writer$1.prototype.int32 = /* @__PURE__ */ r(function s(n) {
  return n < 0 ? this._push(writeVarint64, 10, LongBits$1.fromNumber(n)) : this.uint32(n);
}, "write_int32");
Writer$1.prototype.sint32 = /* @__PURE__ */ r(function s(n) {
  return this.uint32((n << 1 ^ n >> 31) >>> 0);
}, "write_sint32");
function writeVarint64(s, n, o) {
  for (; s.hi; )
    n[o++] = s.lo & 127 | 128, s.lo = (s.lo >>> 7 | s.hi << 25) >>> 0, s.hi >>>= 7;
  for (; s.lo > 127; )
    n[o++] = s.lo & 127 | 128, s.lo = s.lo >>> 7;
  n[o++] = s.lo;
}
r(writeVarint64, "writeVarint64");
Writer$1.prototype.uint64 = /* @__PURE__ */ r(function s(n) {
  var o = LongBits$1.from(n);
  return this._push(writeVarint64, o.length(), o);
}, "write_uint64");
Writer$1.prototype.int64 = Writer$1.prototype.uint64;
Writer$1.prototype.sint64 = /* @__PURE__ */ r(function s(n) {
  var o = LongBits$1.from(n).zzEncode();
  return this._push(writeVarint64, o.length(), o);
}, "write_sint64");
Writer$1.prototype.bool = /* @__PURE__ */ r(function s(n) {
  return this._push(writeByte, 1, n ? 1 : 0);
}, "write_bool");
function writeFixed32(s, n, o) {
  n[o] = s & 255, n[o + 1] = s >>> 8 & 255, n[o + 2] = s >>> 16 & 255, n[o + 3] = s >>> 24;
}
r(writeFixed32, "writeFixed32");
Writer$1.prototype.fixed32 = /* @__PURE__ */ r(function s(n) {
  return this._push(writeFixed32, 4, n >>> 0);
}, "write_fixed32");
Writer$1.prototype.sfixed32 = Writer$1.prototype.fixed32;
Writer$1.prototype.fixed64 = /* @__PURE__ */ r(function s(n) {
  var o = LongBits$1.from(n);
  return this._push(writeFixed32, 4, o.lo)._push(writeFixed32, 4, o.hi);
}, "write_fixed64");
Writer$1.prototype.sfixed64 = Writer$1.prototype.fixed64;
Writer$1.prototype.float = /* @__PURE__ */ r(function s(n) {
  return this._push(util$4.float.writeFloatLE, 4, n);
}, "write_float");
Writer$1.prototype.double = /* @__PURE__ */ r(function s(n) {
  return this._push(util$4.float.writeDoubleLE, 8, n);
}, "write_double");
var writeBytes = util$4.Array.prototype.set ? /* @__PURE__ */ r(function s(n, o, t) {
  o.set(n, t);
}, "writeBytes_set") : /* @__PURE__ */ r(function s(n, o, t) {
  for (var e = 0; e < n.length; ++e)
    o[t + e] = n[e];
}, "writeBytes_for");
Writer$1.prototype.bytes = /* @__PURE__ */ r(function s(n) {
  var o = n.length >>> 0;
  if (!o)
    return this._push(writeByte, 1, 0);
  if (util$4.isString(n)) {
    var t = Writer$1.alloc(o = base64.length(n));
    base64.decode(n, t, 0), n = t;
  }
  return this.uint32(o)._push(writeBytes, o, n);
}, "write_bytes");
Writer$1.prototype.string = /* @__PURE__ */ r(function s(n) {
  var o = utf8$1.length(n);
  return o ? this.uint32(o)._push(utf8$1.write, o, n) : this._push(writeByte, 1, 0);
}, "write_string");
Writer$1.prototype.fork = /* @__PURE__ */ r(function s() {
  return this.states = new State(this), this.head = this.tail = new Op(noop, 0, 0), this.len = 0, this;
}, "fork");
Writer$1.prototype.reset = /* @__PURE__ */ r(function s() {
  return this.states ? (this.head = this.states.head, this.tail = this.states.tail, this.len = this.states.len, this.states = this.states.next) : (this.head = this.tail = new Op(noop, 0, 0), this.len = 0), this;
}, "reset");
Writer$1.prototype.ldelim = /* @__PURE__ */ r(function s() {
  var n = this.head, o = this.tail, t = this.len;
  return this.reset().uint32(t), t && (this.tail.next = n.next, this.tail = o, this.len += t), this;
}, "ldelim");
Writer$1.prototype.finish = /* @__PURE__ */ r(function s() {
  for (var n = this.head.next, o = this.constructor.alloc(this.len), t = 0; n; )
    n.fn(n.val, o, t), t += n.len, n = n.next;
  return o;
}, "finish");
Writer$1._configure = function(s) {
  BufferWriter$1 = s, Writer$1.create = create$1(), BufferWriter$1._configure();
};
var writer_buffer = BufferWriter, Writer = writer;
(BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;
var util$3 = requireMinimal();
function BufferWriter() {
  Writer.call(this);
}
r(BufferWriter, "BufferWriter");
BufferWriter._configure = function() {
  BufferWriter.alloc = util$3._Buffer_allocUnsafe, BufferWriter.writeBytesBuffer = util$3.Buffer && util$3.Buffer.prototype instanceof Uint8Array && util$3.Buffer.prototype.set.name === "set" ? /* @__PURE__ */ r(function(n, o, t) {
    o.set(n, t);
  }, "writeBytesBuffer_set") : /* @__PURE__ */ r(function(n, o, t) {
    if (n.copy)
      n.copy(o, t, 0, n.length);
    else
      for (var e = 0; e < n.length; )
        o[t++] = n[e++];
  }, "writeBytesBuffer_copy");
};
BufferWriter.prototype.bytes = /* @__PURE__ */ r(function s(n) {
  util$3.isString(n) && (n = util$3._Buffer_from(n, "base64"));
  var o = n.length >>> 0;
  return this.uint32(o), o && this._push(BufferWriter.writeBytesBuffer, o, n), this;
}, "write_bytes_buffer");
function writeStringBuffer(s, n, o) {
  s.length < 40 ? util$3.utf8.write(s, n, o) : n.utf8Write ? n.utf8Write(s, o) : n.write(s, o);
}
r(writeStringBuffer, "writeStringBuffer");
BufferWriter.prototype.string = /* @__PURE__ */ r(function s(n) {
  var o = util$3.Buffer.byteLength(n);
  return this.uint32(o), o && this._push(writeStringBuffer, o, n), this;
}, "write_string_buffer");
BufferWriter._configure();
var reader = Reader$1, util$2 = requireMinimal(), BufferReader$1, LongBits = util$2.LongBits, utf8 = util$2.utf8;
function indexOutOfRange(s, n) {
  return RangeError("index out of range: " + s.pos + " + " + (n || 1) + " > " + s.len);
}
r(indexOutOfRange, "indexOutOfRange");
function Reader$1(s) {
  this.buf = s, this.pos = 0, this.len = s.length;
}
r(Reader$1, "Reader$1");
var create_array = typeof Uint8Array < "u" ? /* @__PURE__ */ r(function s(n) {
  if (n instanceof Uint8Array || Array.isArray(n))
    return new Reader$1(n);
  throw Error("illegal buffer");
}, "create_typed_array") : /* @__PURE__ */ r(function s(n) {
  if (Array.isArray(n))
    return new Reader$1(n);
  throw Error("illegal buffer");
}, "create_array"), create = /* @__PURE__ */ r(function s() {
  return util$2.Buffer ? /* @__PURE__ */ r(function(o) {
    return (Reader$1.create = /* @__PURE__ */ r(function(e) {
      return util$2.Buffer.isBuffer(e) ? new BufferReader$1(e) : create_array(e);
    }, "create_buffer"))(o);
  }, "create_buffer_setup") : create_array;
}, "create");
Reader$1.create = create();
Reader$1.prototype._slice = util$2.Array.prototype.subarray || /* istanbul ignore next */
util$2.Array.prototype.slice;
Reader$1.prototype.uint32 = (/* @__PURE__ */ r(function s() {
  var n = 4294967295;
  return /* @__PURE__ */ r(function() {
    if (n = (this.buf[this.pos] & 127) >>> 0, this.buf[this.pos++] < 128 || (n = (n | (this.buf[this.pos] & 127) << 7) >>> 0, this.buf[this.pos++] < 128) || (n = (n | (this.buf[this.pos] & 127) << 14) >>> 0, this.buf[this.pos++] < 128) || (n = (n | (this.buf[this.pos] & 127) << 21) >>> 0, this.buf[this.pos++] < 128) || (n = (n | (this.buf[this.pos] & 15) << 28) >>> 0, this.buf[this.pos++] < 128))
      return n;
    if ((this.pos += 5) > this.len)
      throw this.pos = this.len, indexOutOfRange(this, 10);
    return n;
  }, "read_uint32");
}, "read_uint32_setup"))();
Reader$1.prototype.int32 = /* @__PURE__ */ r(function s() {
  return this.uint32() | 0;
}, "read_int32");
Reader$1.prototype.sint32 = /* @__PURE__ */ r(function s() {
  var n = this.uint32();
  return n >>> 1 ^ -(n & 1) | 0;
}, "read_sint32");
function readLongVarint() {
  var s = new LongBits(0, 0), n = 0;
  if (this.len - this.pos > 4) {
    for (; n < 4; ++n)
      if (s.lo = (s.lo | (this.buf[this.pos] & 127) << n * 7) >>> 0, this.buf[this.pos++] < 128)
        return s;
    if (s.lo = (s.lo | (this.buf[this.pos] & 127) << 28) >>> 0, s.hi = (s.hi | (this.buf[this.pos] & 127) >> 4) >>> 0, this.buf[this.pos++] < 128)
      return s;
    n = 0;
  } else {
    for (; n < 3; ++n) {
      if (this.pos >= this.len)
        throw indexOutOfRange(this);
      if (s.lo = (s.lo | (this.buf[this.pos] & 127) << n * 7) >>> 0, this.buf[this.pos++] < 128)
        return s;
    }
    return s.lo = (s.lo | (this.buf[this.pos++] & 127) << n * 7) >>> 0, s;
  }
  if (this.len - this.pos > 4) {
    for (; n < 5; ++n)
      if (s.hi = (s.hi | (this.buf[this.pos] & 127) << n * 7 + 3) >>> 0, this.buf[this.pos++] < 128)
        return s;
  } else
    for (; n < 5; ++n) {
      if (this.pos >= this.len)
        throw indexOutOfRange(this);
      if (s.hi = (s.hi | (this.buf[this.pos] & 127) << n * 7 + 3) >>> 0, this.buf[this.pos++] < 128)
        return s;
    }
  throw Error("invalid varint encoding");
}
r(readLongVarint, "readLongVarint");
Reader$1.prototype.bool = /* @__PURE__ */ r(function s() {
  return this.uint32() !== 0;
}, "read_bool");
function readFixed32_end(s, n) {
  return (s[n - 4] | s[n - 3] << 8 | s[n - 2] << 16 | s[n - 1] << 24) >>> 0;
}
r(readFixed32_end, "readFixed32_end");
Reader$1.prototype.fixed32 = /* @__PURE__ */ r(function s() {
  if (this.pos + 4 > this.len)
    throw indexOutOfRange(this, 4);
  return readFixed32_end(this.buf, this.pos += 4);
}, "read_fixed32");
Reader$1.prototype.sfixed32 = /* @__PURE__ */ r(function s() {
  if (this.pos + 4 > this.len)
    throw indexOutOfRange(this, 4);
  return readFixed32_end(this.buf, this.pos += 4) | 0;
}, "read_sfixed32");
function readFixed64() {
  if (this.pos + 8 > this.len)
    throw indexOutOfRange(this, 8);
  return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
}
r(readFixed64, "readFixed64");
Reader$1.prototype.float = /* @__PURE__ */ r(function s() {
  if (this.pos + 4 > this.len)
    throw indexOutOfRange(this, 4);
  var n = util$2.float.readFloatLE(this.buf, this.pos);
  return this.pos += 4, n;
}, "read_float");
Reader$1.prototype.double = /* @__PURE__ */ r(function s() {
  if (this.pos + 8 > this.len)
    throw indexOutOfRange(this, 4);
  var n = util$2.float.readDoubleLE(this.buf, this.pos);
  return this.pos += 8, n;
}, "read_double");
Reader$1.prototype.bytes = /* @__PURE__ */ r(function s() {
  var n = this.uint32(), o = this.pos, t = this.pos + n;
  if (t > this.len)
    throw indexOutOfRange(this, n);
  return this.pos += n, Array.isArray(this.buf) ? this.buf.slice(o, t) : o === t ? new this.buf.constructor(0) : this._slice.call(this.buf, o, t);
}, "read_bytes");
Reader$1.prototype.string = /* @__PURE__ */ r(function s() {
  var n = this.bytes();
  return utf8.read(n, 0, n.length);
}, "read_string");
Reader$1.prototype.skip = /* @__PURE__ */ r(function s(n) {
  if (typeof n == "number") {
    if (this.pos + n > this.len)
      throw indexOutOfRange(this, n);
    this.pos += n;
  } else
    do
      if (this.pos >= this.len)
        throw indexOutOfRange(this);
    while (this.buf[this.pos++] & 128);
  return this;
}, "skip");
Reader$1.prototype.skipType = function(s) {
  switch (s) {
    case 0:
      this.skip();
      break;
    case 1:
      this.skip(8);
      break;
    case 2:
      this.skip(this.uint32());
      break;
    case 3:
      for (; (s = this.uint32() & 7) !== 4; )
        this.skipType(s);
      break;
    case 5:
      this.skip(4);
      break;
    default:
      throw Error("invalid wire type " + s + " at offset " + this.pos);
  }
  return this;
};
Reader$1._configure = function(s) {
  BufferReader$1 = s, Reader$1.create = create(), BufferReader$1._configure();
  var n = util$2.Long ? "toLong" : (
    /* istanbul ignore next */
    "toNumber"
  );
  util$2.merge(Reader$1.prototype, {
    int64: /* @__PURE__ */ r(function() {
      return readLongVarint.call(this)[n](!1);
    }, "read_int64"),
    uint64: /* @__PURE__ */ r(function() {
      return readLongVarint.call(this)[n](!0);
    }, "read_uint64"),
    sint64: /* @__PURE__ */ r(function() {
      return readLongVarint.call(this).zzDecode()[n](!1);
    }, "read_sint64"),
    fixed64: /* @__PURE__ */ r(function() {
      return readFixed64.call(this)[n](!0);
    }, "read_fixed64"),
    sfixed64: /* @__PURE__ */ r(function() {
      return readFixed64.call(this)[n](!1);
    }, "read_sfixed64")
  });
};
var reader_buffer = BufferReader, Reader = reader;
(BufferReader.prototype = Object.create(Reader.prototype)).constructor = BufferReader;
var util$1 = requireMinimal();
function BufferReader(s) {
  Reader.call(this, s);
}
r(BufferReader, "BufferReader");
BufferReader._configure = function() {
  util$1.Buffer && (BufferReader.prototype._slice = util$1.Buffer.prototype.slice);
};
BufferReader.prototype.string = /* @__PURE__ */ r(function s() {
  var n = this.uint32();
  return this.buf.utf8Slice ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + n, this.len)) : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + n, this.len));
}, "read_string_buffer");
BufferReader._configure();
var rpc = {}, service = Service, util = requireMinimal();
(Service.prototype = Object.create(util.EventEmitter.prototype)).constructor = Service;
function Service(s, n, o) {
  if (typeof s != "function")
    throw TypeError("rpcImpl must be a function");
  util.EventEmitter.call(this), this.rpcImpl = s, this.requestDelimited = !!n, this.responseDelimited = !!o;
}
r(Service, "Service");
Service.prototype.rpcCall = /* @__PURE__ */ r(function s(n, o, t, e, i) {
  if (!e)
    throw TypeError("request must be specified");
  var u = this;
  if (!i)
    return util.asPromise(s, u, n, o, t, e);
  if (!u.rpcImpl) {
    setTimeout(function() {
      i(Error("already ended"));
    }, 0);
    return;
  }
  try {
    return u.rpcImpl(
      n,
      o[u.requestDelimited ? "encodeDelimited" : "encode"](e).finish(),
      /* @__PURE__ */ r(function(l, a) {
        if (l)
          return u.emit("error", l, n), i(l);
        if (a === null) {
          u.end(
            /* endedByRPC */
            !0
          );
          return;
        }
        if (!(a instanceof t))
          try {
            a = t[u.responseDelimited ? "decodeDelimited" : "decode"](a);
          } catch (f) {
            return u.emit("error", f, n), i(f);
          }
        return u.emit("data", a, n), i(null, a);
      }, "rpcCallback")
    );
  } catch (c) {
    u.emit("error", c, n), setTimeout(function() {
      i(c);
    }, 0);
    return;
  }
}, "rpcCall");
Service.prototype.end = /* @__PURE__ */ r(function s(n) {
  return this.rpcImpl && (n || this.rpcImpl(null, null, null), this.rpcImpl = null, this.emit("end").off()), this;
}, "end");
(function(s) {
  var n = s;
  n.Service = service;
})(rpc);
var roots = {};
(function(s) {
  var n = s;
  n.build = "minimal", n.Writer = writer, n.BufferWriter = writer_buffer, n.Reader = reader, n.BufferReader = reader_buffer, n.util = requireMinimal(), n.rpc = rpc, n.roots = roots, n.configure = o;
  function o() {
    n.util._configure(), n.Writer._configure(n.BufferWriter), n.Reader._configure(n.BufferReader);
  }
  r(o, "configure"), o();
})(indexMinimal);
var minimal = indexMinimal;
const $Reader = minimal.Reader, $Writer = minimal.Writer, $util = minimal.util, $root = minimal.roots.default || (minimal.roots.default = {});
$root.PB_App = (() => {
  const s = {};
  return s.StartRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "StartRequest"), n.prototype.name = "", n.prototype.args = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.name != null && Object.hasOwnProperty.call(t, "name") && e.uint32(10).string(t.name), t.args != null && Object.hasOwnProperty.call(t, "args") && e.uint32(18).string(t.args), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.StartRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.name = t.string();
            break;
          case 2:
            u.args = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.name != null && t.hasOwnProperty("name") && !$util.isString(t.name) ? "name: string expected" : t.args != null && t.hasOwnProperty("args") && !$util.isString(t.args) ? "args: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_App.StartRequest)
        return t;
      const e = new $root.PB_App.StartRequest();
      return t.name != null && (e.name = String(t.name)), t.args != null && (e.args = String(t.args)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.name = "", i.args = ""), t.name != null && t.hasOwnProperty("name") && (i.name = t.name), t.args != null && t.hasOwnProperty("args") && (i.args = t.args), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.LockStatusRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "LockStatusRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.LockStatusRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_App.LockStatusRequest ? t : new $root.PB_App.LockStatusRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.LockStatusResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "LockStatusResponse"), n.prototype.locked = !1, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.locked != null && Object.hasOwnProperty.call(t, "locked") && e.uint32(8).bool(t.locked), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.LockStatusResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.locked = t.bool();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.locked != null && t.hasOwnProperty("locked") && typeof t.locked != "boolean" ? "locked: boolean expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_App.LockStatusResponse)
        return t;
      const e = new $root.PB_App.LockStatusResponse();
      return t.locked != null && (e.locked = !!t.locked), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.locked = !1), t.locked != null && t.hasOwnProperty("locked") && (i.locked = t.locked), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.AppExitRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "AppExitRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.AppExitRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_App.AppExitRequest ? t : new $root.PB_App.AppExitRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.AppLoadFileRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "AppLoadFileRequest"), n.prototype.path = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.path != null && Object.hasOwnProperty.call(t, "path") && e.uint32(10).string(t.path), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.AppLoadFileRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.path = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.path != null && t.hasOwnProperty("path") && !$util.isString(t.path) ? "path: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_App.AppLoadFileRequest)
        return t;
      const e = new $root.PB_App.AppLoadFileRequest();
      return t.path != null && (e.path = String(t.path)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.path = ""), t.path != null && t.hasOwnProperty("path") && (i.path = t.path), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.AppButtonPressRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "AppButtonPressRequest"), n.prototype.args = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.args != null && Object.hasOwnProperty.call(t, "args") && e.uint32(10).string(t.args), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.AppButtonPressRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.args = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.args != null && t.hasOwnProperty("args") && !$util.isString(t.args) ? "args: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_App.AppButtonPressRequest)
        return t;
      const e = new $root.PB_App.AppButtonPressRequest();
      return t.args != null && (e.args = String(t.args)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.args = ""), t.args != null && t.hasOwnProperty("args") && (i.args = t.args), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.AppButtonReleaseRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "AppButtonReleaseRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.AppButtonReleaseRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_App.AppButtonReleaseRequest ? t : new $root.PB_App.AppButtonReleaseRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.AppState = function() {
    const n = {}, o = Object.create(n);
    return o[n[0] = "APP_CLOSED"] = 0, o[n[1] = "APP_STARTED"] = 1, o;
  }(), s.AppStateResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "AppStateResponse"), n.prototype.state = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.state != null && Object.hasOwnProperty.call(t, "state") && e.uint32(8).int32(t.state), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.AppStateResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.state = t.int32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.state != null && t.hasOwnProperty("state"))
        switch (t.state) {
          default:
            return "state: enum value expected";
          case 0:
          case 1:
            break;
        }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_App.AppStateResponse)
        return t;
      const e = new $root.PB_App.AppStateResponse();
      switch (t.state) {
        case "APP_CLOSED":
        case 0:
          e.state = 0;
          break;
        case "APP_STARTED":
        case 1:
          e.state = 1;
          break;
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.state = e.enums === String ? "APP_CLOSED" : 0), t.state != null && t.hasOwnProperty("state") && (i.state = e.enums === String ? $root.PB_App.AppState[t.state] : t.state), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.GetErrorRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "GetErrorRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.GetErrorRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_App.GetErrorRequest ? t : new $root.PB_App.GetErrorRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.GetErrorResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "GetErrorResponse"), n.prototype.code = 0, n.prototype.text = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.code != null && Object.hasOwnProperty.call(t, "code") && e.uint32(8).uint32(t.code), t.text != null && Object.hasOwnProperty.call(t, "text") && e.uint32(18).string(t.text), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.GetErrorResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.code = t.uint32();
            break;
          case 2:
            u.text = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.code != null && t.hasOwnProperty("code") && !$util.isInteger(t.code) ? "code: integer expected" : t.text != null && t.hasOwnProperty("text") && !$util.isString(t.text) ? "text: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_App.GetErrorResponse)
        return t;
      const e = new $root.PB_App.GetErrorResponse();
      return t.code != null && (e.code = t.code >>> 0), t.text != null && (e.text = String(t.text)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.code = 0, i.text = ""), t.code != null && t.hasOwnProperty("code") && (i.code = t.code), t.text != null && t.hasOwnProperty("text") && (i.text = t.text), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.DataExchangeRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "DataExchangeRequest"), n.prototype.data = $util.newBuffer([]), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.data != null && Object.hasOwnProperty.call(t, "data") && e.uint32(10).bytes(t.data), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_App.DataExchangeRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.data = t.bytes();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.data != null && t.hasOwnProperty("data") && !(t.data && typeof t.data.length == "number" || $util.isString(t.data)) ? "data: buffer expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_App.DataExchangeRequest)
        return t;
      const e = new $root.PB_App.DataExchangeRequest();
      return t.data != null && (typeof t.data == "string" ? $util.base64.decode(t.data, e.data = $util.newBuffer($util.base64.length(t.data)), 0) : t.data.length && (e.data = t.data)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (e.bytes === String ? i.data = "" : (i.data = [], e.bytes !== Array && (i.data = $util.newBuffer(i.data)))), t.data != null && t.hasOwnProperty("data") && (i.data = e.bytes === String ? $util.base64.encode(t.data, 0, t.data.length) : e.bytes === Array ? Array.prototype.slice.call(t.data) : t.data), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s;
})();
const PB = $root.PB = (() => {
  const s = {};
  return s.CommandStatus = function() {
    const n = {}, o = Object.create(n);
    return o[n[0] = "OK"] = 0, o[n[1] = "ERROR"] = 1, o[n[2] = "ERROR_DECODE"] = 2, o[n[3] = "ERROR_NOT_IMPLEMENTED"] = 3, o[n[4] = "ERROR_BUSY"] = 4, o[n[14] = "ERROR_CONTINUOUS_COMMAND_INTERRUPTED"] = 14, o[n[15] = "ERROR_INVALID_PARAMETERS"] = 15, o[n[5] = "ERROR_STORAGE_NOT_READY"] = 5, o[n[6] = "ERROR_STORAGE_EXIST"] = 6, o[n[7] = "ERROR_STORAGE_NOT_EXIST"] = 7, o[n[8] = "ERROR_STORAGE_INVALID_PARAMETER"] = 8, o[n[9] = "ERROR_STORAGE_DENIED"] = 9, o[n[10] = "ERROR_STORAGE_INVALID_NAME"] = 10, o[n[11] = "ERROR_STORAGE_INTERNAL"] = 11, o[n[12] = "ERROR_STORAGE_NOT_IMPLEMENTED"] = 12, o[n[13] = "ERROR_STORAGE_ALREADY_OPEN"] = 13, o[n[18] = "ERROR_STORAGE_DIR_NOT_EMPTY"] = 18, o[n[16] = "ERROR_APP_CANT_START"] = 16, o[n[17] = "ERROR_APP_SYSTEM_LOCKED"] = 17, o[n[21] = "ERROR_APP_NOT_RUNNING"] = 21, o[n[22] = "ERROR_APP_CMD_ERROR"] = 22, o[n[19] = "ERROR_VIRTUAL_DISPLAY_ALREADY_STARTED"] = 19, o[n[20] = "ERROR_VIRTUAL_DISPLAY_NOT_STARTED"] = 20, o[n[58] = "ERROR_GPIO_MODE_INCORRECT"] = 58, o[n[59] = "ERROR_GPIO_UNKNOWN_PIN_MODE"] = 59, o;
  }(), s.Empty = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "Empty"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB.Empty();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB.Empty ? t : new $root.PB.Empty();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.StopSession = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "StopSession"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB.StopSession();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB.StopSession ? t : new $root.PB.StopSession();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.Main = function() {
    function n(t) {
      if (t)
        for (let e = Object.keys(t), i = 0; i < e.length; ++i)
          t[e[i]] != null && (this[e[i]] = t[e[i]]);
    }
    r(n, "Main"), n.prototype.commandId = 0, n.prototype.commandStatus = 0, n.prototype.hasNext = !1, n.prototype.empty = null, n.prototype.stopSession = null, n.prototype.systemPingRequest = null, n.prototype.systemPingResponse = null, n.prototype.systemRebootRequest = null, n.prototype.systemDeviceInfoRequest = null, n.prototype.systemDeviceInfoResponse = null, n.prototype.systemFactoryResetRequest = null, n.prototype.systemGetDatetimeRequest = null, n.prototype.systemGetDatetimeResponse = null, n.prototype.systemSetDatetimeRequest = null, n.prototype.systemPlayAudiovisualAlertRequest = null, n.prototype.systemProtobufVersionRequest = null, n.prototype.systemProtobufVersionResponse = null, n.prototype.systemUpdateRequest = null, n.prototype.systemUpdateResponse = null, n.prototype.systemPowerInfoRequest = null, n.prototype.systemPowerInfoResponse = null, n.prototype.storageInfoRequest = null, n.prototype.storageInfoResponse = null, n.prototype.storageTimestampRequest = null, n.prototype.storageTimestampResponse = null, n.prototype.storageStatRequest = null, n.prototype.storageStatResponse = null, n.prototype.storageListRequest = null, n.prototype.storageListResponse = null, n.prototype.storageReadRequest = null, n.prototype.storageReadResponse = null, n.prototype.storageWriteRequest = null, n.prototype.storageDeleteRequest = null, n.prototype.storageMkdirRequest = null, n.prototype.storageMd5sumRequest = null, n.prototype.storageMd5sumResponse = null, n.prototype.storageRenameRequest = null, n.prototype.storageBackupCreateRequest = null, n.prototype.storageBackupRestoreRequest = null, n.prototype.appStartRequest = null, n.prototype.appLockStatusRequest = null, n.prototype.appLockStatusResponse = null, n.prototype.appExitRequest = null, n.prototype.appLoadFileRequest = null, n.prototype.appButtonPressRequest = null, n.prototype.appButtonReleaseRequest = null, n.prototype.appGetErrorRequest = null, n.prototype.appGetErrorResponse = null, n.prototype.appDataExchangeRequest = null, n.prototype.guiStartScreenStreamRequest = null, n.prototype.guiStopScreenStreamRequest = null, n.prototype.guiScreenFrame = null, n.prototype.guiSendInputEventRequest = null, n.prototype.guiStartVirtualDisplayRequest = null, n.prototype.guiStopVirtualDisplayRequest = null, n.prototype.gpioSetPinMode = null, n.prototype.gpioSetInputPull = null, n.prototype.gpioGetPinMode = null, n.prototype.gpioGetPinModeResponse = null, n.prototype.gpioReadPin = null, n.prototype.gpioReadPinResponse = null, n.prototype.gpioWritePin = null, n.prototype.appStateResponse = null, n.prototype.propertyGetRequest = null, n.prototype.propertyGetResponse = null;
    let o;
    return Object.defineProperty(n.prototype, "content", {
      get: $util.oneOfGetter(o = ["empty", "stopSession", "systemPingRequest", "systemPingResponse", "systemRebootRequest", "systemDeviceInfoRequest", "systemDeviceInfoResponse", "systemFactoryResetRequest", "systemGetDatetimeRequest", "systemGetDatetimeResponse", "systemSetDatetimeRequest", "systemPlayAudiovisualAlertRequest", "systemProtobufVersionRequest", "systemProtobufVersionResponse", "systemUpdateRequest", "systemUpdateResponse", "systemPowerInfoRequest", "systemPowerInfoResponse", "storageInfoRequest", "storageInfoResponse", "storageTimestampRequest", "storageTimestampResponse", "storageStatRequest", "storageStatResponse", "storageListRequest", "storageListResponse", "storageReadRequest", "storageReadResponse", "storageWriteRequest", "storageDeleteRequest", "storageMkdirRequest", "storageMd5sumRequest", "storageMd5sumResponse", "storageRenameRequest", "storageBackupCreateRequest", "storageBackupRestoreRequest", "appStartRequest", "appLockStatusRequest", "appLockStatusResponse", "appExitRequest", "appLoadFileRequest", "appButtonPressRequest", "appButtonReleaseRequest", "appGetErrorRequest", "appGetErrorResponse", "appDataExchangeRequest", "guiStartScreenStreamRequest", "guiStopScreenStreamRequest", "guiScreenFrame", "guiSendInputEventRequest", "guiStartVirtualDisplayRequest", "guiStopVirtualDisplayRequest", "gpioSetPinMode", "gpioSetInputPull", "gpioGetPinMode", "gpioGetPinModeResponse", "gpioReadPin", "gpioReadPinResponse", "gpioWritePin", "appStateResponse", "propertyGetRequest", "propertyGetResponse"]),
      set: $util.oneOfSetter(o)
    }), n.create = /* @__PURE__ */ r(function(e) {
      return new n(e);
    }, "create"), n.encode = /* @__PURE__ */ r(function(e, i) {
      return i || (i = $Writer.create()), e.commandId != null && Object.hasOwnProperty.call(e, "commandId") && i.uint32(8).uint32(e.commandId), e.commandStatus != null && Object.hasOwnProperty.call(e, "commandStatus") && i.uint32(16).int32(e.commandStatus), e.hasNext != null && Object.hasOwnProperty.call(e, "hasNext") && i.uint32(24).bool(e.hasNext), e.empty != null && Object.hasOwnProperty.call(e, "empty") && $root.PB.Empty.encode(e.empty, i.uint32(34).fork()).ldelim(), e.systemPingRequest != null && Object.hasOwnProperty.call(e, "systemPingRequest") && $root.PB_System.PingRequest.encode(e.systemPingRequest, i.uint32(42).fork()).ldelim(), e.systemPingResponse != null && Object.hasOwnProperty.call(e, "systemPingResponse") && $root.PB_System.PingResponse.encode(e.systemPingResponse, i.uint32(50).fork()).ldelim(), e.storageListRequest != null && Object.hasOwnProperty.call(e, "storageListRequest") && $root.PB_Storage.ListRequest.encode(e.storageListRequest, i.uint32(58).fork()).ldelim(), e.storageListResponse != null && Object.hasOwnProperty.call(e, "storageListResponse") && $root.PB_Storage.ListResponse.encode(e.storageListResponse, i.uint32(66).fork()).ldelim(), e.storageReadRequest != null && Object.hasOwnProperty.call(e, "storageReadRequest") && $root.PB_Storage.ReadRequest.encode(e.storageReadRequest, i.uint32(74).fork()).ldelim(), e.storageReadResponse != null && Object.hasOwnProperty.call(e, "storageReadResponse") && $root.PB_Storage.ReadResponse.encode(e.storageReadResponse, i.uint32(82).fork()).ldelim(), e.storageWriteRequest != null && Object.hasOwnProperty.call(e, "storageWriteRequest") && $root.PB_Storage.WriteRequest.encode(e.storageWriteRequest, i.uint32(90).fork()).ldelim(), e.storageDeleteRequest != null && Object.hasOwnProperty.call(e, "storageDeleteRequest") && $root.PB_Storage.DeleteRequest.encode(e.storageDeleteRequest, i.uint32(98).fork()).ldelim(), e.storageMkdirRequest != null && Object.hasOwnProperty.call(e, "storageMkdirRequest") && $root.PB_Storage.MkdirRequest.encode(e.storageMkdirRequest, i.uint32(106).fork()).ldelim(), e.storageMd5sumRequest != null && Object.hasOwnProperty.call(e, "storageMd5sumRequest") && $root.PB_Storage.Md5sumRequest.encode(e.storageMd5sumRequest, i.uint32(114).fork()).ldelim(), e.storageMd5sumResponse != null && Object.hasOwnProperty.call(e, "storageMd5sumResponse") && $root.PB_Storage.Md5sumResponse.encode(e.storageMd5sumResponse, i.uint32(122).fork()).ldelim(), e.appStartRequest != null && Object.hasOwnProperty.call(e, "appStartRequest") && $root.PB_App.StartRequest.encode(e.appStartRequest, i.uint32(130).fork()).ldelim(), e.appLockStatusRequest != null && Object.hasOwnProperty.call(e, "appLockStatusRequest") && $root.PB_App.LockStatusRequest.encode(e.appLockStatusRequest, i.uint32(138).fork()).ldelim(), e.appLockStatusResponse != null && Object.hasOwnProperty.call(e, "appLockStatusResponse") && $root.PB_App.LockStatusResponse.encode(e.appLockStatusResponse, i.uint32(146).fork()).ldelim(), e.stopSession != null && Object.hasOwnProperty.call(e, "stopSession") && $root.PB.StopSession.encode(e.stopSession, i.uint32(154).fork()).ldelim(), e.guiStartScreenStreamRequest != null && Object.hasOwnProperty.call(e, "guiStartScreenStreamRequest") && $root.PB_Gui.StartScreenStreamRequest.encode(e.guiStartScreenStreamRequest, i.uint32(162).fork()).ldelim(), e.guiStopScreenStreamRequest != null && Object.hasOwnProperty.call(e, "guiStopScreenStreamRequest") && $root.PB_Gui.StopScreenStreamRequest.encode(e.guiStopScreenStreamRequest, i.uint32(170).fork()).ldelim(), e.guiScreenFrame != null && Object.hasOwnProperty.call(e, "guiScreenFrame") && $root.PB_Gui.ScreenFrame.encode(e.guiScreenFrame, i.uint32(178).fork()).ldelim(), e.guiSendInputEventRequest != null && Object.hasOwnProperty.call(e, "guiSendInputEventRequest") && $root.PB_Gui.SendInputEventRequest.encode(e.guiSendInputEventRequest, i.uint32(186).fork()).ldelim(), e.storageStatRequest != null && Object.hasOwnProperty.call(e, "storageStatRequest") && $root.PB_Storage.StatRequest.encode(e.storageStatRequest, i.uint32(194).fork()).ldelim(), e.storageStatResponse != null && Object.hasOwnProperty.call(e, "storageStatResponse") && $root.PB_Storage.StatResponse.encode(e.storageStatResponse, i.uint32(202).fork()).ldelim(), e.guiStartVirtualDisplayRequest != null && Object.hasOwnProperty.call(e, "guiStartVirtualDisplayRequest") && $root.PB_Gui.StartVirtualDisplayRequest.encode(e.guiStartVirtualDisplayRequest, i.uint32(210).fork()).ldelim(), e.guiStopVirtualDisplayRequest != null && Object.hasOwnProperty.call(e, "guiStopVirtualDisplayRequest") && $root.PB_Gui.StopVirtualDisplayRequest.encode(e.guiStopVirtualDisplayRequest, i.uint32(218).fork()).ldelim(), e.storageInfoRequest != null && Object.hasOwnProperty.call(e, "storageInfoRequest") && $root.PB_Storage.InfoRequest.encode(e.storageInfoRequest, i.uint32(226).fork()).ldelim(), e.storageInfoResponse != null && Object.hasOwnProperty.call(e, "storageInfoResponse") && $root.PB_Storage.InfoResponse.encode(e.storageInfoResponse, i.uint32(234).fork()).ldelim(), e.storageRenameRequest != null && Object.hasOwnProperty.call(e, "storageRenameRequest") && $root.PB_Storage.RenameRequest.encode(e.storageRenameRequest, i.uint32(242).fork()).ldelim(), e.systemRebootRequest != null && Object.hasOwnProperty.call(e, "systemRebootRequest") && $root.PB_System.RebootRequest.encode(e.systemRebootRequest, i.uint32(250).fork()).ldelim(), e.systemDeviceInfoRequest != null && Object.hasOwnProperty.call(e, "systemDeviceInfoRequest") && $root.PB_System.DeviceInfoRequest.encode(e.systemDeviceInfoRequest, i.uint32(258).fork()).ldelim(), e.systemDeviceInfoResponse != null && Object.hasOwnProperty.call(e, "systemDeviceInfoResponse") && $root.PB_System.DeviceInfoResponse.encode(e.systemDeviceInfoResponse, i.uint32(266).fork()).ldelim(), e.systemFactoryResetRequest != null && Object.hasOwnProperty.call(e, "systemFactoryResetRequest") && $root.PB_System.FactoryResetRequest.encode(e.systemFactoryResetRequest, i.uint32(274).fork()).ldelim(), e.systemGetDatetimeRequest != null && Object.hasOwnProperty.call(e, "systemGetDatetimeRequest") && $root.PB_System.GetDateTimeRequest.encode(e.systemGetDatetimeRequest, i.uint32(282).fork()).ldelim(), e.systemGetDatetimeResponse != null && Object.hasOwnProperty.call(e, "systemGetDatetimeResponse") && $root.PB_System.GetDateTimeResponse.encode(e.systemGetDatetimeResponse, i.uint32(290).fork()).ldelim(), e.systemSetDatetimeRequest != null && Object.hasOwnProperty.call(e, "systemSetDatetimeRequest") && $root.PB_System.SetDateTimeRequest.encode(e.systemSetDatetimeRequest, i.uint32(298).fork()).ldelim(), e.systemPlayAudiovisualAlertRequest != null && Object.hasOwnProperty.call(e, "systemPlayAudiovisualAlertRequest") && $root.PB_System.PlayAudiovisualAlertRequest.encode(e.systemPlayAudiovisualAlertRequest, i.uint32(306).fork()).ldelim(), e.systemProtobufVersionRequest != null && Object.hasOwnProperty.call(e, "systemProtobufVersionRequest") && $root.PB_System.ProtobufVersionRequest.encode(e.systemProtobufVersionRequest, i.uint32(314).fork()).ldelim(), e.systemProtobufVersionResponse != null && Object.hasOwnProperty.call(e, "systemProtobufVersionResponse") && $root.PB_System.ProtobufVersionResponse.encode(e.systemProtobufVersionResponse, i.uint32(322).fork()).ldelim(), e.systemUpdateRequest != null && Object.hasOwnProperty.call(e, "systemUpdateRequest") && $root.PB_System.UpdateRequest.encode(e.systemUpdateRequest, i.uint32(330).fork()).ldelim(), e.storageBackupCreateRequest != null && Object.hasOwnProperty.call(e, "storageBackupCreateRequest") && $root.PB_Storage.BackupCreateRequest.encode(e.storageBackupCreateRequest, i.uint32(338).fork()).ldelim(), e.storageBackupRestoreRequest != null && Object.hasOwnProperty.call(e, "storageBackupRestoreRequest") && $root.PB_Storage.BackupRestoreRequest.encode(e.storageBackupRestoreRequest, i.uint32(346).fork()).ldelim(), e.systemPowerInfoRequest != null && Object.hasOwnProperty.call(e, "systemPowerInfoRequest") && $root.PB_System.PowerInfoRequest.encode(e.systemPowerInfoRequest, i.uint32(354).fork()).ldelim(), e.systemPowerInfoResponse != null && Object.hasOwnProperty.call(e, "systemPowerInfoResponse") && $root.PB_System.PowerInfoResponse.encode(e.systemPowerInfoResponse, i.uint32(362).fork()).ldelim(), e.systemUpdateResponse != null && Object.hasOwnProperty.call(e, "systemUpdateResponse") && $root.PB_System.UpdateResponse.encode(e.systemUpdateResponse, i.uint32(370).fork()).ldelim(), e.appExitRequest != null && Object.hasOwnProperty.call(e, "appExitRequest") && $root.PB_App.AppExitRequest.encode(e.appExitRequest, i.uint32(378).fork()).ldelim(), e.appLoadFileRequest != null && Object.hasOwnProperty.call(e, "appLoadFileRequest") && $root.PB_App.AppLoadFileRequest.encode(e.appLoadFileRequest, i.uint32(386).fork()).ldelim(), e.appButtonPressRequest != null && Object.hasOwnProperty.call(e, "appButtonPressRequest") && $root.PB_App.AppButtonPressRequest.encode(e.appButtonPressRequest, i.uint32(394).fork()).ldelim(), e.appButtonReleaseRequest != null && Object.hasOwnProperty.call(e, "appButtonReleaseRequest") && $root.PB_App.AppButtonReleaseRequest.encode(e.appButtonReleaseRequest, i.uint32(402).fork()).ldelim(), e.gpioSetPinMode != null && Object.hasOwnProperty.call(e, "gpioSetPinMode") && $root.PB_Gpio.SetPinMode.encode(e.gpioSetPinMode, i.uint32(410).fork()).ldelim(), e.gpioSetInputPull != null && Object.hasOwnProperty.call(e, "gpioSetInputPull") && $root.PB_Gpio.SetInputPull.encode(e.gpioSetInputPull, i.uint32(418).fork()).ldelim(), e.gpioGetPinMode != null && Object.hasOwnProperty.call(e, "gpioGetPinMode") && $root.PB_Gpio.GetPinMode.encode(e.gpioGetPinMode, i.uint32(426).fork()).ldelim(), e.gpioGetPinModeResponse != null && Object.hasOwnProperty.call(e, "gpioGetPinModeResponse") && $root.PB_Gpio.GetPinModeResponse.encode(e.gpioGetPinModeResponse, i.uint32(434).fork()).ldelim(), e.gpioReadPin != null && Object.hasOwnProperty.call(e, "gpioReadPin") && $root.PB_Gpio.ReadPin.encode(e.gpioReadPin, i.uint32(442).fork()).ldelim(), e.gpioReadPinResponse != null && Object.hasOwnProperty.call(e, "gpioReadPinResponse") && $root.PB_Gpio.ReadPinResponse.encode(e.gpioReadPinResponse, i.uint32(450).fork()).ldelim(), e.gpioWritePin != null && Object.hasOwnProperty.call(e, "gpioWritePin") && $root.PB_Gpio.WritePin.encode(e.gpioWritePin, i.uint32(458).fork()).ldelim(), e.appStateResponse != null && Object.hasOwnProperty.call(e, "appStateResponse") && $root.PB_App.AppStateResponse.encode(e.appStateResponse, i.uint32(466).fork()).ldelim(), e.storageTimestampRequest != null && Object.hasOwnProperty.call(e, "storageTimestampRequest") && $root.PB_Storage.TimestampRequest.encode(e.storageTimestampRequest, i.uint32(474).fork()).ldelim(), e.storageTimestampResponse != null && Object.hasOwnProperty.call(e, "storageTimestampResponse") && $root.PB_Storage.TimestampResponse.encode(e.storageTimestampResponse, i.uint32(482).fork()).ldelim(), e.propertyGetRequest != null && Object.hasOwnProperty.call(e, "propertyGetRequest") && $root.PB_Property.GetRequest.encode(e.propertyGetRequest, i.uint32(490).fork()).ldelim(), e.propertyGetResponse != null && Object.hasOwnProperty.call(e, "propertyGetResponse") && $root.PB_Property.GetResponse.encode(e.propertyGetResponse, i.uint32(498).fork()).ldelim(), e.appGetErrorRequest != null && Object.hasOwnProperty.call(e, "appGetErrorRequest") && $root.PB_App.GetErrorRequest.encode(e.appGetErrorRequest, i.uint32(506).fork()).ldelim(), e.appGetErrorResponse != null && Object.hasOwnProperty.call(e, "appGetErrorResponse") && $root.PB_App.GetErrorResponse.encode(e.appGetErrorResponse, i.uint32(514).fork()).ldelim(), e.appDataExchangeRequest != null && Object.hasOwnProperty.call(e, "appDataExchangeRequest") && $root.PB_App.DataExchangeRequest.encode(e.appDataExchangeRequest, i.uint32(522).fork()).ldelim(), i;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(e, i) {
      return this.encode(e, i).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(e, i) {
      e instanceof $Reader || (e = $Reader.create(e));
      const u = i === void 0 ? e.len : e.pos + i, c = new $root.PB.Main();
      for (; e.pos < u; ) {
        const l = e.uint32();
        switch (l >>> 3) {
          case 1:
            c.commandId = e.uint32();
            break;
          case 2:
            c.commandStatus = e.int32();
            break;
          case 3:
            c.hasNext = e.bool();
            break;
          case 4:
            c.empty = $root.PB.Empty.decode(e, e.uint32());
            break;
          case 19:
            c.stopSession = $root.PB.StopSession.decode(e, e.uint32());
            break;
          case 5:
            c.systemPingRequest = $root.PB_System.PingRequest.decode(e, e.uint32());
            break;
          case 6:
            c.systemPingResponse = $root.PB_System.PingResponse.decode(e, e.uint32());
            break;
          case 31:
            c.systemRebootRequest = $root.PB_System.RebootRequest.decode(e, e.uint32());
            break;
          case 32:
            c.systemDeviceInfoRequest = $root.PB_System.DeviceInfoRequest.decode(e, e.uint32());
            break;
          case 33:
            c.systemDeviceInfoResponse = $root.PB_System.DeviceInfoResponse.decode(e, e.uint32());
            break;
          case 34:
            c.systemFactoryResetRequest = $root.PB_System.FactoryResetRequest.decode(e, e.uint32());
            break;
          case 35:
            c.systemGetDatetimeRequest = $root.PB_System.GetDateTimeRequest.decode(e, e.uint32());
            break;
          case 36:
            c.systemGetDatetimeResponse = $root.PB_System.GetDateTimeResponse.decode(e, e.uint32());
            break;
          case 37:
            c.systemSetDatetimeRequest = $root.PB_System.SetDateTimeRequest.decode(e, e.uint32());
            break;
          case 38:
            c.systemPlayAudiovisualAlertRequest = $root.PB_System.PlayAudiovisualAlertRequest.decode(e, e.uint32());
            break;
          case 39:
            c.systemProtobufVersionRequest = $root.PB_System.ProtobufVersionRequest.decode(e, e.uint32());
            break;
          case 40:
            c.systemProtobufVersionResponse = $root.PB_System.ProtobufVersionResponse.decode(e, e.uint32());
            break;
          case 41:
            c.systemUpdateRequest = $root.PB_System.UpdateRequest.decode(e, e.uint32());
            break;
          case 46:
            c.systemUpdateResponse = $root.PB_System.UpdateResponse.decode(e, e.uint32());
            break;
          case 44:
            c.systemPowerInfoRequest = $root.PB_System.PowerInfoRequest.decode(e, e.uint32());
            break;
          case 45:
            c.systemPowerInfoResponse = $root.PB_System.PowerInfoResponse.decode(e, e.uint32());
            break;
          case 28:
            c.storageInfoRequest = $root.PB_Storage.InfoRequest.decode(e, e.uint32());
            break;
          case 29:
            c.storageInfoResponse = $root.PB_Storage.InfoResponse.decode(e, e.uint32());
            break;
          case 59:
            c.storageTimestampRequest = $root.PB_Storage.TimestampRequest.decode(e, e.uint32());
            break;
          case 60:
            c.storageTimestampResponse = $root.PB_Storage.TimestampResponse.decode(e, e.uint32());
            break;
          case 24:
            c.storageStatRequest = $root.PB_Storage.StatRequest.decode(e, e.uint32());
            break;
          case 25:
            c.storageStatResponse = $root.PB_Storage.StatResponse.decode(e, e.uint32());
            break;
          case 7:
            c.storageListRequest = $root.PB_Storage.ListRequest.decode(e, e.uint32());
            break;
          case 8:
            c.storageListResponse = $root.PB_Storage.ListResponse.decode(e, e.uint32());
            break;
          case 9:
            c.storageReadRequest = $root.PB_Storage.ReadRequest.decode(e, e.uint32());
            break;
          case 10:
            c.storageReadResponse = $root.PB_Storage.ReadResponse.decode(e, e.uint32());
            break;
          case 11:
            c.storageWriteRequest = $root.PB_Storage.WriteRequest.decode(e, e.uint32());
            break;
          case 12:
            c.storageDeleteRequest = $root.PB_Storage.DeleteRequest.decode(e, e.uint32());
            break;
          case 13:
            c.storageMkdirRequest = $root.PB_Storage.MkdirRequest.decode(e, e.uint32());
            break;
          case 14:
            c.storageMd5sumRequest = $root.PB_Storage.Md5sumRequest.decode(e, e.uint32());
            break;
          case 15:
            c.storageMd5sumResponse = $root.PB_Storage.Md5sumResponse.decode(e, e.uint32());
            break;
          case 30:
            c.storageRenameRequest = $root.PB_Storage.RenameRequest.decode(e, e.uint32());
            break;
          case 42:
            c.storageBackupCreateRequest = $root.PB_Storage.BackupCreateRequest.decode(e, e.uint32());
            break;
          case 43:
            c.storageBackupRestoreRequest = $root.PB_Storage.BackupRestoreRequest.decode(e, e.uint32());
            break;
          case 16:
            c.appStartRequest = $root.PB_App.StartRequest.decode(e, e.uint32());
            break;
          case 17:
            c.appLockStatusRequest = $root.PB_App.LockStatusRequest.decode(e, e.uint32());
            break;
          case 18:
            c.appLockStatusResponse = $root.PB_App.LockStatusResponse.decode(e, e.uint32());
            break;
          case 47:
            c.appExitRequest = $root.PB_App.AppExitRequest.decode(e, e.uint32());
            break;
          case 48:
            c.appLoadFileRequest = $root.PB_App.AppLoadFileRequest.decode(e, e.uint32());
            break;
          case 49:
            c.appButtonPressRequest = $root.PB_App.AppButtonPressRequest.decode(e, e.uint32());
            break;
          case 50:
            c.appButtonReleaseRequest = $root.PB_App.AppButtonReleaseRequest.decode(e, e.uint32());
            break;
          case 63:
            c.appGetErrorRequest = $root.PB_App.GetErrorRequest.decode(e, e.uint32());
            break;
          case 64:
            c.appGetErrorResponse = $root.PB_App.GetErrorResponse.decode(e, e.uint32());
            break;
          case 65:
            c.appDataExchangeRequest = $root.PB_App.DataExchangeRequest.decode(e, e.uint32());
            break;
          case 20:
            c.guiStartScreenStreamRequest = $root.PB_Gui.StartScreenStreamRequest.decode(e, e.uint32());
            break;
          case 21:
            c.guiStopScreenStreamRequest = $root.PB_Gui.StopScreenStreamRequest.decode(e, e.uint32());
            break;
          case 22:
            c.guiScreenFrame = $root.PB_Gui.ScreenFrame.decode(e, e.uint32());
            break;
          case 23:
            c.guiSendInputEventRequest = $root.PB_Gui.SendInputEventRequest.decode(e, e.uint32());
            break;
          case 26:
            c.guiStartVirtualDisplayRequest = $root.PB_Gui.StartVirtualDisplayRequest.decode(e, e.uint32());
            break;
          case 27:
            c.guiStopVirtualDisplayRequest = $root.PB_Gui.StopVirtualDisplayRequest.decode(e, e.uint32());
            break;
          case 51:
            c.gpioSetPinMode = $root.PB_Gpio.SetPinMode.decode(e, e.uint32());
            break;
          case 52:
            c.gpioSetInputPull = $root.PB_Gpio.SetInputPull.decode(e, e.uint32());
            break;
          case 53:
            c.gpioGetPinMode = $root.PB_Gpio.GetPinMode.decode(e, e.uint32());
            break;
          case 54:
            c.gpioGetPinModeResponse = $root.PB_Gpio.GetPinModeResponse.decode(e, e.uint32());
            break;
          case 55:
            c.gpioReadPin = $root.PB_Gpio.ReadPin.decode(e, e.uint32());
            break;
          case 56:
            c.gpioReadPinResponse = $root.PB_Gpio.ReadPinResponse.decode(e, e.uint32());
            break;
          case 57:
            c.gpioWritePin = $root.PB_Gpio.WritePin.decode(e, e.uint32());
            break;
          case 58:
            c.appStateResponse = $root.PB_App.AppStateResponse.decode(e, e.uint32());
            break;
          case 61:
            c.propertyGetRequest = $root.PB_Property.GetRequest.decode(e, e.uint32());
            break;
          case 62:
            c.propertyGetResponse = $root.PB_Property.GetResponse.decode(e, e.uint32());
            break;
          default:
            e.skipType(l & 7);
            break;
        }
      }
      return c;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(e) {
      return e instanceof $Reader || (e = new $Reader(e)), this.decode(e, e.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(e) {
      if (typeof e != "object" || e === null)
        return "object expected";
      const i = {};
      if (e.commandId != null && e.hasOwnProperty("commandId") && !$util.isInteger(e.commandId))
        return "commandId: integer expected";
      if (e.commandStatus != null && e.hasOwnProperty("commandStatus"))
        switch (e.commandStatus) {
          default:
            return "commandStatus: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 14:
          case 15:
          case 5:
          case 6:
          case 7:
          case 8:
          case 9:
          case 10:
          case 11:
          case 12:
          case 13:
          case 18:
          case 16:
          case 17:
          case 21:
          case 22:
          case 19:
          case 20:
          case 58:
          case 59:
            break;
        }
      if (e.hasNext != null && e.hasOwnProperty("hasNext") && typeof e.hasNext != "boolean")
        return "hasNext: boolean expected";
      if (e.empty != null && e.hasOwnProperty("empty")) {
        i.content = 1;
        {
          const u = $root.PB.Empty.verify(e.empty);
          if (u)
            return "empty." + u;
        }
      }
      if (e.stopSession != null && e.hasOwnProperty("stopSession")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB.StopSession.verify(e.stopSession);
          if (u)
            return "stopSession." + u;
        }
      }
      if (e.systemPingRequest != null && e.hasOwnProperty("systemPingRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.PingRequest.verify(e.systemPingRequest);
          if (u)
            return "systemPingRequest." + u;
        }
      }
      if (e.systemPingResponse != null && e.hasOwnProperty("systemPingResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.PingResponse.verify(e.systemPingResponse);
          if (u)
            return "systemPingResponse." + u;
        }
      }
      if (e.systemRebootRequest != null && e.hasOwnProperty("systemRebootRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.RebootRequest.verify(e.systemRebootRequest);
          if (u)
            return "systemRebootRequest." + u;
        }
      }
      if (e.systemDeviceInfoRequest != null && e.hasOwnProperty("systemDeviceInfoRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.DeviceInfoRequest.verify(e.systemDeviceInfoRequest);
          if (u)
            return "systemDeviceInfoRequest." + u;
        }
      }
      if (e.systemDeviceInfoResponse != null && e.hasOwnProperty("systemDeviceInfoResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.DeviceInfoResponse.verify(e.systemDeviceInfoResponse);
          if (u)
            return "systemDeviceInfoResponse." + u;
        }
      }
      if (e.systemFactoryResetRequest != null && e.hasOwnProperty("systemFactoryResetRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.FactoryResetRequest.verify(e.systemFactoryResetRequest);
          if (u)
            return "systemFactoryResetRequest." + u;
        }
      }
      if (e.systemGetDatetimeRequest != null && e.hasOwnProperty("systemGetDatetimeRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.GetDateTimeRequest.verify(e.systemGetDatetimeRequest);
          if (u)
            return "systemGetDatetimeRequest." + u;
        }
      }
      if (e.systemGetDatetimeResponse != null && e.hasOwnProperty("systemGetDatetimeResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.GetDateTimeResponse.verify(e.systemGetDatetimeResponse);
          if (u)
            return "systemGetDatetimeResponse." + u;
        }
      }
      if (e.systemSetDatetimeRequest != null && e.hasOwnProperty("systemSetDatetimeRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.SetDateTimeRequest.verify(e.systemSetDatetimeRequest);
          if (u)
            return "systemSetDatetimeRequest." + u;
        }
      }
      if (e.systemPlayAudiovisualAlertRequest != null && e.hasOwnProperty("systemPlayAudiovisualAlertRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.PlayAudiovisualAlertRequest.verify(e.systemPlayAudiovisualAlertRequest);
          if (u)
            return "systemPlayAudiovisualAlertRequest." + u;
        }
      }
      if (e.systemProtobufVersionRequest != null && e.hasOwnProperty("systemProtobufVersionRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.ProtobufVersionRequest.verify(e.systemProtobufVersionRequest);
          if (u)
            return "systemProtobufVersionRequest." + u;
        }
      }
      if (e.systemProtobufVersionResponse != null && e.hasOwnProperty("systemProtobufVersionResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.ProtobufVersionResponse.verify(e.systemProtobufVersionResponse);
          if (u)
            return "systemProtobufVersionResponse." + u;
        }
      }
      if (e.systemUpdateRequest != null && e.hasOwnProperty("systemUpdateRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.UpdateRequest.verify(e.systemUpdateRequest);
          if (u)
            return "systemUpdateRequest." + u;
        }
      }
      if (e.systemUpdateResponse != null && e.hasOwnProperty("systemUpdateResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.UpdateResponse.verify(e.systemUpdateResponse);
          if (u)
            return "systemUpdateResponse." + u;
        }
      }
      if (e.systemPowerInfoRequest != null && e.hasOwnProperty("systemPowerInfoRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.PowerInfoRequest.verify(e.systemPowerInfoRequest);
          if (u)
            return "systemPowerInfoRequest." + u;
        }
      }
      if (e.systemPowerInfoResponse != null && e.hasOwnProperty("systemPowerInfoResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_System.PowerInfoResponse.verify(e.systemPowerInfoResponse);
          if (u)
            return "systemPowerInfoResponse." + u;
        }
      }
      if (e.storageInfoRequest != null && e.hasOwnProperty("storageInfoRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.InfoRequest.verify(e.storageInfoRequest);
          if (u)
            return "storageInfoRequest." + u;
        }
      }
      if (e.storageInfoResponse != null && e.hasOwnProperty("storageInfoResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.InfoResponse.verify(e.storageInfoResponse);
          if (u)
            return "storageInfoResponse." + u;
        }
      }
      if (e.storageTimestampRequest != null && e.hasOwnProperty("storageTimestampRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.TimestampRequest.verify(e.storageTimestampRequest);
          if (u)
            return "storageTimestampRequest." + u;
        }
      }
      if (e.storageTimestampResponse != null && e.hasOwnProperty("storageTimestampResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.TimestampResponse.verify(e.storageTimestampResponse);
          if (u)
            return "storageTimestampResponse." + u;
        }
      }
      if (e.storageStatRequest != null && e.hasOwnProperty("storageStatRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.StatRequest.verify(e.storageStatRequest);
          if (u)
            return "storageStatRequest." + u;
        }
      }
      if (e.storageStatResponse != null && e.hasOwnProperty("storageStatResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.StatResponse.verify(e.storageStatResponse);
          if (u)
            return "storageStatResponse." + u;
        }
      }
      if (e.storageListRequest != null && e.hasOwnProperty("storageListRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.ListRequest.verify(e.storageListRequest);
          if (u)
            return "storageListRequest." + u;
        }
      }
      if (e.storageListResponse != null && e.hasOwnProperty("storageListResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.ListResponse.verify(e.storageListResponse);
          if (u)
            return "storageListResponse." + u;
        }
      }
      if (e.storageReadRequest != null && e.hasOwnProperty("storageReadRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.ReadRequest.verify(e.storageReadRequest);
          if (u)
            return "storageReadRequest." + u;
        }
      }
      if (e.storageReadResponse != null && e.hasOwnProperty("storageReadResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.ReadResponse.verify(e.storageReadResponse);
          if (u)
            return "storageReadResponse." + u;
        }
      }
      if (e.storageWriteRequest != null && e.hasOwnProperty("storageWriteRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.WriteRequest.verify(e.storageWriteRequest);
          if (u)
            return "storageWriteRequest." + u;
        }
      }
      if (e.storageDeleteRequest != null && e.hasOwnProperty("storageDeleteRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.DeleteRequest.verify(e.storageDeleteRequest);
          if (u)
            return "storageDeleteRequest." + u;
        }
      }
      if (e.storageMkdirRequest != null && e.hasOwnProperty("storageMkdirRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.MkdirRequest.verify(e.storageMkdirRequest);
          if (u)
            return "storageMkdirRequest." + u;
        }
      }
      if (e.storageMd5sumRequest != null && e.hasOwnProperty("storageMd5sumRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.Md5sumRequest.verify(e.storageMd5sumRequest);
          if (u)
            return "storageMd5sumRequest." + u;
        }
      }
      if (e.storageMd5sumResponse != null && e.hasOwnProperty("storageMd5sumResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.Md5sumResponse.verify(e.storageMd5sumResponse);
          if (u)
            return "storageMd5sumResponse." + u;
        }
      }
      if (e.storageRenameRequest != null && e.hasOwnProperty("storageRenameRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.RenameRequest.verify(e.storageRenameRequest);
          if (u)
            return "storageRenameRequest." + u;
        }
      }
      if (e.storageBackupCreateRequest != null && e.hasOwnProperty("storageBackupCreateRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.BackupCreateRequest.verify(e.storageBackupCreateRequest);
          if (u)
            return "storageBackupCreateRequest." + u;
        }
      }
      if (e.storageBackupRestoreRequest != null && e.hasOwnProperty("storageBackupRestoreRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Storage.BackupRestoreRequest.verify(e.storageBackupRestoreRequest);
          if (u)
            return "storageBackupRestoreRequest." + u;
        }
      }
      if (e.appStartRequest != null && e.hasOwnProperty("appStartRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.StartRequest.verify(e.appStartRequest);
          if (u)
            return "appStartRequest." + u;
        }
      }
      if (e.appLockStatusRequest != null && e.hasOwnProperty("appLockStatusRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.LockStatusRequest.verify(e.appLockStatusRequest);
          if (u)
            return "appLockStatusRequest." + u;
        }
      }
      if (e.appLockStatusResponse != null && e.hasOwnProperty("appLockStatusResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.LockStatusResponse.verify(e.appLockStatusResponse);
          if (u)
            return "appLockStatusResponse." + u;
        }
      }
      if (e.appExitRequest != null && e.hasOwnProperty("appExitRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.AppExitRequest.verify(e.appExitRequest);
          if (u)
            return "appExitRequest." + u;
        }
      }
      if (e.appLoadFileRequest != null && e.hasOwnProperty("appLoadFileRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.AppLoadFileRequest.verify(e.appLoadFileRequest);
          if (u)
            return "appLoadFileRequest." + u;
        }
      }
      if (e.appButtonPressRequest != null && e.hasOwnProperty("appButtonPressRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.AppButtonPressRequest.verify(e.appButtonPressRequest);
          if (u)
            return "appButtonPressRequest." + u;
        }
      }
      if (e.appButtonReleaseRequest != null && e.hasOwnProperty("appButtonReleaseRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.AppButtonReleaseRequest.verify(e.appButtonReleaseRequest);
          if (u)
            return "appButtonReleaseRequest." + u;
        }
      }
      if (e.appGetErrorRequest != null && e.hasOwnProperty("appGetErrorRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.GetErrorRequest.verify(e.appGetErrorRequest);
          if (u)
            return "appGetErrorRequest." + u;
        }
      }
      if (e.appGetErrorResponse != null && e.hasOwnProperty("appGetErrorResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.GetErrorResponse.verify(e.appGetErrorResponse);
          if (u)
            return "appGetErrorResponse." + u;
        }
      }
      if (e.appDataExchangeRequest != null && e.hasOwnProperty("appDataExchangeRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.DataExchangeRequest.verify(e.appDataExchangeRequest);
          if (u)
            return "appDataExchangeRequest." + u;
        }
      }
      if (e.guiStartScreenStreamRequest != null && e.hasOwnProperty("guiStartScreenStreamRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gui.StartScreenStreamRequest.verify(e.guiStartScreenStreamRequest);
          if (u)
            return "guiStartScreenStreamRequest." + u;
        }
      }
      if (e.guiStopScreenStreamRequest != null && e.hasOwnProperty("guiStopScreenStreamRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gui.StopScreenStreamRequest.verify(e.guiStopScreenStreamRequest);
          if (u)
            return "guiStopScreenStreamRequest." + u;
        }
      }
      if (e.guiScreenFrame != null && e.hasOwnProperty("guiScreenFrame")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gui.ScreenFrame.verify(e.guiScreenFrame);
          if (u)
            return "guiScreenFrame." + u;
        }
      }
      if (e.guiSendInputEventRequest != null && e.hasOwnProperty("guiSendInputEventRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gui.SendInputEventRequest.verify(e.guiSendInputEventRequest);
          if (u)
            return "guiSendInputEventRequest." + u;
        }
      }
      if (e.guiStartVirtualDisplayRequest != null && e.hasOwnProperty("guiStartVirtualDisplayRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gui.StartVirtualDisplayRequest.verify(e.guiStartVirtualDisplayRequest);
          if (u)
            return "guiStartVirtualDisplayRequest." + u;
        }
      }
      if (e.guiStopVirtualDisplayRequest != null && e.hasOwnProperty("guiStopVirtualDisplayRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gui.StopVirtualDisplayRequest.verify(e.guiStopVirtualDisplayRequest);
          if (u)
            return "guiStopVirtualDisplayRequest." + u;
        }
      }
      if (e.gpioSetPinMode != null && e.hasOwnProperty("gpioSetPinMode")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gpio.SetPinMode.verify(e.gpioSetPinMode);
          if (u)
            return "gpioSetPinMode." + u;
        }
      }
      if (e.gpioSetInputPull != null && e.hasOwnProperty("gpioSetInputPull")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gpio.SetInputPull.verify(e.gpioSetInputPull);
          if (u)
            return "gpioSetInputPull." + u;
        }
      }
      if (e.gpioGetPinMode != null && e.hasOwnProperty("gpioGetPinMode")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gpio.GetPinMode.verify(e.gpioGetPinMode);
          if (u)
            return "gpioGetPinMode." + u;
        }
      }
      if (e.gpioGetPinModeResponse != null && e.hasOwnProperty("gpioGetPinModeResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gpio.GetPinModeResponse.verify(e.gpioGetPinModeResponse);
          if (u)
            return "gpioGetPinModeResponse." + u;
        }
      }
      if (e.gpioReadPin != null && e.hasOwnProperty("gpioReadPin")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gpio.ReadPin.verify(e.gpioReadPin);
          if (u)
            return "gpioReadPin." + u;
        }
      }
      if (e.gpioReadPinResponse != null && e.hasOwnProperty("gpioReadPinResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gpio.ReadPinResponse.verify(e.gpioReadPinResponse);
          if (u)
            return "gpioReadPinResponse." + u;
        }
      }
      if (e.gpioWritePin != null && e.hasOwnProperty("gpioWritePin")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Gpio.WritePin.verify(e.gpioWritePin);
          if (u)
            return "gpioWritePin." + u;
        }
      }
      if (e.appStateResponse != null && e.hasOwnProperty("appStateResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_App.AppStateResponse.verify(e.appStateResponse);
          if (u)
            return "appStateResponse." + u;
        }
      }
      if (e.propertyGetRequest != null && e.hasOwnProperty("propertyGetRequest")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Property.GetRequest.verify(e.propertyGetRequest);
          if (u)
            return "propertyGetRequest." + u;
        }
      }
      if (e.propertyGetResponse != null && e.hasOwnProperty("propertyGetResponse")) {
        if (i.content === 1)
          return "content: multiple values";
        i.content = 1;
        {
          const u = $root.PB_Property.GetResponse.verify(e.propertyGetResponse);
          if (u)
            return "propertyGetResponse." + u;
        }
      }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(e) {
      if (e instanceof $root.PB.Main)
        return e;
      const i = new $root.PB.Main();
      switch (e.commandId != null && (i.commandId = e.commandId >>> 0), e.commandStatus) {
        case "OK":
        case 0:
          i.commandStatus = 0;
          break;
        case "ERROR":
        case 1:
          i.commandStatus = 1;
          break;
        case "ERROR_DECODE":
        case 2:
          i.commandStatus = 2;
          break;
        case "ERROR_NOT_IMPLEMENTED":
        case 3:
          i.commandStatus = 3;
          break;
        case "ERROR_BUSY":
        case 4:
          i.commandStatus = 4;
          break;
        case "ERROR_CONTINUOUS_COMMAND_INTERRUPTED":
        case 14:
          i.commandStatus = 14;
          break;
        case "ERROR_INVALID_PARAMETERS":
        case 15:
          i.commandStatus = 15;
          break;
        case "ERROR_STORAGE_NOT_READY":
        case 5:
          i.commandStatus = 5;
          break;
        case "ERROR_STORAGE_EXIST":
        case 6:
          i.commandStatus = 6;
          break;
        case "ERROR_STORAGE_NOT_EXIST":
        case 7:
          i.commandStatus = 7;
          break;
        case "ERROR_STORAGE_INVALID_PARAMETER":
        case 8:
          i.commandStatus = 8;
          break;
        case "ERROR_STORAGE_DENIED":
        case 9:
          i.commandStatus = 9;
          break;
        case "ERROR_STORAGE_INVALID_NAME":
        case 10:
          i.commandStatus = 10;
          break;
        case "ERROR_STORAGE_INTERNAL":
        case 11:
          i.commandStatus = 11;
          break;
        case "ERROR_STORAGE_NOT_IMPLEMENTED":
        case 12:
          i.commandStatus = 12;
          break;
        case "ERROR_STORAGE_ALREADY_OPEN":
        case 13:
          i.commandStatus = 13;
          break;
        case "ERROR_STORAGE_DIR_NOT_EMPTY":
        case 18:
          i.commandStatus = 18;
          break;
        case "ERROR_APP_CANT_START":
        case 16:
          i.commandStatus = 16;
          break;
        case "ERROR_APP_SYSTEM_LOCKED":
        case 17:
          i.commandStatus = 17;
          break;
        case "ERROR_APP_NOT_RUNNING":
        case 21:
          i.commandStatus = 21;
          break;
        case "ERROR_APP_CMD_ERROR":
        case 22:
          i.commandStatus = 22;
          break;
        case "ERROR_VIRTUAL_DISPLAY_ALREADY_STARTED":
        case 19:
          i.commandStatus = 19;
          break;
        case "ERROR_VIRTUAL_DISPLAY_NOT_STARTED":
        case 20:
          i.commandStatus = 20;
          break;
        case "ERROR_GPIO_MODE_INCORRECT":
        case 58:
          i.commandStatus = 58;
          break;
        case "ERROR_GPIO_UNKNOWN_PIN_MODE":
        case 59:
          i.commandStatus = 59;
          break;
      }
      if (e.hasNext != null && (i.hasNext = !!e.hasNext), e.empty != null) {
        if (typeof e.empty != "object")
          throw TypeError(".PB.Main.empty: object expected");
        i.empty = $root.PB.Empty.fromObject(e.empty);
      }
      if (e.stopSession != null) {
        if (typeof e.stopSession != "object")
          throw TypeError(".PB.Main.stopSession: object expected");
        i.stopSession = $root.PB.StopSession.fromObject(e.stopSession);
      }
      if (e.systemPingRequest != null) {
        if (typeof e.systemPingRequest != "object")
          throw TypeError(".PB.Main.systemPingRequest: object expected");
        i.systemPingRequest = $root.PB_System.PingRequest.fromObject(e.systemPingRequest);
      }
      if (e.systemPingResponse != null) {
        if (typeof e.systemPingResponse != "object")
          throw TypeError(".PB.Main.systemPingResponse: object expected");
        i.systemPingResponse = $root.PB_System.PingResponse.fromObject(e.systemPingResponse);
      }
      if (e.systemRebootRequest != null) {
        if (typeof e.systemRebootRequest != "object")
          throw TypeError(".PB.Main.systemRebootRequest: object expected");
        i.systemRebootRequest = $root.PB_System.RebootRequest.fromObject(e.systemRebootRequest);
      }
      if (e.systemDeviceInfoRequest != null) {
        if (typeof e.systemDeviceInfoRequest != "object")
          throw TypeError(".PB.Main.systemDeviceInfoRequest: object expected");
        i.systemDeviceInfoRequest = $root.PB_System.DeviceInfoRequest.fromObject(e.systemDeviceInfoRequest);
      }
      if (e.systemDeviceInfoResponse != null) {
        if (typeof e.systemDeviceInfoResponse != "object")
          throw TypeError(".PB.Main.systemDeviceInfoResponse: object expected");
        i.systemDeviceInfoResponse = $root.PB_System.DeviceInfoResponse.fromObject(e.systemDeviceInfoResponse);
      }
      if (e.systemFactoryResetRequest != null) {
        if (typeof e.systemFactoryResetRequest != "object")
          throw TypeError(".PB.Main.systemFactoryResetRequest: object expected");
        i.systemFactoryResetRequest = $root.PB_System.FactoryResetRequest.fromObject(e.systemFactoryResetRequest);
      }
      if (e.systemGetDatetimeRequest != null) {
        if (typeof e.systemGetDatetimeRequest != "object")
          throw TypeError(".PB.Main.systemGetDatetimeRequest: object expected");
        i.systemGetDatetimeRequest = $root.PB_System.GetDateTimeRequest.fromObject(e.systemGetDatetimeRequest);
      }
      if (e.systemGetDatetimeResponse != null) {
        if (typeof e.systemGetDatetimeResponse != "object")
          throw TypeError(".PB.Main.systemGetDatetimeResponse: object expected");
        i.systemGetDatetimeResponse = $root.PB_System.GetDateTimeResponse.fromObject(e.systemGetDatetimeResponse);
      }
      if (e.systemSetDatetimeRequest != null) {
        if (typeof e.systemSetDatetimeRequest != "object")
          throw TypeError(".PB.Main.systemSetDatetimeRequest: object expected");
        i.systemSetDatetimeRequest = $root.PB_System.SetDateTimeRequest.fromObject(e.systemSetDatetimeRequest);
      }
      if (e.systemPlayAudiovisualAlertRequest != null) {
        if (typeof e.systemPlayAudiovisualAlertRequest != "object")
          throw TypeError(".PB.Main.systemPlayAudiovisualAlertRequest: object expected");
        i.systemPlayAudiovisualAlertRequest = $root.PB_System.PlayAudiovisualAlertRequest.fromObject(e.systemPlayAudiovisualAlertRequest);
      }
      if (e.systemProtobufVersionRequest != null) {
        if (typeof e.systemProtobufVersionRequest != "object")
          throw TypeError(".PB.Main.systemProtobufVersionRequest: object expected");
        i.systemProtobufVersionRequest = $root.PB_System.ProtobufVersionRequest.fromObject(e.systemProtobufVersionRequest);
      }
      if (e.systemProtobufVersionResponse != null) {
        if (typeof e.systemProtobufVersionResponse != "object")
          throw TypeError(".PB.Main.systemProtobufVersionResponse: object expected");
        i.systemProtobufVersionResponse = $root.PB_System.ProtobufVersionResponse.fromObject(e.systemProtobufVersionResponse);
      }
      if (e.systemUpdateRequest != null) {
        if (typeof e.systemUpdateRequest != "object")
          throw TypeError(".PB.Main.systemUpdateRequest: object expected");
        i.systemUpdateRequest = $root.PB_System.UpdateRequest.fromObject(e.systemUpdateRequest);
      }
      if (e.systemUpdateResponse != null) {
        if (typeof e.systemUpdateResponse != "object")
          throw TypeError(".PB.Main.systemUpdateResponse: object expected");
        i.systemUpdateResponse = $root.PB_System.UpdateResponse.fromObject(e.systemUpdateResponse);
      }
      if (e.systemPowerInfoRequest != null) {
        if (typeof e.systemPowerInfoRequest != "object")
          throw TypeError(".PB.Main.systemPowerInfoRequest: object expected");
        i.systemPowerInfoRequest = $root.PB_System.PowerInfoRequest.fromObject(e.systemPowerInfoRequest);
      }
      if (e.systemPowerInfoResponse != null) {
        if (typeof e.systemPowerInfoResponse != "object")
          throw TypeError(".PB.Main.systemPowerInfoResponse: object expected");
        i.systemPowerInfoResponse = $root.PB_System.PowerInfoResponse.fromObject(e.systemPowerInfoResponse);
      }
      if (e.storageInfoRequest != null) {
        if (typeof e.storageInfoRequest != "object")
          throw TypeError(".PB.Main.storageInfoRequest: object expected");
        i.storageInfoRequest = $root.PB_Storage.InfoRequest.fromObject(e.storageInfoRequest);
      }
      if (e.storageInfoResponse != null) {
        if (typeof e.storageInfoResponse != "object")
          throw TypeError(".PB.Main.storageInfoResponse: object expected");
        i.storageInfoResponse = $root.PB_Storage.InfoResponse.fromObject(e.storageInfoResponse);
      }
      if (e.storageTimestampRequest != null) {
        if (typeof e.storageTimestampRequest != "object")
          throw TypeError(".PB.Main.storageTimestampRequest: object expected");
        i.storageTimestampRequest = $root.PB_Storage.TimestampRequest.fromObject(e.storageTimestampRequest);
      }
      if (e.storageTimestampResponse != null) {
        if (typeof e.storageTimestampResponse != "object")
          throw TypeError(".PB.Main.storageTimestampResponse: object expected");
        i.storageTimestampResponse = $root.PB_Storage.TimestampResponse.fromObject(e.storageTimestampResponse);
      }
      if (e.storageStatRequest != null) {
        if (typeof e.storageStatRequest != "object")
          throw TypeError(".PB.Main.storageStatRequest: object expected");
        i.storageStatRequest = $root.PB_Storage.StatRequest.fromObject(e.storageStatRequest);
      }
      if (e.storageStatResponse != null) {
        if (typeof e.storageStatResponse != "object")
          throw TypeError(".PB.Main.storageStatResponse: object expected");
        i.storageStatResponse = $root.PB_Storage.StatResponse.fromObject(e.storageStatResponse);
      }
      if (e.storageListRequest != null) {
        if (typeof e.storageListRequest != "object")
          throw TypeError(".PB.Main.storageListRequest: object expected");
        i.storageListRequest = $root.PB_Storage.ListRequest.fromObject(e.storageListRequest);
      }
      if (e.storageListResponse != null) {
        if (typeof e.storageListResponse != "object")
          throw TypeError(".PB.Main.storageListResponse: object expected");
        i.storageListResponse = $root.PB_Storage.ListResponse.fromObject(e.storageListResponse);
      }
      if (e.storageReadRequest != null) {
        if (typeof e.storageReadRequest != "object")
          throw TypeError(".PB.Main.storageReadRequest: object expected");
        i.storageReadRequest = $root.PB_Storage.ReadRequest.fromObject(e.storageReadRequest);
      }
      if (e.storageReadResponse != null) {
        if (typeof e.storageReadResponse != "object")
          throw TypeError(".PB.Main.storageReadResponse: object expected");
        i.storageReadResponse = $root.PB_Storage.ReadResponse.fromObject(e.storageReadResponse);
      }
      if (e.storageWriteRequest != null) {
        if (typeof e.storageWriteRequest != "object")
          throw TypeError(".PB.Main.storageWriteRequest: object expected");
        i.storageWriteRequest = $root.PB_Storage.WriteRequest.fromObject(e.storageWriteRequest);
      }
      if (e.storageDeleteRequest != null) {
        if (typeof e.storageDeleteRequest != "object")
          throw TypeError(".PB.Main.storageDeleteRequest: object expected");
        i.storageDeleteRequest = $root.PB_Storage.DeleteRequest.fromObject(e.storageDeleteRequest);
      }
      if (e.storageMkdirRequest != null) {
        if (typeof e.storageMkdirRequest != "object")
          throw TypeError(".PB.Main.storageMkdirRequest: object expected");
        i.storageMkdirRequest = $root.PB_Storage.MkdirRequest.fromObject(e.storageMkdirRequest);
      }
      if (e.storageMd5sumRequest != null) {
        if (typeof e.storageMd5sumRequest != "object")
          throw TypeError(".PB.Main.storageMd5sumRequest: object expected");
        i.storageMd5sumRequest = $root.PB_Storage.Md5sumRequest.fromObject(e.storageMd5sumRequest);
      }
      if (e.storageMd5sumResponse != null) {
        if (typeof e.storageMd5sumResponse != "object")
          throw TypeError(".PB.Main.storageMd5sumResponse: object expected");
        i.storageMd5sumResponse = $root.PB_Storage.Md5sumResponse.fromObject(e.storageMd5sumResponse);
      }
      if (e.storageRenameRequest != null) {
        if (typeof e.storageRenameRequest != "object")
          throw TypeError(".PB.Main.storageRenameRequest: object expected");
        i.storageRenameRequest = $root.PB_Storage.RenameRequest.fromObject(e.storageRenameRequest);
      }
      if (e.storageBackupCreateRequest != null) {
        if (typeof e.storageBackupCreateRequest != "object")
          throw TypeError(".PB.Main.storageBackupCreateRequest: object expected");
        i.storageBackupCreateRequest = $root.PB_Storage.BackupCreateRequest.fromObject(e.storageBackupCreateRequest);
      }
      if (e.storageBackupRestoreRequest != null) {
        if (typeof e.storageBackupRestoreRequest != "object")
          throw TypeError(".PB.Main.storageBackupRestoreRequest: object expected");
        i.storageBackupRestoreRequest = $root.PB_Storage.BackupRestoreRequest.fromObject(e.storageBackupRestoreRequest);
      }
      if (e.appStartRequest != null) {
        if (typeof e.appStartRequest != "object")
          throw TypeError(".PB.Main.appStartRequest: object expected");
        i.appStartRequest = $root.PB_App.StartRequest.fromObject(e.appStartRequest);
      }
      if (e.appLockStatusRequest != null) {
        if (typeof e.appLockStatusRequest != "object")
          throw TypeError(".PB.Main.appLockStatusRequest: object expected");
        i.appLockStatusRequest = $root.PB_App.LockStatusRequest.fromObject(e.appLockStatusRequest);
      }
      if (e.appLockStatusResponse != null) {
        if (typeof e.appLockStatusResponse != "object")
          throw TypeError(".PB.Main.appLockStatusResponse: object expected");
        i.appLockStatusResponse = $root.PB_App.LockStatusResponse.fromObject(e.appLockStatusResponse);
      }
      if (e.appExitRequest != null) {
        if (typeof e.appExitRequest != "object")
          throw TypeError(".PB.Main.appExitRequest: object expected");
        i.appExitRequest = $root.PB_App.AppExitRequest.fromObject(e.appExitRequest);
      }
      if (e.appLoadFileRequest != null) {
        if (typeof e.appLoadFileRequest != "object")
          throw TypeError(".PB.Main.appLoadFileRequest: object expected");
        i.appLoadFileRequest = $root.PB_App.AppLoadFileRequest.fromObject(e.appLoadFileRequest);
      }
      if (e.appButtonPressRequest != null) {
        if (typeof e.appButtonPressRequest != "object")
          throw TypeError(".PB.Main.appButtonPressRequest: object expected");
        i.appButtonPressRequest = $root.PB_App.AppButtonPressRequest.fromObject(e.appButtonPressRequest);
      }
      if (e.appButtonReleaseRequest != null) {
        if (typeof e.appButtonReleaseRequest != "object")
          throw TypeError(".PB.Main.appButtonReleaseRequest: object expected");
        i.appButtonReleaseRequest = $root.PB_App.AppButtonReleaseRequest.fromObject(e.appButtonReleaseRequest);
      }
      if (e.appGetErrorRequest != null) {
        if (typeof e.appGetErrorRequest != "object")
          throw TypeError(".PB.Main.appGetErrorRequest: object expected");
        i.appGetErrorRequest = $root.PB_App.GetErrorRequest.fromObject(e.appGetErrorRequest);
      }
      if (e.appGetErrorResponse != null) {
        if (typeof e.appGetErrorResponse != "object")
          throw TypeError(".PB.Main.appGetErrorResponse: object expected");
        i.appGetErrorResponse = $root.PB_App.GetErrorResponse.fromObject(e.appGetErrorResponse);
      }
      if (e.appDataExchangeRequest != null) {
        if (typeof e.appDataExchangeRequest != "object")
          throw TypeError(".PB.Main.appDataExchangeRequest: object expected");
        i.appDataExchangeRequest = $root.PB_App.DataExchangeRequest.fromObject(e.appDataExchangeRequest);
      }
      if (e.guiStartScreenStreamRequest != null) {
        if (typeof e.guiStartScreenStreamRequest != "object")
          throw TypeError(".PB.Main.guiStartScreenStreamRequest: object expected");
        i.guiStartScreenStreamRequest = $root.PB_Gui.StartScreenStreamRequest.fromObject(e.guiStartScreenStreamRequest);
      }
      if (e.guiStopScreenStreamRequest != null) {
        if (typeof e.guiStopScreenStreamRequest != "object")
          throw TypeError(".PB.Main.guiStopScreenStreamRequest: object expected");
        i.guiStopScreenStreamRequest = $root.PB_Gui.StopScreenStreamRequest.fromObject(e.guiStopScreenStreamRequest);
      }
      if (e.guiScreenFrame != null) {
        if (typeof e.guiScreenFrame != "object")
          throw TypeError(".PB.Main.guiScreenFrame: object expected");
        i.guiScreenFrame = $root.PB_Gui.ScreenFrame.fromObject(e.guiScreenFrame);
      }
      if (e.guiSendInputEventRequest != null) {
        if (typeof e.guiSendInputEventRequest != "object")
          throw TypeError(".PB.Main.guiSendInputEventRequest: object expected");
        i.guiSendInputEventRequest = $root.PB_Gui.SendInputEventRequest.fromObject(e.guiSendInputEventRequest);
      }
      if (e.guiStartVirtualDisplayRequest != null) {
        if (typeof e.guiStartVirtualDisplayRequest != "object")
          throw TypeError(".PB.Main.guiStartVirtualDisplayRequest: object expected");
        i.guiStartVirtualDisplayRequest = $root.PB_Gui.StartVirtualDisplayRequest.fromObject(e.guiStartVirtualDisplayRequest);
      }
      if (e.guiStopVirtualDisplayRequest != null) {
        if (typeof e.guiStopVirtualDisplayRequest != "object")
          throw TypeError(".PB.Main.guiStopVirtualDisplayRequest: object expected");
        i.guiStopVirtualDisplayRequest = $root.PB_Gui.StopVirtualDisplayRequest.fromObject(e.guiStopVirtualDisplayRequest);
      }
      if (e.gpioSetPinMode != null) {
        if (typeof e.gpioSetPinMode != "object")
          throw TypeError(".PB.Main.gpioSetPinMode: object expected");
        i.gpioSetPinMode = $root.PB_Gpio.SetPinMode.fromObject(e.gpioSetPinMode);
      }
      if (e.gpioSetInputPull != null) {
        if (typeof e.gpioSetInputPull != "object")
          throw TypeError(".PB.Main.gpioSetInputPull: object expected");
        i.gpioSetInputPull = $root.PB_Gpio.SetInputPull.fromObject(e.gpioSetInputPull);
      }
      if (e.gpioGetPinMode != null) {
        if (typeof e.gpioGetPinMode != "object")
          throw TypeError(".PB.Main.gpioGetPinMode: object expected");
        i.gpioGetPinMode = $root.PB_Gpio.GetPinMode.fromObject(e.gpioGetPinMode);
      }
      if (e.gpioGetPinModeResponse != null) {
        if (typeof e.gpioGetPinModeResponse != "object")
          throw TypeError(".PB.Main.gpioGetPinModeResponse: object expected");
        i.gpioGetPinModeResponse = $root.PB_Gpio.GetPinModeResponse.fromObject(e.gpioGetPinModeResponse);
      }
      if (e.gpioReadPin != null) {
        if (typeof e.gpioReadPin != "object")
          throw TypeError(".PB.Main.gpioReadPin: object expected");
        i.gpioReadPin = $root.PB_Gpio.ReadPin.fromObject(e.gpioReadPin);
      }
      if (e.gpioReadPinResponse != null) {
        if (typeof e.gpioReadPinResponse != "object")
          throw TypeError(".PB.Main.gpioReadPinResponse: object expected");
        i.gpioReadPinResponse = $root.PB_Gpio.ReadPinResponse.fromObject(e.gpioReadPinResponse);
      }
      if (e.gpioWritePin != null) {
        if (typeof e.gpioWritePin != "object")
          throw TypeError(".PB.Main.gpioWritePin: object expected");
        i.gpioWritePin = $root.PB_Gpio.WritePin.fromObject(e.gpioWritePin);
      }
      if (e.appStateResponse != null) {
        if (typeof e.appStateResponse != "object")
          throw TypeError(".PB.Main.appStateResponse: object expected");
        i.appStateResponse = $root.PB_App.AppStateResponse.fromObject(e.appStateResponse);
      }
      if (e.propertyGetRequest != null) {
        if (typeof e.propertyGetRequest != "object")
          throw TypeError(".PB.Main.propertyGetRequest: object expected");
        i.propertyGetRequest = $root.PB_Property.GetRequest.fromObject(e.propertyGetRequest);
      }
      if (e.propertyGetResponse != null) {
        if (typeof e.propertyGetResponse != "object")
          throw TypeError(".PB.Main.propertyGetResponse: object expected");
        i.propertyGetResponse = $root.PB_Property.GetResponse.fromObject(e.propertyGetResponse);
      }
      return i;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(e, i) {
      i || (i = {});
      const u = {};
      return i.defaults && (u.commandId = 0, u.commandStatus = i.enums === String ? "OK" : 0, u.hasNext = !1), e.commandId != null && e.hasOwnProperty("commandId") && (u.commandId = e.commandId), e.commandStatus != null && e.hasOwnProperty("commandStatus") && (u.commandStatus = i.enums === String ? $root.PB.CommandStatus[e.commandStatus] : e.commandStatus), e.hasNext != null && e.hasOwnProperty("hasNext") && (u.hasNext = e.hasNext), e.empty != null && e.hasOwnProperty("empty") && (u.empty = $root.PB.Empty.toObject(e.empty, i), i.oneofs && (u.content = "empty")), e.systemPingRequest != null && e.hasOwnProperty("systemPingRequest") && (u.systemPingRequest = $root.PB_System.PingRequest.toObject(e.systemPingRequest, i), i.oneofs && (u.content = "systemPingRequest")), e.systemPingResponse != null && e.hasOwnProperty("systemPingResponse") && (u.systemPingResponse = $root.PB_System.PingResponse.toObject(e.systemPingResponse, i), i.oneofs && (u.content = "systemPingResponse")), e.storageListRequest != null && e.hasOwnProperty("storageListRequest") && (u.storageListRequest = $root.PB_Storage.ListRequest.toObject(e.storageListRequest, i), i.oneofs && (u.content = "storageListRequest")), e.storageListResponse != null && e.hasOwnProperty("storageListResponse") && (u.storageListResponse = $root.PB_Storage.ListResponse.toObject(e.storageListResponse, i), i.oneofs && (u.content = "storageListResponse")), e.storageReadRequest != null && e.hasOwnProperty("storageReadRequest") && (u.storageReadRequest = $root.PB_Storage.ReadRequest.toObject(e.storageReadRequest, i), i.oneofs && (u.content = "storageReadRequest")), e.storageReadResponse != null && e.hasOwnProperty("storageReadResponse") && (u.storageReadResponse = $root.PB_Storage.ReadResponse.toObject(e.storageReadResponse, i), i.oneofs && (u.content = "storageReadResponse")), e.storageWriteRequest != null && e.hasOwnProperty("storageWriteRequest") && (u.storageWriteRequest = $root.PB_Storage.WriteRequest.toObject(e.storageWriteRequest, i), i.oneofs && (u.content = "storageWriteRequest")), e.storageDeleteRequest != null && e.hasOwnProperty("storageDeleteRequest") && (u.storageDeleteRequest = $root.PB_Storage.DeleteRequest.toObject(e.storageDeleteRequest, i), i.oneofs && (u.content = "storageDeleteRequest")), e.storageMkdirRequest != null && e.hasOwnProperty("storageMkdirRequest") && (u.storageMkdirRequest = $root.PB_Storage.MkdirRequest.toObject(e.storageMkdirRequest, i), i.oneofs && (u.content = "storageMkdirRequest")), e.storageMd5sumRequest != null && e.hasOwnProperty("storageMd5sumRequest") && (u.storageMd5sumRequest = $root.PB_Storage.Md5sumRequest.toObject(e.storageMd5sumRequest, i), i.oneofs && (u.content = "storageMd5sumRequest")), e.storageMd5sumResponse != null && e.hasOwnProperty("storageMd5sumResponse") && (u.storageMd5sumResponse = $root.PB_Storage.Md5sumResponse.toObject(e.storageMd5sumResponse, i), i.oneofs && (u.content = "storageMd5sumResponse")), e.appStartRequest != null && e.hasOwnProperty("appStartRequest") && (u.appStartRequest = $root.PB_App.StartRequest.toObject(e.appStartRequest, i), i.oneofs && (u.content = "appStartRequest")), e.appLockStatusRequest != null && e.hasOwnProperty("appLockStatusRequest") && (u.appLockStatusRequest = $root.PB_App.LockStatusRequest.toObject(e.appLockStatusRequest, i), i.oneofs && (u.content = "appLockStatusRequest")), e.appLockStatusResponse != null && e.hasOwnProperty("appLockStatusResponse") && (u.appLockStatusResponse = $root.PB_App.LockStatusResponse.toObject(e.appLockStatusResponse, i), i.oneofs && (u.content = "appLockStatusResponse")), e.stopSession != null && e.hasOwnProperty("stopSession") && (u.stopSession = $root.PB.StopSession.toObject(e.stopSession, i), i.oneofs && (u.content = "stopSession")), e.guiStartScreenStreamRequest != null && e.hasOwnProperty("guiStartScreenStreamRequest") && (u.guiStartScreenStreamRequest = $root.PB_Gui.StartScreenStreamRequest.toObject(e.guiStartScreenStreamRequest, i), i.oneofs && (u.content = "guiStartScreenStreamRequest")), e.guiStopScreenStreamRequest != null && e.hasOwnProperty("guiStopScreenStreamRequest") && (u.guiStopScreenStreamRequest = $root.PB_Gui.StopScreenStreamRequest.toObject(e.guiStopScreenStreamRequest, i), i.oneofs && (u.content = "guiStopScreenStreamRequest")), e.guiScreenFrame != null && e.hasOwnProperty("guiScreenFrame") && (u.guiScreenFrame = $root.PB_Gui.ScreenFrame.toObject(e.guiScreenFrame, i), i.oneofs && (u.content = "guiScreenFrame")), e.guiSendInputEventRequest != null && e.hasOwnProperty("guiSendInputEventRequest") && (u.guiSendInputEventRequest = $root.PB_Gui.SendInputEventRequest.toObject(e.guiSendInputEventRequest, i), i.oneofs && (u.content = "guiSendInputEventRequest")), e.storageStatRequest != null && e.hasOwnProperty("storageStatRequest") && (u.storageStatRequest = $root.PB_Storage.StatRequest.toObject(e.storageStatRequest, i), i.oneofs && (u.content = "storageStatRequest")), e.storageStatResponse != null && e.hasOwnProperty("storageStatResponse") && (u.storageStatResponse = $root.PB_Storage.StatResponse.toObject(e.storageStatResponse, i), i.oneofs && (u.content = "storageStatResponse")), e.guiStartVirtualDisplayRequest != null && e.hasOwnProperty("guiStartVirtualDisplayRequest") && (u.guiStartVirtualDisplayRequest = $root.PB_Gui.StartVirtualDisplayRequest.toObject(e.guiStartVirtualDisplayRequest, i), i.oneofs && (u.content = "guiStartVirtualDisplayRequest")), e.guiStopVirtualDisplayRequest != null && e.hasOwnProperty("guiStopVirtualDisplayRequest") && (u.guiStopVirtualDisplayRequest = $root.PB_Gui.StopVirtualDisplayRequest.toObject(e.guiStopVirtualDisplayRequest, i), i.oneofs && (u.content = "guiStopVirtualDisplayRequest")), e.storageInfoRequest != null && e.hasOwnProperty("storageInfoRequest") && (u.storageInfoRequest = $root.PB_Storage.InfoRequest.toObject(e.storageInfoRequest, i), i.oneofs && (u.content = "storageInfoRequest")), e.storageInfoResponse != null && e.hasOwnProperty("storageInfoResponse") && (u.storageInfoResponse = $root.PB_Storage.InfoResponse.toObject(e.storageInfoResponse, i), i.oneofs && (u.content = "storageInfoResponse")), e.storageRenameRequest != null && e.hasOwnProperty("storageRenameRequest") && (u.storageRenameRequest = $root.PB_Storage.RenameRequest.toObject(e.storageRenameRequest, i), i.oneofs && (u.content = "storageRenameRequest")), e.systemRebootRequest != null && e.hasOwnProperty("systemRebootRequest") && (u.systemRebootRequest = $root.PB_System.RebootRequest.toObject(e.systemRebootRequest, i), i.oneofs && (u.content = "systemRebootRequest")), e.systemDeviceInfoRequest != null && e.hasOwnProperty("systemDeviceInfoRequest") && (u.systemDeviceInfoRequest = $root.PB_System.DeviceInfoRequest.toObject(e.systemDeviceInfoRequest, i), i.oneofs && (u.content = "systemDeviceInfoRequest")), e.systemDeviceInfoResponse != null && e.hasOwnProperty("systemDeviceInfoResponse") && (u.systemDeviceInfoResponse = $root.PB_System.DeviceInfoResponse.toObject(e.systemDeviceInfoResponse, i), i.oneofs && (u.content = "systemDeviceInfoResponse")), e.systemFactoryResetRequest != null && e.hasOwnProperty("systemFactoryResetRequest") && (u.systemFactoryResetRequest = $root.PB_System.FactoryResetRequest.toObject(e.systemFactoryResetRequest, i), i.oneofs && (u.content = "systemFactoryResetRequest")), e.systemGetDatetimeRequest != null && e.hasOwnProperty("systemGetDatetimeRequest") && (u.systemGetDatetimeRequest = $root.PB_System.GetDateTimeRequest.toObject(e.systemGetDatetimeRequest, i), i.oneofs && (u.content = "systemGetDatetimeRequest")), e.systemGetDatetimeResponse != null && e.hasOwnProperty("systemGetDatetimeResponse") && (u.systemGetDatetimeResponse = $root.PB_System.GetDateTimeResponse.toObject(e.systemGetDatetimeResponse, i), i.oneofs && (u.content = "systemGetDatetimeResponse")), e.systemSetDatetimeRequest != null && e.hasOwnProperty("systemSetDatetimeRequest") && (u.systemSetDatetimeRequest = $root.PB_System.SetDateTimeRequest.toObject(e.systemSetDatetimeRequest, i), i.oneofs && (u.content = "systemSetDatetimeRequest")), e.systemPlayAudiovisualAlertRequest != null && e.hasOwnProperty("systemPlayAudiovisualAlertRequest") && (u.systemPlayAudiovisualAlertRequest = $root.PB_System.PlayAudiovisualAlertRequest.toObject(e.systemPlayAudiovisualAlertRequest, i), i.oneofs && (u.content = "systemPlayAudiovisualAlertRequest")), e.systemProtobufVersionRequest != null && e.hasOwnProperty("systemProtobufVersionRequest") && (u.systemProtobufVersionRequest = $root.PB_System.ProtobufVersionRequest.toObject(e.systemProtobufVersionRequest, i), i.oneofs && (u.content = "systemProtobufVersionRequest")), e.systemProtobufVersionResponse != null && e.hasOwnProperty("systemProtobufVersionResponse") && (u.systemProtobufVersionResponse = $root.PB_System.ProtobufVersionResponse.toObject(e.systemProtobufVersionResponse, i), i.oneofs && (u.content = "systemProtobufVersionResponse")), e.systemUpdateRequest != null && e.hasOwnProperty("systemUpdateRequest") && (u.systemUpdateRequest = $root.PB_System.UpdateRequest.toObject(e.systemUpdateRequest, i), i.oneofs && (u.content = "systemUpdateRequest")), e.storageBackupCreateRequest != null && e.hasOwnProperty("storageBackupCreateRequest") && (u.storageBackupCreateRequest = $root.PB_Storage.BackupCreateRequest.toObject(e.storageBackupCreateRequest, i), i.oneofs && (u.content = "storageBackupCreateRequest")), e.storageBackupRestoreRequest != null && e.hasOwnProperty("storageBackupRestoreRequest") && (u.storageBackupRestoreRequest = $root.PB_Storage.BackupRestoreRequest.toObject(e.storageBackupRestoreRequest, i), i.oneofs && (u.content = "storageBackupRestoreRequest")), e.systemPowerInfoRequest != null && e.hasOwnProperty("systemPowerInfoRequest") && (u.systemPowerInfoRequest = $root.PB_System.PowerInfoRequest.toObject(e.systemPowerInfoRequest, i), i.oneofs && (u.content = "systemPowerInfoRequest")), e.systemPowerInfoResponse != null && e.hasOwnProperty("systemPowerInfoResponse") && (u.systemPowerInfoResponse = $root.PB_System.PowerInfoResponse.toObject(e.systemPowerInfoResponse, i), i.oneofs && (u.content = "systemPowerInfoResponse")), e.systemUpdateResponse != null && e.hasOwnProperty("systemUpdateResponse") && (u.systemUpdateResponse = $root.PB_System.UpdateResponse.toObject(e.systemUpdateResponse, i), i.oneofs && (u.content = "systemUpdateResponse")), e.appExitRequest != null && e.hasOwnProperty("appExitRequest") && (u.appExitRequest = $root.PB_App.AppExitRequest.toObject(e.appExitRequest, i), i.oneofs && (u.content = "appExitRequest")), e.appLoadFileRequest != null && e.hasOwnProperty("appLoadFileRequest") && (u.appLoadFileRequest = $root.PB_App.AppLoadFileRequest.toObject(e.appLoadFileRequest, i), i.oneofs && (u.content = "appLoadFileRequest")), e.appButtonPressRequest != null && e.hasOwnProperty("appButtonPressRequest") && (u.appButtonPressRequest = $root.PB_App.AppButtonPressRequest.toObject(e.appButtonPressRequest, i), i.oneofs && (u.content = "appButtonPressRequest")), e.appButtonReleaseRequest != null && e.hasOwnProperty("appButtonReleaseRequest") && (u.appButtonReleaseRequest = $root.PB_App.AppButtonReleaseRequest.toObject(e.appButtonReleaseRequest, i), i.oneofs && (u.content = "appButtonReleaseRequest")), e.gpioSetPinMode != null && e.hasOwnProperty("gpioSetPinMode") && (u.gpioSetPinMode = $root.PB_Gpio.SetPinMode.toObject(e.gpioSetPinMode, i), i.oneofs && (u.content = "gpioSetPinMode")), e.gpioSetInputPull != null && e.hasOwnProperty("gpioSetInputPull") && (u.gpioSetInputPull = $root.PB_Gpio.SetInputPull.toObject(e.gpioSetInputPull, i), i.oneofs && (u.content = "gpioSetInputPull")), e.gpioGetPinMode != null && e.hasOwnProperty("gpioGetPinMode") && (u.gpioGetPinMode = $root.PB_Gpio.GetPinMode.toObject(e.gpioGetPinMode, i), i.oneofs && (u.content = "gpioGetPinMode")), e.gpioGetPinModeResponse != null && e.hasOwnProperty("gpioGetPinModeResponse") && (u.gpioGetPinModeResponse = $root.PB_Gpio.GetPinModeResponse.toObject(e.gpioGetPinModeResponse, i), i.oneofs && (u.content = "gpioGetPinModeResponse")), e.gpioReadPin != null && e.hasOwnProperty("gpioReadPin") && (u.gpioReadPin = $root.PB_Gpio.ReadPin.toObject(e.gpioReadPin, i), i.oneofs && (u.content = "gpioReadPin")), e.gpioReadPinResponse != null && e.hasOwnProperty("gpioReadPinResponse") && (u.gpioReadPinResponse = $root.PB_Gpio.ReadPinResponse.toObject(e.gpioReadPinResponse, i), i.oneofs && (u.content = "gpioReadPinResponse")), e.gpioWritePin != null && e.hasOwnProperty("gpioWritePin") && (u.gpioWritePin = $root.PB_Gpio.WritePin.toObject(e.gpioWritePin, i), i.oneofs && (u.content = "gpioWritePin")), e.appStateResponse != null && e.hasOwnProperty("appStateResponse") && (u.appStateResponse = $root.PB_App.AppStateResponse.toObject(e.appStateResponse, i), i.oneofs && (u.content = "appStateResponse")), e.storageTimestampRequest != null && e.hasOwnProperty("storageTimestampRequest") && (u.storageTimestampRequest = $root.PB_Storage.TimestampRequest.toObject(e.storageTimestampRequest, i), i.oneofs && (u.content = "storageTimestampRequest")), e.storageTimestampResponse != null && e.hasOwnProperty("storageTimestampResponse") && (u.storageTimestampResponse = $root.PB_Storage.TimestampResponse.toObject(e.storageTimestampResponse, i), i.oneofs && (u.content = "storageTimestampResponse")), e.propertyGetRequest != null && e.hasOwnProperty("propertyGetRequest") && (u.propertyGetRequest = $root.PB_Property.GetRequest.toObject(e.propertyGetRequest, i), i.oneofs && (u.content = "propertyGetRequest")), e.propertyGetResponse != null && e.hasOwnProperty("propertyGetResponse") && (u.propertyGetResponse = $root.PB_Property.GetResponse.toObject(e.propertyGetResponse, i), i.oneofs && (u.content = "propertyGetResponse")), e.appGetErrorRequest != null && e.hasOwnProperty("appGetErrorRequest") && (u.appGetErrorRequest = $root.PB_App.GetErrorRequest.toObject(e.appGetErrorRequest, i), i.oneofs && (u.content = "appGetErrorRequest")), e.appGetErrorResponse != null && e.hasOwnProperty("appGetErrorResponse") && (u.appGetErrorResponse = $root.PB_App.GetErrorResponse.toObject(e.appGetErrorResponse, i), i.oneofs && (u.content = "appGetErrorResponse")), e.appDataExchangeRequest != null && e.hasOwnProperty("appDataExchangeRequest") && (u.appDataExchangeRequest = $root.PB_App.DataExchangeRequest.toObject(e.appDataExchangeRequest, i), i.oneofs && (u.content = "appDataExchangeRequest")), u;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.Region = function() {
    function n(o) {
      if (this.bands = [], o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "Region"), n.prototype.countryCode = $util.newBuffer([]), n.prototype.bands = $util.emptyArray, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      if (e || (e = $Writer.create()), t.countryCode != null && Object.hasOwnProperty.call(t, "countryCode") && e.uint32(10).bytes(t.countryCode), t.bands != null && t.bands.length)
        for (let i = 0; i < t.bands.length; ++i)
          $root.PB.Region.Band.encode(t.bands[i], e.uint32(18).fork()).ldelim();
      return e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB.Region();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.countryCode = t.bytes();
            break;
          case 2:
            u.bands && u.bands.length || (u.bands = []), u.bands.push($root.PB.Region.Band.decode(t, t.uint32()));
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.countryCode != null && t.hasOwnProperty("countryCode") && !(t.countryCode && typeof t.countryCode.length == "number" || $util.isString(t.countryCode)))
        return "countryCode: buffer expected";
      if (t.bands != null && t.hasOwnProperty("bands")) {
        if (!Array.isArray(t.bands))
          return "bands: array expected";
        for (let e = 0; e < t.bands.length; ++e) {
          const i = $root.PB.Region.Band.verify(t.bands[e]);
          if (i)
            return "bands." + i;
        }
      }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB.Region)
        return t;
      const e = new $root.PB.Region();
      if (t.countryCode != null && (typeof t.countryCode == "string" ? $util.base64.decode(t.countryCode, e.countryCode = $util.newBuffer($util.base64.length(t.countryCode)), 0) : t.countryCode.length && (e.countryCode = t.countryCode)), t.bands) {
        if (!Array.isArray(t.bands))
          throw TypeError(".PB.Region.bands: array expected");
        e.bands = [];
        for (let i = 0; i < t.bands.length; ++i) {
          if (typeof t.bands[i] != "object")
            throw TypeError(".PB.Region.bands: object expected");
          e.bands[i] = $root.PB.Region.Band.fromObject(t.bands[i]);
        }
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      if ((e.arrays || e.defaults) && (i.bands = []), e.defaults && (e.bytes === String ? i.countryCode = "" : (i.countryCode = [], e.bytes !== Array && (i.countryCode = $util.newBuffer(i.countryCode)))), t.countryCode != null && t.hasOwnProperty("countryCode") && (i.countryCode = e.bytes === String ? $util.base64.encode(t.countryCode, 0, t.countryCode.length) : e.bytes === Array ? Array.prototype.slice.call(t.countryCode) : t.countryCode), t.bands && t.bands.length) {
        i.bands = [];
        for (let u = 0; u < t.bands.length; ++u)
          i.bands[u] = $root.PB.Region.Band.toObject(t.bands[u], e);
      }
      return i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n.Band = function() {
      function o(t) {
        if (t)
          for (let e = Object.keys(t), i = 0; i < e.length; ++i)
            t[e[i]] != null && (this[e[i]] = t[e[i]]);
      }
      return r(o, "Band"), o.prototype.start = 0, o.prototype.end = 0, o.prototype.powerLimit = 0, o.prototype.dutyCycle = 0, o.create = /* @__PURE__ */ r(function(e) {
        return new o(e);
      }, "create"), o.encode = /* @__PURE__ */ r(function(e, i) {
        return i || (i = $Writer.create()), e.start != null && Object.hasOwnProperty.call(e, "start") && i.uint32(8).uint32(e.start), e.end != null && Object.hasOwnProperty.call(e, "end") && i.uint32(16).uint32(e.end), e.powerLimit != null && Object.hasOwnProperty.call(e, "powerLimit") && i.uint32(24).int32(e.powerLimit), e.dutyCycle != null && Object.hasOwnProperty.call(e, "dutyCycle") && i.uint32(32).uint32(e.dutyCycle), i;
      }, "encode"), o.encodeDelimited = /* @__PURE__ */ r(function(e, i) {
        return this.encode(e, i).ldelim();
      }, "encodeDelimited"), o.decode = /* @__PURE__ */ r(function(e, i) {
        e instanceof $Reader || (e = $Reader.create(e));
        const u = i === void 0 ? e.len : e.pos + i, c = new $root.PB.Region.Band();
        for (; e.pos < u; ) {
          const l = e.uint32();
          switch (l >>> 3) {
            case 1:
              c.start = e.uint32();
              break;
            case 2:
              c.end = e.uint32();
              break;
            case 3:
              c.powerLimit = e.int32();
              break;
            case 4:
              c.dutyCycle = e.uint32();
              break;
            default:
              e.skipType(l & 7);
              break;
          }
        }
        return c;
      }, "decode"), o.decodeDelimited = /* @__PURE__ */ r(function(e) {
        return e instanceof $Reader || (e = new $Reader(e)), this.decode(e, e.uint32());
      }, "decodeDelimited"), o.verify = /* @__PURE__ */ r(function(e) {
        return typeof e != "object" || e === null ? "object expected" : e.start != null && e.hasOwnProperty("start") && !$util.isInteger(e.start) ? "start: integer expected" : e.end != null && e.hasOwnProperty("end") && !$util.isInteger(e.end) ? "end: integer expected" : e.powerLimit != null && e.hasOwnProperty("powerLimit") && !$util.isInteger(e.powerLimit) ? "powerLimit: integer expected" : e.dutyCycle != null && e.hasOwnProperty("dutyCycle") && !$util.isInteger(e.dutyCycle) ? "dutyCycle: integer expected" : null;
      }, "verify"), o.fromObject = /* @__PURE__ */ r(function(e) {
        if (e instanceof $root.PB.Region.Band)
          return e;
        const i = new $root.PB.Region.Band();
        return e.start != null && (i.start = e.start >>> 0), e.end != null && (i.end = e.end >>> 0), e.powerLimit != null && (i.powerLimit = e.powerLimit | 0), e.dutyCycle != null && (i.dutyCycle = e.dutyCycle >>> 0), i;
      }, "fromObject"), o.toObject = /* @__PURE__ */ r(function(e, i) {
        i || (i = {});
        const u = {};
        return i.defaults && (u.start = 0, u.end = 0, u.powerLimit = 0, u.dutyCycle = 0), e.start != null && e.hasOwnProperty("start") && (u.start = e.start), e.end != null && e.hasOwnProperty("end") && (u.end = e.end), e.powerLimit != null && e.hasOwnProperty("powerLimit") && (u.powerLimit = e.powerLimit), e.dutyCycle != null && e.hasOwnProperty("dutyCycle") && (u.dutyCycle = e.dutyCycle), u;
      }, "toObject"), o.prototype.toJSON = /* @__PURE__ */ r(function() {
        return this.constructor.toObject(this, minimal.util.toJSONOptions);
      }, "toJSON"), o;
    }(), n;
  }(), s;
})();
$root.PB_Storage = (() => {
  const s = {};
  return s.File = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "File"), n.prototype.type = 0, n.prototype.name = "", n.prototype.size = 0, n.prototype.data = $util.newBuffer([]), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.type != null && Object.hasOwnProperty.call(t, "type") && e.uint32(8).int32(t.type), t.name != null && Object.hasOwnProperty.call(t, "name") && e.uint32(18).string(t.name), t.size != null && Object.hasOwnProperty.call(t, "size") && e.uint32(24).uint32(t.size), t.data != null && Object.hasOwnProperty.call(t, "data") && e.uint32(34).bytes(t.data), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.File();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.type = t.int32();
            break;
          case 2:
            u.name = t.string();
            break;
          case 3:
            u.size = t.uint32();
            break;
          case 4:
            u.data = t.bytes();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.type != null && t.hasOwnProperty("type"))
        switch (t.type) {
          default:
            return "type: enum value expected";
          case 0:
          case 1:
            break;
        }
      return t.name != null && t.hasOwnProperty("name") && !$util.isString(t.name) ? "name: string expected" : t.size != null && t.hasOwnProperty("size") && !$util.isInteger(t.size) ? "size: integer expected" : t.data != null && t.hasOwnProperty("data") && !(t.data && typeof t.data.length == "number" || $util.isString(t.data)) ? "data: buffer expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.File)
        return t;
      const e = new $root.PB_Storage.File();
      switch (t.type) {
        case "FILE":
        case 0:
          e.type = 0;
          break;
        case "DIR":
        case 1:
          e.type = 1;
          break;
      }
      return t.name != null && (e.name = String(t.name)), t.size != null && (e.size = t.size >>> 0), t.data != null && (typeof t.data == "string" ? $util.base64.decode(t.data, e.data = $util.newBuffer($util.base64.length(t.data)), 0) : t.data.length && (e.data = t.data)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.type = e.enums === String ? "FILE" : 0, i.name = "", i.size = 0, e.bytes === String ? i.data = "" : (i.data = [], e.bytes !== Array && (i.data = $util.newBuffer(i.data)))), t.type != null && t.hasOwnProperty("type") && (i.type = e.enums === String ? $root.PB_Storage.File.FileType[t.type] : t.type), t.name != null && t.hasOwnProperty("name") && (i.name = t.name), t.size != null && t.hasOwnProperty("size") && (i.size = t.size), t.data != null && t.hasOwnProperty("data") && (i.data = e.bytes === String ? $util.base64.encode(t.data, 0, t.data.length) : e.bytes === Array ? Array.prototype.slice.call(t.data) : t.data), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n.FileType = function() {
      const o = {}, t = Object.create(o);
      return t[o[0] = "FILE"] = 0, t[o[1] = "DIR"] = 1, t;
    }(), n;
  }(), s.InfoRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "InfoRequest"), n.prototype.path = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.path != null && Object.hasOwnProperty.call(t, "path") && e.uint32(10).string(t.path), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.InfoRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.path = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.path != null && t.hasOwnProperty("path") && !$util.isString(t.path) ? "path: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.InfoRequest)
        return t;
      const e = new $root.PB_Storage.InfoRequest();
      return t.path != null && (e.path = String(t.path)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.path = ""), t.path != null && t.hasOwnProperty("path") && (i.path = t.path), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.InfoResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "InfoResponse"), n.prototype.totalSpace = $util.Long ? $util.Long.fromBits(0, 0, !0) : 0, n.prototype.freeSpace = $util.Long ? $util.Long.fromBits(0, 0, !0) : 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.totalSpace != null && Object.hasOwnProperty.call(t, "totalSpace") && e.uint32(8).uint64(t.totalSpace), t.freeSpace != null && Object.hasOwnProperty.call(t, "freeSpace") && e.uint32(16).uint64(t.freeSpace), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.InfoResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.totalSpace = t.uint64();
            break;
          case 2:
            u.freeSpace = t.uint64();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.totalSpace != null && t.hasOwnProperty("totalSpace") && !$util.isInteger(t.totalSpace) && !(t.totalSpace && $util.isInteger(t.totalSpace.low) && $util.isInteger(t.totalSpace.high)) ? "totalSpace: integer|Long expected" : t.freeSpace != null && t.hasOwnProperty("freeSpace") && !$util.isInteger(t.freeSpace) && !(t.freeSpace && $util.isInteger(t.freeSpace.low) && $util.isInteger(t.freeSpace.high)) ? "freeSpace: integer|Long expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.InfoResponse)
        return t;
      const e = new $root.PB_Storage.InfoResponse();
      return t.totalSpace != null && ($util.Long ? (e.totalSpace = $util.Long.fromValue(t.totalSpace)).unsigned = !0 : typeof t.totalSpace == "string" ? e.totalSpace = parseInt(t.totalSpace, 10) : typeof t.totalSpace == "number" ? e.totalSpace = t.totalSpace : typeof t.totalSpace == "object" && (e.totalSpace = new $util.LongBits(t.totalSpace.low >>> 0, t.totalSpace.high >>> 0).toNumber(!0))), t.freeSpace != null && ($util.Long ? (e.freeSpace = $util.Long.fromValue(t.freeSpace)).unsigned = !0 : typeof t.freeSpace == "string" ? e.freeSpace = parseInt(t.freeSpace, 10) : typeof t.freeSpace == "number" ? e.freeSpace = t.freeSpace : typeof t.freeSpace == "object" && (e.freeSpace = new $util.LongBits(t.freeSpace.low >>> 0, t.freeSpace.high >>> 0).toNumber(!0))), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      if (e.defaults) {
        if ($util.Long) {
          const u = new $util.Long(0, 0, !0);
          i.totalSpace = e.longs === String ? u.toString() : e.longs === Number ? u.toNumber() : u;
        } else
          i.totalSpace = e.longs === String ? "0" : 0;
        if ($util.Long) {
          const u = new $util.Long(0, 0, !0);
          i.freeSpace = e.longs === String ? u.toString() : e.longs === Number ? u.toNumber() : u;
        } else
          i.freeSpace = e.longs === String ? "0" : 0;
      }
      return t.totalSpace != null && t.hasOwnProperty("totalSpace") && (typeof t.totalSpace == "number" ? i.totalSpace = e.longs === String ? String(t.totalSpace) : t.totalSpace : i.totalSpace = e.longs === String ? $util.Long.prototype.toString.call(t.totalSpace) : e.longs === Number ? new $util.LongBits(t.totalSpace.low >>> 0, t.totalSpace.high >>> 0).toNumber(!0) : t.totalSpace), t.freeSpace != null && t.hasOwnProperty("freeSpace") && (typeof t.freeSpace == "number" ? i.freeSpace = e.longs === String ? String(t.freeSpace) : t.freeSpace : i.freeSpace = e.longs === String ? $util.Long.prototype.toString.call(t.freeSpace) : e.longs === Number ? new $util.LongBits(t.freeSpace.low >>> 0, t.freeSpace.high >>> 0).toNumber(!0) : t.freeSpace), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.TimestampRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "TimestampRequest"), n.prototype.path = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.path != null && Object.hasOwnProperty.call(t, "path") && e.uint32(10).string(t.path), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.TimestampRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.path = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.path != null && t.hasOwnProperty("path") && !$util.isString(t.path) ? "path: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.TimestampRequest)
        return t;
      const e = new $root.PB_Storage.TimestampRequest();
      return t.path != null && (e.path = String(t.path)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.path = ""), t.path != null && t.hasOwnProperty("path") && (i.path = t.path), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.TimestampResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "TimestampResponse"), n.prototype.timestamp = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.timestamp != null && Object.hasOwnProperty.call(t, "timestamp") && e.uint32(8).uint32(t.timestamp), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.TimestampResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.timestamp = t.uint32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.timestamp != null && t.hasOwnProperty("timestamp") && !$util.isInteger(t.timestamp) ? "timestamp: integer expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.TimestampResponse)
        return t;
      const e = new $root.PB_Storage.TimestampResponse();
      return t.timestamp != null && (e.timestamp = t.timestamp >>> 0), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.timestamp = 0), t.timestamp != null && t.hasOwnProperty("timestamp") && (i.timestamp = t.timestamp), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.StatRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "StatRequest"), n.prototype.path = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.path != null && Object.hasOwnProperty.call(t, "path") && e.uint32(10).string(t.path), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.StatRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.path = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.path != null && t.hasOwnProperty("path") && !$util.isString(t.path) ? "path: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.StatRequest)
        return t;
      const e = new $root.PB_Storage.StatRequest();
      return t.path != null && (e.path = String(t.path)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.path = ""), t.path != null && t.hasOwnProperty("path") && (i.path = t.path), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.StatResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "StatResponse"), n.prototype.file = null, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.file != null && Object.hasOwnProperty.call(t, "file") && $root.PB_Storage.File.encode(t.file, e.uint32(10).fork()).ldelim(), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.StatResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.file = $root.PB_Storage.File.decode(t, t.uint32());
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.file != null && t.hasOwnProperty("file")) {
        const e = $root.PB_Storage.File.verify(t.file);
        if (e)
          return "file." + e;
      }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.StatResponse)
        return t;
      const e = new $root.PB_Storage.StatResponse();
      if (t.file != null) {
        if (typeof t.file != "object")
          throw TypeError(".PB_Storage.StatResponse.file: object expected");
        e.file = $root.PB_Storage.File.fromObject(t.file);
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.file = null), t.file != null && t.hasOwnProperty("file") && (i.file = $root.PB_Storage.File.toObject(t.file, e)), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.ListRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "ListRequest"), n.prototype.path = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.path != null && Object.hasOwnProperty.call(t, "path") && e.uint32(10).string(t.path), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.ListRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.path = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.path != null && t.hasOwnProperty("path") && !$util.isString(t.path) ? "path: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.ListRequest)
        return t;
      const e = new $root.PB_Storage.ListRequest();
      return t.path != null && (e.path = String(t.path)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.path = ""), t.path != null && t.hasOwnProperty("path") && (i.path = t.path), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.ListResponse = function() {
    function n(o) {
      if (this.file = [], o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "ListResponse"), n.prototype.file = $util.emptyArray, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      if (e || (e = $Writer.create()), t.file != null && t.file.length)
        for (let i = 0; i < t.file.length; ++i)
          $root.PB_Storage.File.encode(t.file[i], e.uint32(10).fork()).ldelim();
      return e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.ListResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.file && u.file.length || (u.file = []), u.file.push($root.PB_Storage.File.decode(t, t.uint32()));
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.file != null && t.hasOwnProperty("file")) {
        if (!Array.isArray(t.file))
          return "file: array expected";
        for (let e = 0; e < t.file.length; ++e) {
          const i = $root.PB_Storage.File.verify(t.file[e]);
          if (i)
            return "file." + i;
        }
      }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.ListResponse)
        return t;
      const e = new $root.PB_Storage.ListResponse();
      if (t.file) {
        if (!Array.isArray(t.file))
          throw TypeError(".PB_Storage.ListResponse.file: array expected");
        e.file = [];
        for (let i = 0; i < t.file.length; ++i) {
          if (typeof t.file[i] != "object")
            throw TypeError(".PB_Storage.ListResponse.file: object expected");
          e.file[i] = $root.PB_Storage.File.fromObject(t.file[i]);
        }
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      if ((e.arrays || e.defaults) && (i.file = []), t.file && t.file.length) {
        i.file = [];
        for (let u = 0; u < t.file.length; ++u)
          i.file[u] = $root.PB_Storage.File.toObject(t.file[u], e);
      }
      return i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.ReadRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "ReadRequest"), n.prototype.path = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.path != null && Object.hasOwnProperty.call(t, "path") && e.uint32(10).string(t.path), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.ReadRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.path = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.path != null && t.hasOwnProperty("path") && !$util.isString(t.path) ? "path: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.ReadRequest)
        return t;
      const e = new $root.PB_Storage.ReadRequest();
      return t.path != null && (e.path = String(t.path)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.path = ""), t.path != null && t.hasOwnProperty("path") && (i.path = t.path), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.ReadResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "ReadResponse"), n.prototype.file = null, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.file != null && Object.hasOwnProperty.call(t, "file") && $root.PB_Storage.File.encode(t.file, e.uint32(10).fork()).ldelim(), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.ReadResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.file = $root.PB_Storage.File.decode(t, t.uint32());
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.file != null && t.hasOwnProperty("file")) {
        const e = $root.PB_Storage.File.verify(t.file);
        if (e)
          return "file." + e;
      }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.ReadResponse)
        return t;
      const e = new $root.PB_Storage.ReadResponse();
      if (t.file != null) {
        if (typeof t.file != "object")
          throw TypeError(".PB_Storage.ReadResponse.file: object expected");
        e.file = $root.PB_Storage.File.fromObject(t.file);
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.file = null), t.file != null && t.hasOwnProperty("file") && (i.file = $root.PB_Storage.File.toObject(t.file, e)), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.WriteRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "WriteRequest"), n.prototype.path = "", n.prototype.file = null, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.path != null && Object.hasOwnProperty.call(t, "path") && e.uint32(10).string(t.path), t.file != null && Object.hasOwnProperty.call(t, "file") && $root.PB_Storage.File.encode(t.file, e.uint32(18).fork()).ldelim(), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.WriteRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.path = t.string();
            break;
          case 2:
            u.file = $root.PB_Storage.File.decode(t, t.uint32());
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.path != null && t.hasOwnProperty("path") && !$util.isString(t.path))
        return "path: string expected";
      if (t.file != null && t.hasOwnProperty("file")) {
        const e = $root.PB_Storage.File.verify(t.file);
        if (e)
          return "file." + e;
      }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.WriteRequest)
        return t;
      const e = new $root.PB_Storage.WriteRequest();
      if (t.path != null && (e.path = String(t.path)), t.file != null) {
        if (typeof t.file != "object")
          throw TypeError(".PB_Storage.WriteRequest.file: object expected");
        e.file = $root.PB_Storage.File.fromObject(t.file);
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.path = "", i.file = null), t.path != null && t.hasOwnProperty("path") && (i.path = t.path), t.file != null && t.hasOwnProperty("file") && (i.file = $root.PB_Storage.File.toObject(t.file, e)), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.DeleteRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "DeleteRequest"), n.prototype.path = "", n.prototype.recursive = !1, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.path != null && Object.hasOwnProperty.call(t, "path") && e.uint32(10).string(t.path), t.recursive != null && Object.hasOwnProperty.call(t, "recursive") && e.uint32(16).bool(t.recursive), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.DeleteRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.path = t.string();
            break;
          case 2:
            u.recursive = t.bool();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.path != null && t.hasOwnProperty("path") && !$util.isString(t.path) ? "path: string expected" : t.recursive != null && t.hasOwnProperty("recursive") && typeof t.recursive != "boolean" ? "recursive: boolean expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.DeleteRequest)
        return t;
      const e = new $root.PB_Storage.DeleteRequest();
      return t.path != null && (e.path = String(t.path)), t.recursive != null && (e.recursive = !!t.recursive), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.path = "", i.recursive = !1), t.path != null && t.hasOwnProperty("path") && (i.path = t.path), t.recursive != null && t.hasOwnProperty("recursive") && (i.recursive = t.recursive), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.MkdirRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "MkdirRequest"), n.prototype.path = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.path != null && Object.hasOwnProperty.call(t, "path") && e.uint32(10).string(t.path), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.MkdirRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.path = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.path != null && t.hasOwnProperty("path") && !$util.isString(t.path) ? "path: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.MkdirRequest)
        return t;
      const e = new $root.PB_Storage.MkdirRequest();
      return t.path != null && (e.path = String(t.path)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.path = ""), t.path != null && t.hasOwnProperty("path") && (i.path = t.path), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.Md5sumRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "Md5sumRequest"), n.prototype.path = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.path != null && Object.hasOwnProperty.call(t, "path") && e.uint32(10).string(t.path), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.Md5sumRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.path = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.path != null && t.hasOwnProperty("path") && !$util.isString(t.path) ? "path: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.Md5sumRequest)
        return t;
      const e = new $root.PB_Storage.Md5sumRequest();
      return t.path != null && (e.path = String(t.path)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.path = ""), t.path != null && t.hasOwnProperty("path") && (i.path = t.path), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.Md5sumResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "Md5sumResponse"), n.prototype.md5sum = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.md5sum != null && Object.hasOwnProperty.call(t, "md5sum") && e.uint32(10).string(t.md5sum), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.Md5sumResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.md5sum = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.md5sum != null && t.hasOwnProperty("md5sum") && !$util.isString(t.md5sum) ? "md5sum: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.Md5sumResponse)
        return t;
      const e = new $root.PB_Storage.Md5sumResponse();
      return t.md5sum != null && (e.md5sum = String(t.md5sum)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.md5sum = ""), t.md5sum != null && t.hasOwnProperty("md5sum") && (i.md5sum = t.md5sum), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.RenameRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "RenameRequest"), n.prototype.oldPath = "", n.prototype.newPath = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.oldPath != null && Object.hasOwnProperty.call(t, "oldPath") && e.uint32(10).string(t.oldPath), t.newPath != null && Object.hasOwnProperty.call(t, "newPath") && e.uint32(18).string(t.newPath), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.RenameRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.oldPath = t.string();
            break;
          case 2:
            u.newPath = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.oldPath != null && t.hasOwnProperty("oldPath") && !$util.isString(t.oldPath) ? "oldPath: string expected" : t.newPath != null && t.hasOwnProperty("newPath") && !$util.isString(t.newPath) ? "newPath: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.RenameRequest)
        return t;
      const e = new $root.PB_Storage.RenameRequest();
      return t.oldPath != null && (e.oldPath = String(t.oldPath)), t.newPath != null && (e.newPath = String(t.newPath)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.oldPath = "", i.newPath = ""), t.oldPath != null && t.hasOwnProperty("oldPath") && (i.oldPath = t.oldPath), t.newPath != null && t.hasOwnProperty("newPath") && (i.newPath = t.newPath), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.BackupCreateRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "BackupCreateRequest"), n.prototype.archivePath = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.archivePath != null && Object.hasOwnProperty.call(t, "archivePath") && e.uint32(10).string(t.archivePath), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.BackupCreateRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.archivePath = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.archivePath != null && t.hasOwnProperty("archivePath") && !$util.isString(t.archivePath) ? "archivePath: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.BackupCreateRequest)
        return t;
      const e = new $root.PB_Storage.BackupCreateRequest();
      return t.archivePath != null && (e.archivePath = String(t.archivePath)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.archivePath = ""), t.archivePath != null && t.hasOwnProperty("archivePath") && (i.archivePath = t.archivePath), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.BackupRestoreRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "BackupRestoreRequest"), n.prototype.archivePath = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.archivePath != null && Object.hasOwnProperty.call(t, "archivePath") && e.uint32(10).string(t.archivePath), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Storage.BackupRestoreRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.archivePath = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.archivePath != null && t.hasOwnProperty("archivePath") && !$util.isString(t.archivePath) ? "archivePath: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Storage.BackupRestoreRequest)
        return t;
      const e = new $root.PB_Storage.BackupRestoreRequest();
      return t.archivePath != null && (e.archivePath = String(t.archivePath)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.archivePath = ""), t.archivePath != null && t.hasOwnProperty("archivePath") && (i.archivePath = t.archivePath), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s;
})();
$root.PB_System = (() => {
  const s = {};
  return s.PingRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "PingRequest"), n.prototype.data = $util.newBuffer([]), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.data != null && Object.hasOwnProperty.call(t, "data") && e.uint32(10).bytes(t.data), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.PingRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.data = t.bytes();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.data != null && t.hasOwnProperty("data") && !(t.data && typeof t.data.length == "number" || $util.isString(t.data)) ? "data: buffer expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.PingRequest)
        return t;
      const e = new $root.PB_System.PingRequest();
      return t.data != null && (typeof t.data == "string" ? $util.base64.decode(t.data, e.data = $util.newBuffer($util.base64.length(t.data)), 0) : t.data.length && (e.data = t.data)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (e.bytes === String ? i.data = "" : (i.data = [], e.bytes !== Array && (i.data = $util.newBuffer(i.data)))), t.data != null && t.hasOwnProperty("data") && (i.data = e.bytes === String ? $util.base64.encode(t.data, 0, t.data.length) : e.bytes === Array ? Array.prototype.slice.call(t.data) : t.data), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.PingResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "PingResponse"), n.prototype.data = $util.newBuffer([]), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.data != null && Object.hasOwnProperty.call(t, "data") && e.uint32(10).bytes(t.data), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.PingResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.data = t.bytes();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.data != null && t.hasOwnProperty("data") && !(t.data && typeof t.data.length == "number" || $util.isString(t.data)) ? "data: buffer expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.PingResponse)
        return t;
      const e = new $root.PB_System.PingResponse();
      return t.data != null && (typeof t.data == "string" ? $util.base64.decode(t.data, e.data = $util.newBuffer($util.base64.length(t.data)), 0) : t.data.length && (e.data = t.data)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (e.bytes === String ? i.data = "" : (i.data = [], e.bytes !== Array && (i.data = $util.newBuffer(i.data)))), t.data != null && t.hasOwnProperty("data") && (i.data = e.bytes === String ? $util.base64.encode(t.data, 0, t.data.length) : e.bytes === Array ? Array.prototype.slice.call(t.data) : t.data), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.RebootRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "RebootRequest"), n.prototype.mode = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.mode != null && Object.hasOwnProperty.call(t, "mode") && e.uint32(8).int32(t.mode), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.RebootRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.mode = t.int32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.mode != null && t.hasOwnProperty("mode"))
        switch (t.mode) {
          default:
            return "mode: enum value expected";
          case 0:
          case 1:
          case 2:
            break;
        }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.RebootRequest)
        return t;
      const e = new $root.PB_System.RebootRequest();
      switch (t.mode) {
        case "OS":
        case 0:
          e.mode = 0;
          break;
        case "DFU":
        case 1:
          e.mode = 1;
          break;
        case "UPDATE":
        case 2:
          e.mode = 2;
          break;
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.mode = e.enums === String ? "OS" : 0), t.mode != null && t.hasOwnProperty("mode") && (i.mode = e.enums === String ? $root.PB_System.RebootRequest.RebootMode[t.mode] : t.mode), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n.RebootMode = function() {
      const o = {}, t = Object.create(o);
      return t[o[0] = "OS"] = 0, t[o[1] = "DFU"] = 1, t[o[2] = "UPDATE"] = 2, t;
    }(), n;
  }(), s.DeviceInfoRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "DeviceInfoRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.DeviceInfoRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_System.DeviceInfoRequest ? t : new $root.PB_System.DeviceInfoRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.DeviceInfoResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "DeviceInfoResponse"), n.prototype.key = "", n.prototype.value = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.key != null && Object.hasOwnProperty.call(t, "key") && e.uint32(10).string(t.key), t.value != null && Object.hasOwnProperty.call(t, "value") && e.uint32(18).string(t.value), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.DeviceInfoResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.key = t.string();
            break;
          case 2:
            u.value = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.key != null && t.hasOwnProperty("key") && !$util.isString(t.key) ? "key: string expected" : t.value != null && t.hasOwnProperty("value") && !$util.isString(t.value) ? "value: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.DeviceInfoResponse)
        return t;
      const e = new $root.PB_System.DeviceInfoResponse();
      return t.key != null && (e.key = String(t.key)), t.value != null && (e.value = String(t.value)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.key = "", i.value = ""), t.key != null && t.hasOwnProperty("key") && (i.key = t.key), t.value != null && t.hasOwnProperty("value") && (i.value = t.value), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.FactoryResetRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "FactoryResetRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.FactoryResetRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_System.FactoryResetRequest ? t : new $root.PB_System.FactoryResetRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.GetDateTimeRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "GetDateTimeRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.GetDateTimeRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_System.GetDateTimeRequest ? t : new $root.PB_System.GetDateTimeRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.GetDateTimeResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "GetDateTimeResponse"), n.prototype.datetime = null, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.datetime != null && Object.hasOwnProperty.call(t, "datetime") && $root.PB_System.DateTime.encode(t.datetime, e.uint32(10).fork()).ldelim(), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.GetDateTimeResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.datetime = $root.PB_System.DateTime.decode(t, t.uint32());
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.datetime != null && t.hasOwnProperty("datetime")) {
        const e = $root.PB_System.DateTime.verify(t.datetime);
        if (e)
          return "datetime." + e;
      }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.GetDateTimeResponse)
        return t;
      const e = new $root.PB_System.GetDateTimeResponse();
      if (t.datetime != null) {
        if (typeof t.datetime != "object")
          throw TypeError(".PB_System.GetDateTimeResponse.datetime: object expected");
        e.datetime = $root.PB_System.DateTime.fromObject(t.datetime);
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.datetime = null), t.datetime != null && t.hasOwnProperty("datetime") && (i.datetime = $root.PB_System.DateTime.toObject(t.datetime, e)), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.SetDateTimeRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "SetDateTimeRequest"), n.prototype.datetime = null, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.datetime != null && Object.hasOwnProperty.call(t, "datetime") && $root.PB_System.DateTime.encode(t.datetime, e.uint32(10).fork()).ldelim(), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.SetDateTimeRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.datetime = $root.PB_System.DateTime.decode(t, t.uint32());
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.datetime != null && t.hasOwnProperty("datetime")) {
        const e = $root.PB_System.DateTime.verify(t.datetime);
        if (e)
          return "datetime." + e;
      }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.SetDateTimeRequest)
        return t;
      const e = new $root.PB_System.SetDateTimeRequest();
      if (t.datetime != null) {
        if (typeof t.datetime != "object")
          throw TypeError(".PB_System.SetDateTimeRequest.datetime: object expected");
        e.datetime = $root.PB_System.DateTime.fromObject(t.datetime);
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.datetime = null), t.datetime != null && t.hasOwnProperty("datetime") && (i.datetime = $root.PB_System.DateTime.toObject(t.datetime, e)), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.DateTime = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "DateTime"), n.prototype.hour = 0, n.prototype.minute = 0, n.prototype.second = 0, n.prototype.day = 0, n.prototype.month = 0, n.prototype.year = 0, n.prototype.weekday = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.hour != null && Object.hasOwnProperty.call(t, "hour") && e.uint32(8).uint32(t.hour), t.minute != null && Object.hasOwnProperty.call(t, "minute") && e.uint32(16).uint32(t.minute), t.second != null && Object.hasOwnProperty.call(t, "second") && e.uint32(24).uint32(t.second), t.day != null && Object.hasOwnProperty.call(t, "day") && e.uint32(32).uint32(t.day), t.month != null && Object.hasOwnProperty.call(t, "month") && e.uint32(40).uint32(t.month), t.year != null && Object.hasOwnProperty.call(t, "year") && e.uint32(48).uint32(t.year), t.weekday != null && Object.hasOwnProperty.call(t, "weekday") && e.uint32(56).uint32(t.weekday), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.DateTime();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.hour = t.uint32();
            break;
          case 2:
            u.minute = t.uint32();
            break;
          case 3:
            u.second = t.uint32();
            break;
          case 4:
            u.day = t.uint32();
            break;
          case 5:
            u.month = t.uint32();
            break;
          case 6:
            u.year = t.uint32();
            break;
          case 7:
            u.weekday = t.uint32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.hour != null && t.hasOwnProperty("hour") && !$util.isInteger(t.hour) ? "hour: integer expected" : t.minute != null && t.hasOwnProperty("minute") && !$util.isInteger(t.minute) ? "minute: integer expected" : t.second != null && t.hasOwnProperty("second") && !$util.isInteger(t.second) ? "second: integer expected" : t.day != null && t.hasOwnProperty("day") && !$util.isInteger(t.day) ? "day: integer expected" : t.month != null && t.hasOwnProperty("month") && !$util.isInteger(t.month) ? "month: integer expected" : t.year != null && t.hasOwnProperty("year") && !$util.isInteger(t.year) ? "year: integer expected" : t.weekday != null && t.hasOwnProperty("weekday") && !$util.isInteger(t.weekday) ? "weekday: integer expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.DateTime)
        return t;
      const e = new $root.PB_System.DateTime();
      return t.hour != null && (e.hour = t.hour >>> 0), t.minute != null && (e.minute = t.minute >>> 0), t.second != null && (e.second = t.second >>> 0), t.day != null && (e.day = t.day >>> 0), t.month != null && (e.month = t.month >>> 0), t.year != null && (e.year = t.year >>> 0), t.weekday != null && (e.weekday = t.weekday >>> 0), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.hour = 0, i.minute = 0, i.second = 0, i.day = 0, i.month = 0, i.year = 0, i.weekday = 0), t.hour != null && t.hasOwnProperty("hour") && (i.hour = t.hour), t.minute != null && t.hasOwnProperty("minute") && (i.minute = t.minute), t.second != null && t.hasOwnProperty("second") && (i.second = t.second), t.day != null && t.hasOwnProperty("day") && (i.day = t.day), t.month != null && t.hasOwnProperty("month") && (i.month = t.month), t.year != null && t.hasOwnProperty("year") && (i.year = t.year), t.weekday != null && t.hasOwnProperty("weekday") && (i.weekday = t.weekday), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.PlayAudiovisualAlertRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "PlayAudiovisualAlertRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.PlayAudiovisualAlertRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_System.PlayAudiovisualAlertRequest ? t : new $root.PB_System.PlayAudiovisualAlertRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.ProtobufVersionRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "ProtobufVersionRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.ProtobufVersionRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_System.ProtobufVersionRequest ? t : new $root.PB_System.ProtobufVersionRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.ProtobufVersionResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "ProtobufVersionResponse"), n.prototype.major = 0, n.prototype.minor = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.major != null && Object.hasOwnProperty.call(t, "major") && e.uint32(8).uint32(t.major), t.minor != null && Object.hasOwnProperty.call(t, "minor") && e.uint32(16).uint32(t.minor), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.ProtobufVersionResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.major = t.uint32();
            break;
          case 2:
            u.minor = t.uint32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.major != null && t.hasOwnProperty("major") && !$util.isInteger(t.major) ? "major: integer expected" : t.minor != null && t.hasOwnProperty("minor") && !$util.isInteger(t.minor) ? "minor: integer expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.ProtobufVersionResponse)
        return t;
      const e = new $root.PB_System.ProtobufVersionResponse();
      return t.major != null && (e.major = t.major >>> 0), t.minor != null && (e.minor = t.minor >>> 0), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.major = 0, i.minor = 0), t.major != null && t.hasOwnProperty("major") && (i.major = t.major), t.minor != null && t.hasOwnProperty("minor") && (i.minor = t.minor), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.UpdateRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "UpdateRequest"), n.prototype.updateManifest = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.updateManifest != null && Object.hasOwnProperty.call(t, "updateManifest") && e.uint32(10).string(t.updateManifest), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.UpdateRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.updateManifest = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.updateManifest != null && t.hasOwnProperty("updateManifest") && !$util.isString(t.updateManifest) ? "updateManifest: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.UpdateRequest)
        return t;
      const e = new $root.PB_System.UpdateRequest();
      return t.updateManifest != null && (e.updateManifest = String(t.updateManifest)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.updateManifest = ""), t.updateManifest != null && t.hasOwnProperty("updateManifest") && (i.updateManifest = t.updateManifest), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.UpdateResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "UpdateResponse"), n.prototype.code = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.code != null && Object.hasOwnProperty.call(t, "code") && e.uint32(8).int32(t.code), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.UpdateResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.code = t.int32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.code != null && t.hasOwnProperty("code"))
        switch (t.code) {
          default:
            return "code: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
          case 8:
          case 9:
          case 10:
            break;
        }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.UpdateResponse)
        return t;
      const e = new $root.PB_System.UpdateResponse();
      switch (t.code) {
        case "OK":
        case 0:
          e.code = 0;
          break;
        case "ManifestPathInvalid":
        case 1:
          e.code = 1;
          break;
        case "ManifestFolderNotFound":
        case 2:
          e.code = 2;
          break;
        case "ManifestInvalid":
        case 3:
          e.code = 3;
          break;
        case "StageMissing":
        case 4:
          e.code = 4;
          break;
        case "StageIntegrityError":
        case 5:
          e.code = 5;
          break;
        case "ManifestPointerError":
        case 6:
          e.code = 6;
          break;
        case "TargetMismatch":
        case 7:
          e.code = 7;
          break;
        case "OutdatedManifestVersion":
        case 8:
          e.code = 8;
          break;
        case "IntFull":
        case 9:
          e.code = 9;
          break;
        case "UnspecifiedError":
        case 10:
          e.code = 10;
          break;
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.code = e.enums === String ? "OK" : 0), t.code != null && t.hasOwnProperty("code") && (i.code = e.enums === String ? $root.PB_System.UpdateResponse.UpdateResultCode[t.code] : t.code), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n.UpdateResultCode = function() {
      const o = {}, t = Object.create(o);
      return t[o[0] = "OK"] = 0, t[o[1] = "ManifestPathInvalid"] = 1, t[o[2] = "ManifestFolderNotFound"] = 2, t[o[3] = "ManifestInvalid"] = 3, t[o[4] = "StageMissing"] = 4, t[o[5] = "StageIntegrityError"] = 5, t[o[6] = "ManifestPointerError"] = 6, t[o[7] = "TargetMismatch"] = 7, t[o[8] = "OutdatedManifestVersion"] = 8, t[o[9] = "IntFull"] = 9, t[o[10] = "UnspecifiedError"] = 10, t;
    }(), n;
  }(), s.PowerInfoRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "PowerInfoRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.PowerInfoRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_System.PowerInfoRequest ? t : new $root.PB_System.PowerInfoRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.PowerInfoResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "PowerInfoResponse"), n.prototype.key = "", n.prototype.value = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.key != null && Object.hasOwnProperty.call(t, "key") && e.uint32(10).string(t.key), t.value != null && Object.hasOwnProperty.call(t, "value") && e.uint32(18).string(t.value), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_System.PowerInfoResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.key = t.string();
            break;
          case 2:
            u.value = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.key != null && t.hasOwnProperty("key") && !$util.isString(t.key) ? "key: string expected" : t.value != null && t.hasOwnProperty("value") && !$util.isString(t.value) ? "value: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_System.PowerInfoResponse)
        return t;
      const e = new $root.PB_System.PowerInfoResponse();
      return t.key != null && (e.key = String(t.key)), t.value != null && (e.value = String(t.value)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.key = "", i.value = ""), t.key != null && t.hasOwnProperty("key") && (i.key = t.key), t.value != null && t.hasOwnProperty("value") && (i.value = t.value), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s;
})();
$root.PB_Gui = (() => {
  const s = {};
  return s.InputKey = function() {
    const n = {}, o = Object.create(n);
    return o[n[0] = "UP"] = 0, o[n[1] = "DOWN"] = 1, o[n[2] = "RIGHT"] = 2, o[n[3] = "LEFT"] = 3, o[n[4] = "OK"] = 4, o[n[5] = "BACK"] = 5, o;
  }(), s.InputType = function() {
    const n = {}, o = Object.create(n);
    return o[n[0] = "PRESS"] = 0, o[n[1] = "RELEASE"] = 1, o[n[2] = "SHORT"] = 2, o[n[3] = "LONG"] = 3, o[n[4] = "REPEAT"] = 4, o;
  }(), s.ScreenOrientation = function() {
    const n = {}, o = Object.create(n);
    return o[n[0] = "HORIZONTAL"] = 0, o[n[1] = "HORIZONTAL_FLIP"] = 1, o[n[2] = "VERTICAL"] = 2, o[n[3] = "VERTICAL_FLIP"] = 3, o;
  }(), s.ScreenFrame = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "ScreenFrame"), n.prototype.data = $util.newBuffer([]), n.prototype.orientation = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.data != null && Object.hasOwnProperty.call(t, "data") && e.uint32(10).bytes(t.data), t.orientation != null && Object.hasOwnProperty.call(t, "orientation") && e.uint32(16).int32(t.orientation), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gui.ScreenFrame();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.data = t.bytes();
            break;
          case 2:
            u.orientation = t.int32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.data != null && t.hasOwnProperty("data") && !(t.data && typeof t.data.length == "number" || $util.isString(t.data)))
        return "data: buffer expected";
      if (t.orientation != null && t.hasOwnProperty("orientation"))
        switch (t.orientation) {
          default:
            return "orientation: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
            break;
        }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Gui.ScreenFrame)
        return t;
      const e = new $root.PB_Gui.ScreenFrame();
      switch (t.data != null && (typeof t.data == "string" ? $util.base64.decode(t.data, e.data = $util.newBuffer($util.base64.length(t.data)), 0) : t.data.length && (e.data = t.data)), t.orientation) {
        case "HORIZONTAL":
        case 0:
          e.orientation = 0;
          break;
        case "HORIZONTAL_FLIP":
        case 1:
          e.orientation = 1;
          break;
        case "VERTICAL":
        case 2:
          e.orientation = 2;
          break;
        case "VERTICAL_FLIP":
        case 3:
          e.orientation = 3;
          break;
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (e.bytes === String ? i.data = "" : (i.data = [], e.bytes !== Array && (i.data = $util.newBuffer(i.data))), i.orientation = e.enums === String ? "HORIZONTAL" : 0), t.data != null && t.hasOwnProperty("data") && (i.data = e.bytes === String ? $util.base64.encode(t.data, 0, t.data.length) : e.bytes === Array ? Array.prototype.slice.call(t.data) : t.data), t.orientation != null && t.hasOwnProperty("orientation") && (i.orientation = e.enums === String ? $root.PB_Gui.ScreenOrientation[t.orientation] : t.orientation), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.StartScreenStreamRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "StartScreenStreamRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gui.StartScreenStreamRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_Gui.StartScreenStreamRequest ? t : new $root.PB_Gui.StartScreenStreamRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.StopScreenStreamRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "StopScreenStreamRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gui.StopScreenStreamRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_Gui.StopScreenStreamRequest ? t : new $root.PB_Gui.StopScreenStreamRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.SendInputEventRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "SendInputEventRequest"), n.prototype.key = 0, n.prototype.type = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.key != null && Object.hasOwnProperty.call(t, "key") && e.uint32(8).int32(t.key), t.type != null && Object.hasOwnProperty.call(t, "type") && e.uint32(16).int32(t.type), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gui.SendInputEventRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.key = t.int32();
            break;
          case 2:
            u.type = t.int32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.key != null && t.hasOwnProperty("key"))
        switch (t.key) {
          default:
            return "key: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
        }
      if (t.type != null && t.hasOwnProperty("type"))
        switch (t.type) {
          default:
            return "type: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
            break;
        }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Gui.SendInputEventRequest)
        return t;
      const e = new $root.PB_Gui.SendInputEventRequest();
      switch (t.key) {
        case "UP":
        case 0:
          e.key = 0;
          break;
        case "DOWN":
        case 1:
          e.key = 1;
          break;
        case "RIGHT":
        case 2:
          e.key = 2;
          break;
        case "LEFT":
        case 3:
          e.key = 3;
          break;
        case "OK":
        case 4:
          e.key = 4;
          break;
        case "BACK":
        case 5:
          e.key = 5;
          break;
      }
      switch (t.type) {
        case "PRESS":
        case 0:
          e.type = 0;
          break;
        case "RELEASE":
        case 1:
          e.type = 1;
          break;
        case "SHORT":
        case 2:
          e.type = 2;
          break;
        case "LONG":
        case 3:
          e.type = 3;
          break;
        case "REPEAT":
        case 4:
          e.type = 4;
          break;
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.key = e.enums === String ? "UP" : 0, i.type = e.enums === String ? "PRESS" : 0), t.key != null && t.hasOwnProperty("key") && (i.key = e.enums === String ? $root.PB_Gui.InputKey[t.key] : t.key), t.type != null && t.hasOwnProperty("type") && (i.type = e.enums === String ? $root.PB_Gui.InputType[t.type] : t.type), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.StartVirtualDisplayRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "StartVirtualDisplayRequest"), n.prototype.firstFrame = null, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.firstFrame != null && Object.hasOwnProperty.call(t, "firstFrame") && $root.PB_Gui.ScreenFrame.encode(t.firstFrame, e.uint32(10).fork()).ldelim(), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gui.StartVirtualDisplayRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.firstFrame = $root.PB_Gui.ScreenFrame.decode(t, t.uint32());
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.firstFrame != null && t.hasOwnProperty("firstFrame")) {
        const e = $root.PB_Gui.ScreenFrame.verify(t.firstFrame);
        if (e)
          return "firstFrame." + e;
      }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Gui.StartVirtualDisplayRequest)
        return t;
      const e = new $root.PB_Gui.StartVirtualDisplayRequest();
      if (t.firstFrame != null) {
        if (typeof t.firstFrame != "object")
          throw TypeError(".PB_Gui.StartVirtualDisplayRequest.firstFrame: object expected");
        e.firstFrame = $root.PB_Gui.ScreenFrame.fromObject(t.firstFrame);
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.firstFrame = null), t.firstFrame != null && t.hasOwnProperty("firstFrame") && (i.firstFrame = $root.PB_Gui.ScreenFrame.toObject(t.firstFrame, e)), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.StopVirtualDisplayRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "StopVirtualDisplayRequest"), n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gui.StopVirtualDisplayRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      return t instanceof $root.PB_Gui.StopVirtualDisplayRequest ? t : new $root.PB_Gui.StopVirtualDisplayRequest();
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function() {
      return {};
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s;
})();
$root.PB_Gpio = (() => {
  const s = {};
  return s.GpioPin = function() {
    const n = {}, o = Object.create(n);
    return o[n[0] = "PC0"] = 0, o[n[1] = "PC1"] = 1, o[n[2] = "PC3"] = 2, o[n[3] = "PB2"] = 3, o[n[4] = "PB3"] = 4, o[n[5] = "PA4"] = 5, o[n[6] = "PA6"] = 6, o[n[7] = "PA7"] = 7, o;
  }(), s.GpioPinMode = function() {
    const n = {}, o = Object.create(n);
    return o[n[0] = "OUTPUT"] = 0, o[n[1] = "INPUT"] = 1, o;
  }(), s.GpioInputPull = function() {
    const n = {}, o = Object.create(n);
    return o[n[0] = "NO"] = 0, o[n[1] = "UP"] = 1, o[n[2] = "DOWN"] = 2, o;
  }(), s.SetPinMode = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "SetPinMode"), n.prototype.pin = 0, n.prototype.mode = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.pin != null && Object.hasOwnProperty.call(t, "pin") && e.uint32(8).int32(t.pin), t.mode != null && Object.hasOwnProperty.call(t, "mode") && e.uint32(16).int32(t.mode), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gpio.SetPinMode();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.pin = t.int32();
            break;
          case 2:
            u.mode = t.int32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.pin != null && t.hasOwnProperty("pin"))
        switch (t.pin) {
          default:
            return "pin: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
            break;
        }
      if (t.mode != null && t.hasOwnProperty("mode"))
        switch (t.mode) {
          default:
            return "mode: enum value expected";
          case 0:
          case 1:
            break;
        }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Gpio.SetPinMode)
        return t;
      const e = new $root.PB_Gpio.SetPinMode();
      switch (t.pin) {
        case "PC0":
        case 0:
          e.pin = 0;
          break;
        case "PC1":
        case 1:
          e.pin = 1;
          break;
        case "PC3":
        case 2:
          e.pin = 2;
          break;
        case "PB2":
        case 3:
          e.pin = 3;
          break;
        case "PB3":
        case 4:
          e.pin = 4;
          break;
        case "PA4":
        case 5:
          e.pin = 5;
          break;
        case "PA6":
        case 6:
          e.pin = 6;
          break;
        case "PA7":
        case 7:
          e.pin = 7;
          break;
      }
      switch (t.mode) {
        case "OUTPUT":
        case 0:
          e.mode = 0;
          break;
        case "INPUT":
        case 1:
          e.mode = 1;
          break;
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.pin = e.enums === String ? "PC0" : 0, i.mode = e.enums === String ? "OUTPUT" : 0), t.pin != null && t.hasOwnProperty("pin") && (i.pin = e.enums === String ? $root.PB_Gpio.GpioPin[t.pin] : t.pin), t.mode != null && t.hasOwnProperty("mode") && (i.mode = e.enums === String ? $root.PB_Gpio.GpioPinMode[t.mode] : t.mode), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.SetInputPull = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "SetInputPull"), n.prototype.pin = 0, n.prototype.pullMode = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.pin != null && Object.hasOwnProperty.call(t, "pin") && e.uint32(8).int32(t.pin), t.pullMode != null && Object.hasOwnProperty.call(t, "pullMode") && e.uint32(16).int32(t.pullMode), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gpio.SetInputPull();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.pin = t.int32();
            break;
          case 2:
            u.pullMode = t.int32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.pin != null && t.hasOwnProperty("pin"))
        switch (t.pin) {
          default:
            return "pin: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
            break;
        }
      if (t.pullMode != null && t.hasOwnProperty("pullMode"))
        switch (t.pullMode) {
          default:
            return "pullMode: enum value expected";
          case 0:
          case 1:
          case 2:
            break;
        }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Gpio.SetInputPull)
        return t;
      const e = new $root.PB_Gpio.SetInputPull();
      switch (t.pin) {
        case "PC0":
        case 0:
          e.pin = 0;
          break;
        case "PC1":
        case 1:
          e.pin = 1;
          break;
        case "PC3":
        case 2:
          e.pin = 2;
          break;
        case "PB2":
        case 3:
          e.pin = 3;
          break;
        case "PB3":
        case 4:
          e.pin = 4;
          break;
        case "PA4":
        case 5:
          e.pin = 5;
          break;
        case "PA6":
        case 6:
          e.pin = 6;
          break;
        case "PA7":
        case 7:
          e.pin = 7;
          break;
      }
      switch (t.pullMode) {
        case "NO":
        case 0:
          e.pullMode = 0;
          break;
        case "UP":
        case 1:
          e.pullMode = 1;
          break;
        case "DOWN":
        case 2:
          e.pullMode = 2;
          break;
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.pin = e.enums === String ? "PC0" : 0, i.pullMode = e.enums === String ? "NO" : 0), t.pin != null && t.hasOwnProperty("pin") && (i.pin = e.enums === String ? $root.PB_Gpio.GpioPin[t.pin] : t.pin), t.pullMode != null && t.hasOwnProperty("pullMode") && (i.pullMode = e.enums === String ? $root.PB_Gpio.GpioInputPull[t.pullMode] : t.pullMode), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.GetPinMode = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "GetPinMode"), n.prototype.pin = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.pin != null && Object.hasOwnProperty.call(t, "pin") && e.uint32(8).int32(t.pin), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gpio.GetPinMode();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.pin = t.int32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.pin != null && t.hasOwnProperty("pin"))
        switch (t.pin) {
          default:
            return "pin: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
            break;
        }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Gpio.GetPinMode)
        return t;
      const e = new $root.PB_Gpio.GetPinMode();
      switch (t.pin) {
        case "PC0":
        case 0:
          e.pin = 0;
          break;
        case "PC1":
        case 1:
          e.pin = 1;
          break;
        case "PC3":
        case 2:
          e.pin = 2;
          break;
        case "PB2":
        case 3:
          e.pin = 3;
          break;
        case "PB3":
        case 4:
          e.pin = 4;
          break;
        case "PA4":
        case 5:
          e.pin = 5;
          break;
        case "PA6":
        case 6:
          e.pin = 6;
          break;
        case "PA7":
        case 7:
          e.pin = 7;
          break;
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.pin = e.enums === String ? "PC0" : 0), t.pin != null && t.hasOwnProperty("pin") && (i.pin = e.enums === String ? $root.PB_Gpio.GpioPin[t.pin] : t.pin), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.GetPinModeResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "GetPinModeResponse"), n.prototype.mode = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.mode != null && Object.hasOwnProperty.call(t, "mode") && e.uint32(8).int32(t.mode), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gpio.GetPinModeResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.mode = t.int32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.mode != null && t.hasOwnProperty("mode"))
        switch (t.mode) {
          default:
            return "mode: enum value expected";
          case 0:
          case 1:
            break;
        }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Gpio.GetPinModeResponse)
        return t;
      const e = new $root.PB_Gpio.GetPinModeResponse();
      switch (t.mode) {
        case "OUTPUT":
        case 0:
          e.mode = 0;
          break;
        case "INPUT":
        case 1:
          e.mode = 1;
          break;
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.mode = e.enums === String ? "OUTPUT" : 0), t.mode != null && t.hasOwnProperty("mode") && (i.mode = e.enums === String ? $root.PB_Gpio.GpioPinMode[t.mode] : t.mode), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.ReadPin = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "ReadPin"), n.prototype.pin = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.pin != null && Object.hasOwnProperty.call(t, "pin") && e.uint32(8).int32(t.pin), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gpio.ReadPin();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.pin = t.int32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.pin != null && t.hasOwnProperty("pin"))
        switch (t.pin) {
          default:
            return "pin: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
            break;
        }
      return null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Gpio.ReadPin)
        return t;
      const e = new $root.PB_Gpio.ReadPin();
      switch (t.pin) {
        case "PC0":
        case 0:
          e.pin = 0;
          break;
        case "PC1":
        case 1:
          e.pin = 1;
          break;
        case "PC3":
        case 2:
          e.pin = 2;
          break;
        case "PB2":
        case 3:
          e.pin = 3;
          break;
        case "PB3":
        case 4:
          e.pin = 4;
          break;
        case "PA4":
        case 5:
          e.pin = 5;
          break;
        case "PA6":
        case 6:
          e.pin = 6;
          break;
        case "PA7":
        case 7:
          e.pin = 7;
          break;
      }
      return e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.pin = e.enums === String ? "PC0" : 0), t.pin != null && t.hasOwnProperty("pin") && (i.pin = e.enums === String ? $root.PB_Gpio.GpioPin[t.pin] : t.pin), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.ReadPinResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "ReadPinResponse"), n.prototype.value = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.value != null && Object.hasOwnProperty.call(t, "value") && e.uint32(16).uint32(t.value), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gpio.ReadPinResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 2:
            u.value = t.uint32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.value != null && t.hasOwnProperty("value") && !$util.isInteger(t.value) ? "value: integer expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Gpio.ReadPinResponse)
        return t;
      const e = new $root.PB_Gpio.ReadPinResponse();
      return t.value != null && (e.value = t.value >>> 0), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.value = 0), t.value != null && t.hasOwnProperty("value") && (i.value = t.value), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.WritePin = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "WritePin"), n.prototype.pin = 0, n.prototype.value = 0, n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.pin != null && Object.hasOwnProperty.call(t, "pin") && e.uint32(8).int32(t.pin), t.value != null && Object.hasOwnProperty.call(t, "value") && e.uint32(16).uint32(t.value), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Gpio.WritePin();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.pin = t.int32();
            break;
          case 2:
            u.value = t.uint32();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      if (typeof t != "object" || t === null)
        return "object expected";
      if (t.pin != null && t.hasOwnProperty("pin"))
        switch (t.pin) {
          default:
            return "pin: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
            break;
        }
      return t.value != null && t.hasOwnProperty("value") && !$util.isInteger(t.value) ? "value: integer expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Gpio.WritePin)
        return t;
      const e = new $root.PB_Gpio.WritePin();
      switch (t.pin) {
        case "PC0":
        case 0:
          e.pin = 0;
          break;
        case "PC1":
        case 1:
          e.pin = 1;
          break;
        case "PC3":
        case 2:
          e.pin = 2;
          break;
        case "PB2":
        case 3:
          e.pin = 3;
          break;
        case "PB3":
        case 4:
          e.pin = 4;
          break;
        case "PA4":
        case 5:
          e.pin = 5;
          break;
        case "PA6":
        case 6:
          e.pin = 6;
          break;
        case "PA7":
        case 7:
          e.pin = 7;
          break;
      }
      return t.value != null && (e.value = t.value >>> 0), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.pin = e.enums === String ? "PC0" : 0, i.value = 0), t.pin != null && t.hasOwnProperty("pin") && (i.pin = e.enums === String ? $root.PB_Gpio.GpioPin[t.pin] : t.pin), t.value != null && t.hasOwnProperty("value") && (i.value = t.value), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s;
})();
$root.PB_Property = (() => {
  const s = {};
  return s.GetRequest = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "GetRequest"), n.prototype.key = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.key != null && Object.hasOwnProperty.call(t, "key") && e.uint32(10).string(t.key), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Property.GetRequest();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.key = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.key != null && t.hasOwnProperty("key") && !$util.isString(t.key) ? "key: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Property.GetRequest)
        return t;
      const e = new $root.PB_Property.GetRequest();
      return t.key != null && (e.key = String(t.key)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.key = ""), t.key != null && t.hasOwnProperty("key") && (i.key = t.key), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s.GetResponse = function() {
    function n(o) {
      if (o)
        for (let t = Object.keys(o), e = 0; e < t.length; ++e)
          o[t[e]] != null && (this[t[e]] = o[t[e]]);
    }
    return r(n, "GetResponse"), n.prototype.key = "", n.prototype.value = "", n.create = /* @__PURE__ */ r(function(t) {
      return new n(t);
    }, "create"), n.encode = /* @__PURE__ */ r(function(t, e) {
      return e || (e = $Writer.create()), t.key != null && Object.hasOwnProperty.call(t, "key") && e.uint32(10).string(t.key), t.value != null && Object.hasOwnProperty.call(t, "value") && e.uint32(18).string(t.value), e;
    }, "encode"), n.encodeDelimited = /* @__PURE__ */ r(function(t, e) {
      return this.encode(t, e).ldelim();
    }, "encodeDelimited"), n.decode = /* @__PURE__ */ r(function(t, e) {
      t instanceof $Reader || (t = $Reader.create(t));
      const i = e === void 0 ? t.len : t.pos + e, u = new $root.PB_Property.GetResponse();
      for (; t.pos < i; ) {
        const c = t.uint32();
        switch (c >>> 3) {
          case 1:
            u.key = t.string();
            break;
          case 2:
            u.value = t.string();
            break;
          default:
            t.skipType(c & 7);
            break;
        }
      }
      return u;
    }, "decode"), n.decodeDelimited = /* @__PURE__ */ r(function(t) {
      return t instanceof $Reader || (t = new $Reader(t)), this.decode(t, t.uint32());
    }, "decodeDelimited"), n.verify = /* @__PURE__ */ r(function(t) {
      return typeof t != "object" || t === null ? "object expected" : t.key != null && t.hasOwnProperty("key") && !$util.isString(t.key) ? "key: string expected" : t.value != null && t.hasOwnProperty("value") && !$util.isString(t.value) ? "value: string expected" : null;
    }, "verify"), n.fromObject = /* @__PURE__ */ r(function(t) {
      if (t instanceof $root.PB_Property.GetResponse)
        return t;
      const e = new $root.PB_Property.GetResponse();
      return t.key != null && (e.key = String(t.key)), t.value != null && (e.value = String(t.value)), e;
    }, "fromObject"), n.toObject = /* @__PURE__ */ r(function(t, e) {
      e || (e = {});
      const i = {};
      return e.defaults && (i.key = "", i.value = ""), t.key != null && t.hasOwnProperty("key") && (i.key = t.key), t.value != null && t.hasOwnProperty("value") && (i.value = t.value), i;
    }, "toObject"), n.prototype.toJSON = /* @__PURE__ */ r(function() {
      return this.constructor.toObject(this, minimal.util.toJSONOptions);
    }, "toJSON"), n;
  }(), s;
})();
const P = class P {
  constructor() {
    this.chunks = "";
  }
  transform(n, o) {
    this.chunks += n;
    const t = this.chunks.split(`\r
`);
    this.chunks = t.pop(), t.forEach((e) => o.enqueue(e));
  }
  flush(n) {
    n.enqueue(this.chunks);
  }
};
r(P, "LineBreakTransformer");
let LineBreakTransformer = P;
const O = class O {
  constructor() {
    this.chunks = "";
  }
  transform(n, o) {
    this.chunks += n;
    const t = this.chunks.split(">:");
    this.chunks = t.pop(), t.forEach((e) => o.enqueue(e));
  }
  flush(n) {
    n.enqueue(this.chunks);
  }
};
r(O, "PromptBreakTransformer");
let PromptBreakTransformer = O;
const S = class S {
  constructor() {
    this.chunks = new Uint8Array(0), this.decoder = new TextDecoder(), this.rpcStarted = !1;
  }
  transform(n, o) {
    const t = new Uint8Array(this.chunks.length + n.length);
    if (t.set(this.chunks), t.set(n, this.chunks.length), this.chunks = t, !this.rpcStarted && this.decoder.decode(this.chunks) === `start_rpc_session\r
`) {
      this.rpcStarted = !0, this.chunks = new Uint8Array(0);
      return;
    }
    try {
      const e = minimal.Reader.create(this.chunks), i = [];
      for (; e.pos < e.len; ) {
        const u = PB.Main.decodeDelimited(e);
        i.push(u);
      }
      this.chunks = this.chunks.slice(e.pos), i.forEach((u) => o.enqueue(u)), this.decodeInProgress = !1;
    } catch (e) {
      e.message.includes("index out of range") || this.rpcStarted || (this.chunks = new Uint8Array(0));
    }
  }
  flush(n) {
    n.enqueue(this.chunks);
  }
};
r(S, "ProtobufTransformer");
let ProtobufTransformer = S, createNanoEvents = /* @__PURE__ */ r(() => ({
  events: {},
  emit(s, ...n) {
    (this.events[s] || []).forEach((o) => o(...n));
  },
  on(s, n) {
    return (this.events[s] = this.events[s] || []).push(n), () => this.events[s] = (this.events[s] || []).filter((o) => o !== n);
  }
}), "createNanoEvents");
const RPC_TIMEOUT = 15e3;
function watch(s, n, o) {
  return {
    set: (e, i, u) => (e[i] = u, typeof u == "object" && (n && n.emit(o + "/progress", i), u.hasNext || (delete u.hasNext, s(e))), delete u.hasNext, !0)
  };
}
r(watch, "watch");
function createRPCPromise(s, n, o, t, e) {
  return new Promise((i, u) => {
    setTimeout(() => u(`RPC timeout: ${s}`), e || RPC_TIMEOUT);
    function c(f) {
      let p;
      o ? p = o(f) : f.length === 1 ? p = f[0] : p = f, i(p);
    }
    r(c, "callback");
    const [l, a] = this.encodeRPCRequest(s, n);
    a.chunks = new Proxy([], watch(c, t, s)), this.writeRaw(l);
  });
}
r(createRPCPromise, "createRPCPromise");
function info({ path: s }) {
  return createRPCPromise.bind(this)("storageInfoRequest", { path: s });
}
r(info, "info");
function timestamp({ path: s }) {
  return createRPCPromise.bind(this)("storageTimestampRequest", { path: s }, (n) => n[0].timestamp);
}
r(timestamp, "timestamp");
function stat({ path: s }) {
  return createRPCPromise.bind(this)("storageStatRequest", { path: s }, (n) => n[0].file);
}
r(stat, "stat");
function list({ path: s }) {
  function n(o) {
    const t = o.flatMap((c) => c.file);
    t.sort((c, l) => c.type < l.type ? 1 : -1);
    const e = t.findIndex((c) => c.type === 0), i = t.slice(0, e);
    i.sort((c, l) => c.name[0].toUpperCase() > l.name[0].toUpperCase() ? 1 : -1);
    const u = t.slice(e);
    return u.sort((c, l) => c.name[0].toUpperCase() > l.name[0].toUpperCase() ? 1 : -1), i.concat(u);
  }
  return r(n, "format"), createRPCPromise.bind(this)("storageListRequest", { path: s }, n);
}
r(list, "list");
function read({ path: s }) {
  function n(o) {
    let t = new Uint8Array(0);
    for (const e of o) {
      const i = new Uint8Array(t.length + e.file.data.length);
      i.set(t), i.set(e.file.data, t.length), t = i;
    }
    return t;
  }
  return r(n, "format"), createRPCPromise.bind(this)("storageReadRequest", { path: s }, n, this.emitter, 60 * 60 * 1e3);
}
r(read, "read");
async function write({ path: s, buffer: n }) {
  let o, t;
  const e = "storageWriteRequest", i = new Uint8Array(n);
  for (let u = 0; u <= i.byteLength; u += 512) {
    const c = i.slice(u, u + 512);
    await new Promise((a, f) => {
      setTimeout(() => f(`RPC timeout: ${e}`), 60 * 60 * 1e3);
      const [p, d] = this.encodeRPCRequest(
        e,
        { path: s, file: { data: c } },
        u + 512 <= i.byteLength,
        o
      );
      t || (t = d, t.chunks = [], o = t.commandId), a(this.writeRaw(p));
    }), this.emitter.emit(e + "/progress", {
      progress: Math.min(i.byteLength, u + 512 - 1),
      total: i.byteLength
    });
  }
  return !0;
}
r(write, "write");
function remove({ path: s, recursive: n }) {
  return createRPCPromise.bind(this)("storageDeleteRequest", { path: s, recursive: n });
}
r(remove, "remove");
function mkdir({ path: s }) {
  return createRPCPromise.bind(this)("storageMkdirRequest", { path: s });
}
r(mkdir, "mkdir");
function md5sum({ path: s }) {
  return createRPCPromise.bind(this)("storageMd5sumRequest", { path: s }, (n) => n[0].md5sum);
}
r(md5sum, "md5sum");
function rename({ oldPath: s, newPath: n }) {
  return createRPCPromise.bind(this)("storageRenameRequest", { oldPath: s, newPath: n });
}
r(rename, "rename");
function backupCreate({ archivePath: s }) {
  return createRPCPromise.bind(this)("storageBackupCreateRequest", { archivePath: s });
}
r(backupCreate, "backupCreate");
function backupRestore({ archivePath: s }) {
  return createRPCPromise.bind(this)("storageBackupRestoreRequest", { archivePath: s });
}
r(backupRestore, "backupRestore");
const storage = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  backupCreate,
  backupRestore,
  info,
  list,
  md5sum,
  mkdir,
  read,
  remove,
  rename,
  stat,
  timestamp,
  write
}, Symbol.toStringTag, { value: "Module" }));
function ping() {
  return createRPCPromise.bind(this)("systemPingRequest");
}
r(ping, "ping");
async function reboot({ mode: s = "OS" }) {
  const n = {
    OS: 0,
    DFU: 1,
    UPDATE: 2
  }, [o] = this.encodeRPCRequest("systemRebootRequest", { mode: n[s] });
  return this.writeRaw(o);
}
r(reboot, "reboot");
function deviceInfo() {
  function s(n) {
    const o = {};
    for (const t of n)
      o[t.key] = t.value;
    return o;
  }
  return r(s, "format"), createRPCPromise.bind(this)("systemDeviceInfoRequest", {}, s);
}
r(deviceInfo, "deviceInfo");
async function factoryReset() {
  //! This erases ALL USER DATA, use at your own risk!
  const [s] = this.encodeRPCRequest("systemFactoryResetRequest");
  return this.writeRaw(s);
}
r(factoryReset, "factoryReset");
function getDatetime() {
  function s(n) {
    let o = {};
    for (const t of n)
      o = { ...o, ...t.datetime };
    return new Date(o.year, o.month - 1, o.day, o.hour, o.minute, o.second);
  }
  return r(s, "format"), createRPCPromise.bind(this)("systemGetDatetimeRequest", {}, s);
}
r(getDatetime, "getDatetime");
function setDatetime({ date: s }) {
  const n = {
    hour: s.getHours(),
    minute: s.getMinutes(),
    second: s.getSeconds(),
    day: s.getDate(),
    month: s.getMonth() + 1,
    year: s.getFullYear(),
    weekday: s.getDay() || 7
  };
  return createRPCPromise.bind(this)("systemSetDatetimeRequest", { datetime: n });
}
r(setDatetime, "setDatetime");
function playAudiovisualAlert() {
  return createRPCPromise.bind(this)("systemPlayAudiovisualAlertRequest");
}
r(playAudiovisualAlert, "playAudiovisualAlert");
function protobufVersion() {
  return createRPCPromise.bind(this)("systemProtobufVersionRequest", {});
}
r(protobufVersion, "protobufVersion");
function update({ path: s }) {
  const n = {
    OK: 0,
    ManifestPathInvalid: 1,
    ManifestFolderNotFound: 2,
    ManifestInvalid: 3,
    StageMissing: 4,
    StageIntegrityError: 5,
    ManifestPointerError: 6,
    TargetMismatch: 7,
    OutdatedManifestVersion: 8,
    IntFull: 9,
    UnspecifiedError: 10
  };
  return createRPCPromise.bind(this)("systemUpdateRequest", { updateManifest: s }, (o) => Object.keys(n).find((t) => n[t] === o[0].code));
}
r(update, "update");
function powerInfo() {
  function s(n) {
    const o = {};
    for (const t of n)
      o[t.key] = t.value;
    return o;
  }
  return r(s, "format"), createRPCPromise.bind(this)("systemPowerInfoRequest", {}, s);
}
r(powerInfo, "powerInfo");
const system = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  deviceInfo,
  factoryReset,
  getDatetime,
  ping,
  playAudiovisualAlert,
  powerInfo,
  protobufVersion,
  reboot,
  setDatetime,
  update
}, Symbol.toStringTag, { value: "Module" }));
function start({ name: s, args: n }) {
  return createRPCPromise.bind(this)("applicationStartRequest", { name: s, args: n });
}
r(start, "start");
function lockStatus() {
  return createRPCPromise.bind(this)("applicationLockStatusRequest", {}, (s) => s[0].locked);
}
r(lockStatus, "lockStatus");
function appExit() {
  return createRPCPromise.bind(this)("applicationAppExitRequest");
}
r(appExit, "appExit");
function appLoadFile({ path: s }) {
  return createRPCPromise.bind(this)("applicationAppLoadFileRequest", { path: s });
}
r(appLoadFile, "appLoadFile");
function appButtonPress({ args: s }) {
  return createRPCPromise.bind(this)("applicationAppButtonPressRequest", { args: s });
}
r(appButtonPress, "appButtonPress");
function appButtonRelease() {
  return createRPCPromise.bind(this)("applicationAppButtonReleaseRequest");
}
r(appButtonRelease, "appButtonRelease");
function getErrorRequest() {
  return createRPCPromise.bind(this)("applicationGetErrorRequest");
}
r(getErrorRequest, "getErrorRequest");
const application = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  appButtonPress,
  appButtonRelease,
  appExit,
  appLoadFile,
  getErrorRequest,
  lockStatus,
  start
}, Symbol.toStringTag, { value: "Module" })), inputKeys = {
  UP: 0,
  DOWN: 1,
  RIGHT: 2,
  LEFT: 3,
  OK: 4,
  BACK: 5
}, inputTypes = {
  PRESS: 0,
  // < Press event, emitted after debounce
  RELEASE: 1,
  // < Release event, emitted after debounce
  SHORT: 2,
  // < Short event, emitted after InputTypeRelease done withing INPUT_LONG_PRESS interval
  LONG: 3,
  // < Long event, emmited after INPUT_LONG_PRESS interval, asynchronouse to InputTypeRelease
  REPEAT: 4
  // < Repeat event, emmited with INPUT_REPEATE_PRESS period after InputTypeLong event
}, screenOrientations = {
  HORIZONTAL: 0,
  // < Horizontal
  HORIZONTAL_FLIP: 1,
  // < Horizontal flipped (180)
  VERTICAL: 2,
  // < Vertical (90)
  VERTICAL_FLIP: 3
  // < Vertical flipped
};
function screenFrame({ data: s, orientation: n = "HORIZONTAL" }) {
  const [o] = this.encodeRPCRequest("guiScreenFrame", { data: s, orientation: screenOrientations[n] });
  this.writeRaw(o);
}
r(screenFrame, "screenFrame");
function startScreenStream() {
  return createRPCPromise.bind(this)("guiStartScreenStreamRequest");
}
r(startScreenStream, "startScreenStream");
function stopScreenStream() {
  return createRPCPromise.bind(this)("guiStopScreenStreamRequest");
}
r(stopScreenStream, "stopScreenStream");
function sendInputEvent({ key: s, type: n }) {
  return createRPCPromise.bind(this)("guiSendInputEventRequest", { key: inputKeys[s], type: inputTypes[n] });
}
r(sendInputEvent, "sendInputEvent");
function startVirtualDisplay(s) {
  const n = {};
  if (s) {
    const [o] = this.encodeRPCRequest(
      "guiScreenFrame",
      { data: s.data, orientation: screenOrientations[s.orientation] },
      !1,
      0
    );
    n[s] = o;
  }
  return createRPCPromise.bind(this)("guiStartVirtualDisplayRequest", n);
}
r(startVirtualDisplay, "startVirtualDisplay");
function stopVirtualDisplay() {
  return this.emitter.emit("screenStream/stop"), createRPCPromise.bind(this)("guiStopVirtualDisplayRequest");
}
r(stopVirtualDisplay, "stopVirtualDisplay");
const gui = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  screenFrame,
  sendInputEvent,
  startScreenStream,
  startVirtualDisplay,
  stopScreenStream,
  stopVirtualDisplay
}, Symbol.toStringTag, { value: "Module" })), gpioPins = {
  PC0: 0,
  PC1: 1,
  PC3: 2,
  PB2: 3,
  PB3: 4,
  PA4: 5,
  PA6: 6,
  PA7: 7
}, gpioPinModes = {
  OUTPUT: 0,
  INPUT: 1
}, gpioInputPulls = {
  NO: 0,
  UP: 1,
  DOWN: 2
};
function setPin({ pin: s, mode: n }) {
  return createRPCPromise.bind(this)("gpioUpdateRequest", { pin: gpioPins[s], mode: gpioPinModes[n] });
}
r(setPin, "setPin");
function setInputPull({ pin: s, pullMode: n }) {
  return createRPCPromise.bind(this)("gpioSetInputPullRequest", { pin: gpioPins[s], pullMode: gpioInputPulls[n] });
}
r(setInputPull, "setInputPull");
function getPinMode({ pin: s }) {
  return createRPCPromise.bind(this)("gpioGetPinModeRequest", { pin: gpioPins[s] });
}
r(getPinMode, "getPinMode");
function readPin({ pin: s }) {
  return createRPCPromise.bind(this)("gpioReadPinRequest", { pin: gpioPins[s] });
}
r(readPin, "readPin");
function writePin({ pin: s, value: n }) {
  return createRPCPromise.bind(this)("gpioWritePinRequest", { pin: gpioPins[s], value: n });
}
r(writePin, "writePin");
const gpio = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getPinMode,
  readPin,
  setInputPull,
  setPin,
  writePin
}, Symbol.toStringTag, { value: "Module" }));
function isObject(s) {
  return s && typeof s == "object" && !Array.isArray(s);
}
r(isObject, "isObject");
function mergeDeep(s, ...n) {
  if (!n.length)
    return s;
  const o = n.shift();
  if (isObject(s) && isObject(o))
    for (const t in o)
      isObject(o[t]) ? (s[t] || Object.assign(s, { [t]: {} }), mergeDeep(s[t], o[t])) : Object.assign(s, { [t]: o[t] });
  return mergeDeep(s, ...n);
}
r(mergeDeep, "mergeDeep");
function expand(s, n = {}) {
  return s.split(".").reduceRight((o, t) => ({
    [t]: o
  }), n);
}
r(expand, "expand");
function get({ key: s }) {
  function n(o) {
    const t = {};
    let e = {};
    for (const i of o)
      i.key && (t[i.key] = i.value);
    for (const i of Object.keys(t)) {
      const u = expand(i, t[i]);
      e = mergeDeep(e, u);
    }
    return e;
  }
  return r(n, "format"), createRPCPromise.bind(this)("propertyGetRequest", { key: s }, n);
}
r(get, "get");
const property = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get
}, Symbol.toStringTag, { value: "Module" })), RPCSubSystems = {
  storage,
  system,
  application,
  gui,
  gpio,
  property
}, m = class m {
  constructor({
    filters: n = [{ usbVendorId: 1155, usbProductId: 22336 }]
  } = {}) {
    this.filters = n, this.serialWorker = new Worker(new URL("" + new URL("assets/serialWorker-34f93f49.js", import.meta.url).href, self.location)), this.serialWorker.onmessage = (o) => {
      switch (o.data.message) {
        case "connectionStatus":
          o.data.error ? this.emitter.emit(o.data.operation + "Status", o.data.error) : o.data.status && this.emitter.emit(o.data.operation + "Status", o.data.status);
          break;
        case "getReadableStream":
          this.readable = o.data.stream, this.getReader();
          break;
        case "getWritableStream":
          this.writable = o.data.stream, this.getWriter();
          break;
      }
    }, this.readable = null, this.reader = null, this.readingMode = {
      type: "text",
      transform: "promptBreak"
    }, this.writable = null, this.writer = null, this.commandQueue = [
      {
        commandId: 0,
        requestType: "unsolicited",
        chunks: [],
        error: void 0
      }
    ], this.emitter = createNanoEvents();
  }
  getReader() {
    if (this.readingMode.type === "text") {
      const n = new TextDecoderStream();
      if (this.readableStreamClosed = this.readable.pipeTo(n.writable), this.readingMode.transform.length) {
        let o;
        switch (this.readingMode.transform) {
          case "lineBreak":
            o = new LineBreakTransformer();
            break;
          case "promptBreak":
            o = new PromptBreakTransformer();
            break;
          default:
            throw new Error("Invalid reading mode");
        }
        this.reader = n.readable.pipeThrough(new TransformStream(o)).getReader();
      } else
        this.reader = n.readable.getReader();
    } else if (this.readingMode.type === "raw")
      if (this.readingMode.transform.length) {
        let n;
        switch (this.readingMode.transform) {
          case "protobuf":
            n = new ProtobufTransformer();
            break;
          default:
            throw new Error("Invalid reading mode");
        }
        this.reader = this.readable.pipeThrough(new TransformStream(n)).getReader();
      } else
        this.reader = this.readable.getReader();
    else
      throw new Error("Invalid reading mode");
    this.read();
  }
  async setReadingMode(n, o = "") {
    n && (this.readingMode.type = n, this.readingMode.transform = o, this.reader.cancel(), this.readableStreamClosed && await this.readableStreamClosed.catch(() => {
    }), await this.writer.close(), await this.writer.releaseLock(), setTimeout(() => this.serialWorker.postMessage({ message: "reopenPort" }), 1));
  }
  getWriter() {
    this.writer = this.writable.getWriter();
  }
  async connect() {
    if ((await navigator.serial.getPorts({ filters: this.filters })).length === 0)
      throw new Error("No known ports");
    return new Promise((o, t) => {
      this.serialWorker.postMessage({ message: "connect" }), setTimeout(() => t("Serial connection timeout"), RPC_TIMEOUT);
      const e = this.emitter.on("connectStatus", (i) => {
        e(), i === "success" ? o(!0) : t(i);
      });
    });
  }
  async disconnect() {
    return this.reader.cancel(), this.readableStreamClosed && await this.readableStreamClosed.catch(() => {
    }), await this.writer.close(), await this.writer.releaseLock(), setTimeout(() => this.serialWorker.postMessage({ message: "disconnect" }), 1), new Promise((n, o) => {
      setTimeout(() => o("Serial disconnection timeout"), RPC_TIMEOUT);
      const t = this.emitter.on("disconnectStatus", (e) => {
        t(), e === "success" ? (this.readingMode = {
          type: "text",
          transform: "promptBreak"
        }, n(!0)) : o(e);
      });
    });
  }
  async read() {
    let n = !0;
    for (; n; )
      try {
        const { value: o, done: t } = await this.reader.read();
        if (t) {
          this.reader.releaseLock();
          break;
        }
        if (this.readingMode.transform === "protobuf") {
          o.content && o.content === "guiScreenFrame" && this.emitter.emit("screenStream/frame", o.guiScreenFrame.data, o.guiScreenFrame.orientation);
          const e = this.commandQueue.find((i) => i.commandId === o.commandId);
          o[o.content].hasNext = o.hasNext, e.chunks.push(o[o.content]);
        } else
          this.emitter.emit("cli/output", o);
      } catch (o) {
        o.toString().includes("device has been lost") || console.error(o), n = !1;
      }
  }
  write(n) {
    const t = new TextEncoder().encode(n);
    return this.writer.write(t);
  }
  writeRaw(n) {
    return this.writer.write(n);
  }
  async startRPCSession() {
    return await this.setReadingMode("raw", "protobuf"), await new Promise((o, t) => {
      setTimeout(() => {
        this.write("start_rpc_session\r"), o();
      }, 300);
    }), new Promise((o, t) => {
      this.RPC("systemPing").then(() => {
        o();
      }).catch((e) => {
        t(e);
      });
    });
  }
  encodeRPCRequest(n, o, t, e) {
    let i;
    const u = { hasNext: t };
    if (u[n] = o || {}, e ? (u.commandId = e, i = this.commandQueue.find((a) => a.commandId === u.commandId)) : u.commandId = this.commandQueue.length, !i) {
      const a = this.commandQueue.push({
        commandId: u.commandId,
        requestType: n,
        args: t ? [o] : o
      });
      i = this.commandQueue[a - 1];
    }
    const c = PB.Main.create(u);
    return [new Uint8Array(PB.Main.encodeDelimited(c).finish()), i];
  }
  RPC(n, o) {
    const [t, e] = splitRequestType(n);
    return RPCSubSystems[t][e].bind(this)(o);
  }
};
r(m, "Flipper");
let Flipper = m;
function splitRequestType(s) {
  const n = s.search(/[A-Z]/g), o = s.slice(n);
  return [s.slice(0, n), o[0].toLowerCase() + o.slice(1)];
}
r(splitRequestType, "splitRequestType");
export {
  Flipper as default
};
