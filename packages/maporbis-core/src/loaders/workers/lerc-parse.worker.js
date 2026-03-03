import { LERCParser } from "../parsers/lerc-parse";
self.onmessage = (msg) => {
    const data = msg.data;
    const mesh = LERCParser.parse(data.demData, data.z, data.clipBounds);
    self.postMessage(mesh);
};
