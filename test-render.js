const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('public/html-sections/services.html', 'utf8');

const dom = new JSDOM(html, { 
    runScripts: "dangerously", 
    resources: "usable" 
});

dom.window.BarberSaaS = {
    init: () => {},
    getPublicData: () => Promise.resolve({
        services: [ { id: "1", name: "test", price: 10, duration: 30 } ]
    })
};

setTimeout(() => {
    console.log("Spinner style:", dom.window.document.getElementById("loading-spinner").style.display);
    console.log("Content style:", dom.window.document.getElementById("page-content").style.display);
    console.log("Spinner HTML:", dom.window.document.getElementById("loading-spinner").innerHTML);
}, 2000);
