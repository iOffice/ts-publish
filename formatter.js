"use strict";
var colors = require("colors");
var _ = require("lodash");
function align(msg, alignment, size) {
    if (alignment === 'l') {
        return msg + _.repeat(' ', size - msg.length);
    }
    return _.repeat(' ', size - msg.length) + msg;
}
function breakMsg(msg, size) {
    var result = [];
    var words = msg.split(' ');
    var line = [];
    var length = 0;
    _.each(words, function (word) {
        if (length + word.length <= size) {
            line.push(word);
            length += word.length + 1;
        }
        else {
            result.push(line.join(' '));
            line.splice(0);
            line.push(word);
            length = word.length + 1;
        }
    });
    result.push(line.join(' ').trim());
    return result;
}
function _formatResults(buf, messages) {
    var colSizes = [0, 0, 0, 0];
    _.each(messages, function (msg) {
        _.each(msg, function (item, index) {
            if (item.length > colSizes[index]) {
                colSizes[index] = Math.min(item.length, 80);
            }
        });
    });
    var colorMap = {
        error: colors.red,
        warning: colors.yellow,
        info: colors.blue,
        log: colors.cyan,
        debug: colors.gray
    };
    _.each(messages, function (msg) {
        var main = breakMsg(msg[3], colSizes[3]);
        buf.push('  ');
        buf.push(colorMap[msg[0]](align(msg[1], 'r', colSizes[1])));
        buf.push(':');
        buf.push(colorMap[msg[0]](align(msg[2], 'l', colSizes[2])));
        buf.push('  ');
        if (main.length > 1) {
            buf.push(align(main[0], 'l', colSizes[3]));
        }
        else {
            buf.push(colors.underline(align(main[0], 'l', colSizes[3])));
        }
        buf.push('  ');
        buf.push(colorMap[msg[0]](align(msg[4], 'l', colSizes[4])).dim);
        buf.push('\n');
        if (main.length > 1) {
            var indent_1 = _.repeat(' ', 5 + colSizes[1] + colSizes[2]);
            _.each(main.slice(1), function (line, index) {
                var lineMsg = align(line, 'l', colSizes[3]);
                if (index === main.length - 2) {
                    buf.push("" + indent_1 + lineMsg.underline);
                }
                else {
                    buf.push("" + indent_1 + lineMsg);
                }
                buf.push('\n');
            });
        }
    });
}
function formatResults(results) {
    var buffer = [];
    var fileNames = _.keys(results).sort();
    _.each(fileNames, function (fileName) {
        var obj = results[fileName];
        var numMessages = obj.messages.length;
        if (!numMessages) {
            return;
        }
        var foundMessageWord = "MESSAGE" + (numMessages === 1 ? '' : 'S');
        var messageInfo = numMessages + " " + foundMessageWord;
        buffer.push("\n" + messageInfo.magenta + " in " + fileName.underline.magenta + ":\n");
        buffer.push('\n');
        var messages = [];
        _.each(obj.messages, function (msg) {
            messages.push([
                msg.category,
                msg.line.toString(),
                msg.character.toString(),
                msg.message,
                msg.type,
            ]);
        });
        _formatResults(buffer, messages);
    });
    return buffer.join('');
}
exports.formatResults = formatResults;
