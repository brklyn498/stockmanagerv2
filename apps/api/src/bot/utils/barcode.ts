import { Jimp } from 'jimp';
import Quagga from 'quagga';
import { Readable } from 'stream';

export async function decodeBarcodeFromUrl(url: string): Promise<string | null> {
  try {
    const image = await Jimp.read(url);
    // Jimp v1.0+ might not have getBufferAsync directly or signature changed.
    // Using standard callback wrapped in promise or getBuffer if available.

    // Check if image.bitmap exists (it should)
    const { width, height, data } = image.bitmap;

    // We can try passing the raw bitmap data to Quagga if we mock the context,
    // but easier is often to convert to buffer (JPEG/PNG) and base64 for data URI src.

    const mime = "image/jpeg";
    const buffer = await image.getBuffer(mime);

    return await decodeBarcodeFromBuffer(buffer);
  } catch (error) {
    console.error('Error reading image for barcode:', error);
    return null;
  }
}

async function decodeBarcodeFromBuffer(buffer: Buffer): Promise<string | null> {
  return new Promise((resolve) => {
    // Construct Data URI
    const dataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    const config = {
      inputStream: {
        size: 800,
        singleChannel: false,
        type: "ImageStream", // Important for static images
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      decoder: {
        readers: ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader", "upc_e_reader"]
      },
      locate: true,
      src: dataUri
    };

    Quagga.decodeSingle(config, (result: any) => {
      if (result && result.codeResult && result.codeResult.code) {
        resolve(result.codeResult.code);
      } else {
        resolve(null);
      }
    });
  });
}
