if (!chrome.cookies) {
    chrome.cookies = chrome.experimental.cookies;
}

//比较cookies
function cookieMatch(c1, c2) {
    return (c1.name == c2.name) && (c1.domain == c2.domain) &&
        (c1.hostOnly == c2.hostOnly) && (c1.path == c2.path) &&
        (c1.secure == c2.secure) && (c1.httpOnly == c2.httpOnly) &&
        (c1.session == c2.session) && (c1.storeId == c2.storeId);
}

//对keys排序 
function sortedKeys(array) {
    var keys = [];
    for (var i in array) {
        keys.push(i);
    }
    keys.sort();
    return keys;
}


//存储所有cookies的对象
function CookieCache() {
    this.cookies_ = {};

    this.reset = function () {
        this.cookies_ = {};
    }

    //加cookies
    this.add = function (cookie) {
        var domain = cookie.domain;
        if (!this.cookies_[domain]) {
            this.cookies_[domain] = [];
        }
        this.cookies_[domain].push(cookie);
    };

    //删cookies
    this.remove = function (cookie) {
        var domain = cookie.domain;
        if (this.cookies_[domain]) {
            var i = 0;
            while (i < this.cookies_[domain].length) {
                if (cookieMatch(this.cookies_[domain][i], cookie)) {
                    this.cookies_[domain].splice(i, 1);
                } else {
                    i++;
                }
            }
            if (this.cookies_[domain].length == 0) {
                delete this.cookies_[domain];
            }
        }
    };

    //根据过滤内容过滤域名
    this.getDomains = function (filter) {
        var result = [];
        sortedKeys(this.cookies_).forEach(function (domain) {
            if (!filter || domain.indexOf(filter) != -1) {
                result.push(domain);
            }
        });
        return result;
    }

    this.getCookies = function (domain) {
        return this.cookies_[domain];
    };
}

//定义一个存储cookies对象
var cache = new CookieCache();

//删除一个cookies
function deleteCookie(cookies) {
    var url = cookies.getAttribute("src");
    var name = cookies.getAttribute("name");
    $(cookies).closest('li').fadeOut(500, function () {
        chrome.cookies.remove({
            "url": url,
            "name": name
        });
    });
}

//保存一个cookies
function saveCookie(saveBtn) {
    var tr = $(saveBtn).parent().parent();
    var li = $(saveBtn).closest('li');

    var cookieName = li.find('.cookie-name').text();
    var cookieValue = tr.find('.cookie-value').val();
    var cookieDomain = tr.find('.cookie-domain').val();
    var cookieSecure = tr.find('.cookie-secure').val();
    var cookiePath = tr.find('.cookie-path').val();
    var cookieExpire = tr.find('.cookie-expires').val();

    var cookie = {};
    cookie.name = $.trim(cookieName);
    cookie.value = $.trim(cookieValue);
    cookie.domain = $.trim(cookieDomain);
    cookie.secure = $.trim(cookieSecure) == 'true' ? true : false;
    cookie.path = $.trim(cookiePath);
    cookie.url = (cookie.secure ? "https" : "http") + "://" + cookie.domain + cookie.path;
    cookie.expirationDate = new Date($.trim(cookieExpire)).getTime() / 1000;;

    chrome.cookies.set(cookie);
}

//删除全部域名的cookies
function removeAll() {
    if ($("div#datagroup").children("div.data").length == 0) {
        $(".remove-all").attr('disabled',true);
        return;
    }

    var all_cookies = [];
    cache.getDomains().forEach(function (domain) {
        cache.getCookies(domain).forEach(function (cookie) {
            all_cookies.push(cookie);
        });
    });
    cache.reset();
    var count = all_cookies.length;
    for (var i = 0; i < count; i++) {
        removeCookie(all_cookies[i]);
    }
    chrome.cookies.getAll({}, function (cookies) {
        for (var i in cookies) {
            cache.add(cookies[i]);
            removeCookie(cookies[i]);
        }
    });
}

function removeCookie(cookie) {
    var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
        cookie.path;
    chrome.cookies.remove({
        "url": url,
        "name": cookie.name
    });
}

//删除指定domain的cookies
function removeCookiesForDomain(domain) {
    cache.getCookies(domain).forEach(function (cookie) {
        removeCookie(cookie);
    });
}

//清空表格
function resetTable() {
    $("#datagroup").empty();
}

var reload_scheduled = false;

function scheduleReloadCookieTable() {
    if (!reload_scheduled) {
        reload_scheduled = true;
        setTimeout(reloadCookieTable, 250);
    }
}

