import type { IBinaryWriter } from "../binary-encoding.js";
import type { BinaryFormat, BinaryWriteOptions } from "../binary-format.js";
import type { FieldInfo } from "../field.js";
import { ScalarType } from "../field.js";
export declare function makeBinaryFormatCommon(): Omit<BinaryFormat, "writeMessage" | "writeField">;
export declare function writeMapEntry(writer: IBinaryWriter, options: BinaryWriteOptions, field: FieldInfo & {
    kind: "map";
}, key: any, value: any): void;
export declare function writeMessageField(writer: IBinaryWriter, options: BinaryWriteOptions, field: FieldInfo & {
    kind: "message";
}, value: any): void;
export declare function writeScalar(writer: IBinaryWriter, type: ScalarType, fieldNo: number, value: any, emitIntrinsicDefault: boolean): void;
export declare function writePacked(writer: IBinaryWriter, type: ScalarType, fieldNo: number, value: any[]): void;
