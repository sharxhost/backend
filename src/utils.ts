import { BufferObject, imageHash, UrlRequestObject } from "image-hash";
import { basename } from "path";
import Signale from "signale";
import { exec } from "child_process";
import { promisify } from "util";
import { Response } from "express";
import { SharXError, UnknownError } from "../api-types/src/errors";

export function createSignale(filename: string, notify = true) {
  const signale = Signale.scope(basename(filename));
  if (notify) signale.success("Registered!");
  return signale;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const imageHashAsync = (oldSrc: string | UrlRequestObject | BufferObject, bits: any, method: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    imageHash(oldSrc, bits, method, (error: Error | null, data: string | null) => {
      if (error) reject(error);
      else if (!data) reject();
      else resolve(data);
    });
  });
};

export async function getOutput(command: string) {
  const asyncExec = promisify(exec);
  const { stdout } = await asyncExec(command);
  return stdout.trim();
}

export function success(res: Response, data: Record<string, unknown>) {
  return res.status(200).json({ success: true, ...data });
}

function handleError(err: unknown, res: Response) {
  if (err instanceof SharXError) {
    err.send(res);
  }
  else {
    new UnknownError(err).send(res);
  }
}

export function wrapper(res: Response, cb: (() => void | Record<string, unknown> | Promise<void | Record<string, unknown>>)) {
  try {
    const result = cb();
    if (result instanceof Promise) {
      result.then(ret => {
        if (ret)
          success(res, ret);
      }).catch(err => handleError(err, res));
    }
    else if (result) {
      success(res, result);
    }
  }
  catch (err) {
    handleError(err, res);
  }
}
