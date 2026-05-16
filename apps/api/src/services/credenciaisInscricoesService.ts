import crypto from "crypto";
import QRCode from "qrcode";

export async function gerarCredenciaisIncricao(){

    const hash = crypto.randomUUID();

    const qrCode = await QRCode.toDataURL(hash);

    return { hash, qrCode };
}