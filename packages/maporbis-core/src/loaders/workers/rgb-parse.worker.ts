import { RGBParser } from "../parsers/rgb-parse";

type MessageType = {
	imgData: ImageData;
};

self.onmessage = (msg: MessageEvent<MessageType>) => {
	const geometry = RGBParser.parse(msg.data.imgData);
	self.postMessage(geometry);
	// self.close();
};
