import type { Handler, Middleware } from "./router";
import nacl from "tweetnacl";

const HEX_SEGMENT = /.{1,2}/g;

const fromHexString = (hexString: string) =>
  new Uint8Array(
    hexString.match(HEX_SEGMENT)!.map((byte) => parseInt(byte, 16)),
  );

const makeValidator =
  ({ publicKey }: { publicKey: string }) =>
  async (request: Request): Promise<boolean> => {
    const signature = String(request.headers.get("X-Signature-Ed25519"));
    const timestamp = String(request.headers.get("X-Signature-Timestamp"));
    const body = await request.text();

    return nacl.sign.detached.verify(
      new TextEncoder().encode(timestamp + body),
      fromHexString(signature),
      fromHexString(publicKey),
    );
  };

export const authorize =
  ({ publicKey }: { publicKey: string }): Middleware =>
  (next: Handler): Handler => {
    const validateRequest = makeValidator({ publicKey });
    return async (request: Request) => {
      if (!(await validateRequest(request.clone()))) {
        return new Response(null, { status: 401 });
      }
      return next(request);
    };
  };
