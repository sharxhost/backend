import { BufferObject, imageHash, UrlRequestObject } from "image-hash";
import { basename } from "path";
import Signale from "signale";
import { exec } from "child_process";
import { promisify } from "util";

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
