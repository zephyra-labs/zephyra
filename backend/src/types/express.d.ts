/**
 * @file express.d.ts
 * @description Extends Express Request type to include Multer file support.
 */

import type { Multer } from "multer";

declare global {
  namespace Express {
    /**
     * Extended Request interface to include `file` property for single file uploads.
     */
    interface Request {
      /** Optional uploaded file added by Multer middleware */
      file?: Multer.File;
    }
  }
}
