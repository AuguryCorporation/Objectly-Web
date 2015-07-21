function identifyBrowser(userAgent, elements) {
    var regexps = {
            'Chrome': [ /Chrome\/(\S+)/ ],
            'Firefox': [ /Firefox\/(\S+)/ ],
            'MSIE': [ /MSIE (\S+);/ ],
            'Opera': [
                /Opera\/.*?Version\/(\S+)/,     /* Opera 10 */
                /Opera\/(\S+)/                  /* Opera 9 and older */
            ],
            'Safari': [ /Version\/(\S+).*?Safari\// ],
            'Silk': [ /Silk\/(\S+)/ ]
        },
        re, m, browser, version;
 
    if (userAgent === undefined) { userAgent = navigator.userAgent; }
 
    if (elements === undefined) { elements = 2; }
    else if (elements === 0)  { elements = 1337; }
 
    for (browser in regexps) {
        while (re = regexps[browser].shift()) {
            if (m = userAgent.match(re)) {
                version = (m[1].match(new RegExp('[^.]+(?:\.[^.]+){0,' + --elements + '}')))[0];
                return {n:browser,v:version};
            }
        }
    }
 
    return null;
}
