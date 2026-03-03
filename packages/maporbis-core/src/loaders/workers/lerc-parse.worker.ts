import { LERCParser } from "../parsers/lerc-parse";

type MessageType = {
	demData: ArrayBuffer;
	z: number;
	clipBounds: [number, number, number, number];
};

self.onmessage = (msg: MessageEvent<MessageType>) => {
	const data = msg.data;
	const mesh = LERCParser.parse(data.demData, data.z, data.clipBounds);
	self.postMessage(mesh);
};