//重绘cookie list
function reloadCookieTable() {
    reload_scheduled = false;
    var filter = $("#filter").val();
    var domains = cache.getDomains(filter);
    resetTable();
    var tables = "";

    domains.forEach(function (domain, i) {
        var cookies = cache.getCookies(domain);
        var cookieJson = {}, cookiesg = [];
        cookieJson.name = domain;
        cookieJson.cookiearr = cookies;
        cookieJson.num = cookies.length;

        tables += "<div class='data'>" +
            "<table>" +
            "	<tr>" +
            "		<td class='cookie-table-td1'>" +
            "			<div class='domain'><a href='#nolink' class='show'></a><span>" + cookieJson.name + "</span></div>" +
            "		</td>" +
            "		<td class='cookie-table-td2'>" +
            "			<div class='qt'>" + cookies.length + "</div>" +
            "		</td>" +
            "		<td class='cookie-table-td3'>" +
            "			<div class='oper'>" +
            "				<button class='btn delall' name='" + cookieJson.name + "'>删除</button>" +
            "			</div>" +
            "		</td>" +
            "	</tr>" +
            "	<tr class='detail-row'>" +
            "		<td colspan='3'>" +
            "			<ul>";

        var li = "";
        for (var i = 0; i < cookies.length; i++) {
            li += "<li class='thide'>" +
                "	<a href='#' class='lititle'></a>" +
                "	<span class='cookie-name'>" + cookies[i].name + "</span>" +
                "   <div class='separator'></div>" +
                "	<table class='cookie-table-wrapper'>" +
                "		<tr>" +
                "			<td>" +
                "				<div class='cookie-table'>" +
                "					<div class='cookie-row'>" +
                "						<label>值</label>" +
                "						<textarea rows='5' type='textarea' class='cookie-value' spellcheck='false'>" + cookies[i].value + "</textarea>" +
                "					</div>" +
                "					<div class='cookie-row'>" +
                "						<label>域名</label>" +
                "						<input type='text' class='cookie-domain' value='" + cookies[i].domain + "'>" +
                "						<input type='hidden' class='cookie-secure' value='" + cookies[i].secure + "'>" +
                "                   </div>" +
                "					<div class='cookie-row'>" +
                "						<label>路径</label>" +
                "						<input type='text' class='cookie-path' value='" + cookies[i].path + "'>" +
                "					</div>" +
                "					<div class='cookie-row'>" +
                "						<label>过期时间</label>" +
                "						<input type='text' class='cookie-expires' value='" + dateFormat(cookies[i].expirationDate ? new Date(cookies[i].expirationDate * 1000) : '') + "'>" +
                "					</div>" +
                "				</div>" +
                "			</td>" +
                "			<td class='cookie-save-td'>" +
                "				<button class='icon-btn save icon-checkmark' title='保存'></button>" +
                "				<button class='icon-btn del icon-bin' src='http" + (cookies[i].secure ? "s" : "") + "://" + cookies[i].domain + cookies[i].path + "' name='" + cookies[i].name + "'" + " title='删除'></button>" +
                "			</td>" +
                "		</tr>" +
                "	</table>" +
                "</li>";
        }

        tables = tables + li +
            "			</ul>" +
            "		</td>" +
            "	</tr>" +
            "</table>" +
            "</div>";
    });

    $("#datagroup").html(tables);

    $(".show").click(function (event) {
        event.stopPropagation();
        $(this).parent().parent().toggleClass('showul');
        //$(this).parent().parent().siblings().removeClass('showul');
        $(this).parent().parent().parent().next('.detail-row').toggleClass('open');
        return false;
    })

    $(".lititle").click(function (event) {
        event.stopPropagation();
        $(this).parent().toggleClass('tshow');
        $(this).parent().find('.separator').toggle();
        //$(this).parent().siblings().removeClass('tshow');
        $(this).parent().find('table').toggleClass('tshow');
        $(this).parent().siblings().find('.separator').hide();
        $(this).parent().siblings().removeClass('tshow').find('table').removeClass('tshow');
        return false;
    })

    $(".del").click(function () {
        deleteCookie(this);
    })

    $(".save").click(function () {
        saveCookie(this);
    })

    $(".delall").click(function () {
        removeCookiesForDomain(this.getAttribute("name"));
    })
}

// 时间格式化
function dateFormat(date) {
    if (date == null || date == '') {
        return '';
    }

    var month = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1);
    var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    var hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    var minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    var second = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();

    return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

//聚焦过滤框
function focusFilter() {
    $("#filter").focus();
}

//重置过滤框
function resetFilter() {
    var filter = $("#filter");
    filter.focus();
    if (filter.val().length > 0) {
        filter.val('');
        reloadCookieTable();
    }
}

//cookies变化动作
function listener(info) {
    cache.remove(info.cookie);
    if (!info.removed) {
        cache.add(info.cookie);
    }
    scheduleReloadCookieTable();
}

//监听cookies变化
function startListening() {
    chrome.cookies.onChanged.addListener(listener);
}

function stopListening() {
    chrome.cookies.onChanged.removeListener(listener);
}

//绑定事件
function addallevent() {
    $('#filter').bind("keyup", reloadCookieTable);
    $('#remove_button').bind("click", removeAll);
}

//初始化渲染
function onload() {
    focusFilter();
    chrome.cookies.getAll({}, function (cookies) {
        startListening();
        for (var i in cookies) {
            cache.add(cookies[i]);
        }
        reloadCookieTable();
    });
    addallevent();

    reloadCookieTable();
}

onload();