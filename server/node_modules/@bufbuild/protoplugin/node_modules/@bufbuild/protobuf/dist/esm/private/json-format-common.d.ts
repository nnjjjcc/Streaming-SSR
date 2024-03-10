import type { JsonFormat, JsonValue, JsonWriteOptions } from "../json-format.js";
import type { FieldInfo } from "../field.js";
import { ScalarType } from "../field.js";
import type { EnumType } from "../enum.js";
type JsonFormatWriteFieldFn = (field: FieldInfo, value: any, options: JsonWriteOptions) => JsonValue | undefined;
export declare function makeJsonFormatCommon(nullAsZeroValue: boolean, makeWriteField: (writeEnumFn: typeof writeEnum, writeScalarFn: typeof writeScalar) => JsonFormatWriteFieldFn): JsonFormat;
declare function writeEnum(type: EnumType, value: number | undefined, emitZeroValue: boolean, enumAsInteger: boolean): JsonValue | undefined;
declare function writeScalar(type: ScalarType, value: any, emitZeroValue: boolean): JsonValue | undefined;
export {};
