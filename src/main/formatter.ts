import { TypedObject, IFileMessages, ITSMessage } from './interfaces';
import * as colors from 'colors';
import * as _ from 'lodash';

function align(msg: string, alignment: 'l' | 'r', size: number): string {
  if (alignment === 'l') {
    return msg + _.repeat(' ', size - msg.length);
  }

  return  _.repeat(' ', size - msg.length) + msg;
}

function breakMsg(msg: string, size: number): string[] {
  const result: string[] = [];
  const words: string[] = msg.split(' ');
  const line: string[] = [];
  let length: number = 0;
  _.each(words, (word) => {
    if (length + word.length <= size) {
      line.push(word);
      length += word.length + 1;
    } else {
      result.push(line.join(' '));
      line.splice(0);
      line.push(word);
      length = word.length + 1;
    }
  });
  result.push(line.join(' ').trim());
  return result;
}

function _formatResults(buf: string[], messages: string[][]): void {
  const colSizes: number[] = [0, 0, 0, 0];
  _.each(messages, (msg) => {
    _.each(msg, (item, index) => {
      if (item.length > colSizes[index]) {
        colSizes[index] = Math.min(item.length, 80);
      }
    });
  });

  const colorMap: { [key: string]: Function } = {
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue,
    log: colors.cyan,
    debug: colors.gray,
  };

  _.each(messages, (msg) => {
    const main: string[] = breakMsg(msg[3], colSizes[3]);
    buf.push('  ');
    buf.push(colorMap[msg[0]](align(msg[1], 'r', colSizes[1])));
    buf.push(':');
    buf.push(colorMap[msg[0]](align(msg[2], 'l', colSizes[2])));
    buf.push('  ');
    if (main.length > 1) {
      buf.push(align(main[0], 'l', colSizes[3]));
    } else {
      buf.push(colors.underline(align(main[0], 'l', colSizes[3])));
    }
    buf.push('  ');
    buf.push(colorMap[msg[0]](align(msg[4], 'l', colSizes[4])).dim);
    buf.push('\n');
    if (main.length > 1) {
      const indent: string = _.repeat(' ', 5 + colSizes[1] + colSizes[2]);
      _.each(main.slice(1), (line, index) => {
        const lineMsg: string = align(line, 'l', colSizes[3]);
        if (index === main.length - 2) {
          buf.push(`${indent}${lineMsg.underline}`);
        } else {
          buf.push(`${indent}${lineMsg}`);
        }
        buf.push('\n');
      });
    }
  });
}

function formatResults(results: TypedObject<IFileMessages>): string {
  const buffer: string[] = [];
  const fileNames: string[] = _.keys(results).sort();
  _.each(fileNames, fileName => {
    const obj: IFileMessages = results[fileName];
    const numMessages: number = obj.messages.length;
    if (!numMessages) {
      return;
    }

    const foundMessageWord: string = `MESSAGE${numMessages === 1 ? '' : 'S'}`;
    const messageInfo: string = `${numMessages} ${foundMessageWord}`;
    buffer.push(`\n${messageInfo.magenta} in ${fileName.underline.magenta}:\n`);
    buffer.push('\n');

    const messages: string[][] = [];
    _.each(obj.messages, (msg: ITSMessage) => {
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

export {
  formatResults,
}
