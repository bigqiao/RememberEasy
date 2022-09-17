var http = require('http');
var url = require('url');
var path = require('path');
const fs = require('fs');
var mime = require('mime');
const express = require('express');
const expressWs = require('express-ws');
const cookieParser = require('cookie-parser');
const { LocalStorage } = require('node-localstorage');
let examResult = new LocalStorage('../storage/examResult');

const db = require('better-sqlite3')('ecdict.db', { readonly: true });

const app = express();
app.use(cookieParser('RememberEasy'));

expressWs(app);
//////////////////////////////////////////////////////////////////////////////////////////////////
let ketData = [];

//array,placeholder,placeholder,placeholder
function shuffle(a, b, c, d) {
    c = a.length;
    while (c) (b = (Math.random() * (--c + 1)) | 0), (d = a[c]), (a[c] = a[b]), (a[b] = d);
}

function loaddata() {
    var stmt = db.prepare('select translation from stardict where word=?');

    const data = fs.readFileSync('test.data').toString();
    const lines = data.split('\r\n');
    let lastword = {};
    for (let i = 0; i < lines.length; ++i) {
        if (lines[i].startsWith('--- ')) {
            lastword.sample.push(lines[i].substring(4));
        } else {
            let word = lines[i].replace(/\s+\(.+\)\s*/, '');
            var res = stmt.all(word);
            if (res) {
                lastword = { word: word, sample: [], translation: res.map((item) => item.translation).join('\n') };
                ketData.push(lastword);
            } else {
                console.log(word);
            }
        }
    }
    shuffle(ketData);
}

loaddata();
////////////////////////////////////////////////////////////////////////////////////////////

var options = {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['htm', 'html', 'css', 'js', 'png', 'webp'],
    maxAge: '0s',
    index: false,
    redirect: false,
    setHeaders: function (res, path, stat) {
        res.set('Cache-Control', 'no-store');
    },
};

app.use('/static', express.static('static', options));

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/exam.html'));
});

app.get('/getExam/:count', (req, res) => {
    shuffle(ketData);
    let exam = ketData.slice(0, parseInt(req.params.count));
    res.send(JSON.stringify(exam));
});

app.post('/postResult', (req, res) => {
    console.log(req.body);
    let id = `${Date.now()}`;
    examResult[id] = JSON.stringify(req.body);
    res.send({ resultId: id });
});

app.get('/getResult/:id', (req, res) => {
    res.send(examResult[req.params.id]);
});

//console.log(ketData);

const port = 4000;
app.listen(port, () => {
    console.log(`express server listen at http://localhost:${port}`);
});
