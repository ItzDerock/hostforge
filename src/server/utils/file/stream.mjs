/* eslint-disable */
//@ts-nocheck

// the following code is copied from https://github.com/platformatic/tail-file-stream/blob/main/index.js
// Had issues with imports when using their package.
// License: MIT

/*
Copyright Platformatic. All rights reserved.
Copyright Node.js contributors. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/

"use strict";

import { Readable, finished } from "node:stream";
import fs from "node:fs";

const ioDone = Symbol("ioDone");

class TailFileStream extends Readable {
  #watching = false;
  #waiting = false;
  #performingIO = false;

  #start;
  #end;
  #pos;
  #flags;
  #mode;
  #fd;

  #autoWatch;
  #persistent;

  constructor(path, options = {}) {
    if (options.highWaterMark === undefined) {
      options.highWaterMark = 64 * 1024;
    }

    super(options);

    this.path = path;
    this.#flags = options.flags ?? "r";
    this.#mode = options.mode ?? 0o666;

    this.#start = options.start ?? 0;
    this.#end = options.end ?? Infinity;
    this.#pos = this.#start;
    this.bytesRead = 0;

    this.#autoWatch = options.autoWatch ?? true;
    this.#persistent = options.persistent ?? true;

    this.#fd = null;
    this.watcher = null;
  }

  get pending() {
    return this.#fd === null;
  }

  get watching() {
    return this.#watching;
  }

  get waiting() {
    return this.#waiting;
  }

  _construct(cb) {
    if (this.#autoWatch) {
      this.watch();
    }

    fs.open(this.path, this.#flags, this.#mode, (err, fd) => {
      if (err) {
        cb(err);
      } else {
        this.#fd = fd;
        cb();
        process.nextTick(() => {
          this.emit("open", this.#fd);
          this.emit("ready");
        });
      }
    });
  }

  _read(n) {
    n = Math.min(this.#end - this.#pos + 1, n);

    if (n <= 0) {
      this.push(null);
      return;
    }

    const buf = Buffer.allocUnsafeSlow(n);

    this.#performingIO = true;
    fs.read(this.#fd, buf, 0, n, this.#pos, (err, bytesRead, buf) => {
      this.#performingIO = false;

      /* c8 ignore next 4 */
      if (this.destroyed) {
        this.emit(ioDone, err);
        return;
      }

      if (err) {
        this.emit("error", err);
        this.destroy(err);
        return;
      }

      if (bytesRead === 0) {
        if (this.#watching) {
          this.#waiting = true;
          this.watcher.once("change", () => {
            this.#waiting = false;
            this._read(n);
          });
        } else {
          this.push(null);
        }
        this.emit("eof");
        return;
      }

      this.#pos += bytesRead;
      this.bytesRead += bytesRead;

      if (bytesRead !== buf.length) {
        const dst = Buffer.allocUnsafeSlow(bytesRead);
        buf.copy(dst, 0, 0, bytesRead);
        buf = dst;
      }

      this.push(buf);
    });
  }

  watch() {
    this.#watching = true;

    if (!this.watcher) {
      this.watcher = fs.watch(this.path, {
        persistent: this.#persistent,
      });
    }
  }

  unwatch() {
    this.#autoWatch = false;
    this.#watching = false;

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.#waiting) {
      this.#waiting = false;
      this.push(null);
    }
  }

  _destroy(err, cb) {
    this.unwatch();

    /* c8 ignore next 3 */
    if (this.#performingIO) {
      this.once(ioDone, (er) => this.#close(err || er, cb));
    } else {
      this.#close(err, cb);
    }
  }

  close(cb) {
    if (typeof cb === "function") finished(this, cb);
    this.destroy();
  }

  #close(err, cb) {
    if (this.#fd) {
      fs.close(this.#fd, (er) => cb(er || err));
      this.#fd = null;
    } else {
      cb(err);
    }
  }
}

function createReadStream(path, options) {
  return new TailFileStream(path, options);
}

export { createReadStream };
