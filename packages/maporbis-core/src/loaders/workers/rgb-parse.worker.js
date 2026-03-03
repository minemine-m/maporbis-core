import { RGBParser } from "../parsers/rgb-parse";
self.onmessage = (msg) => {
    const geometry = RGBParser.parse(msg.data.imgData);
    self.postMessage(geometry);
    // self.close();
};
