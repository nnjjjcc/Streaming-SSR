"use strict";
// Copyright 2021-2024 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRegistryFromDescriptors = void 0;
const assert_js_1 = require("./private/assert.js");
const proto3_js_1 = require("./proto3.js");
const proto2_js_1 = require("./proto2.js");
const field_js_1 = require("./field.js");
const names_js_1 = require("./private/names.js");
const timestamp_pb_js_1 = require("./google/protobuf/timestamp_pb.js");
const duration_pb_js_1 = require("./google/protobuf/duration_pb.js");
const any_pb_js_1 = require("./google/protobuf/any_pb.js");
const empty_pb_js_1 = require("./google/protobuf/empty_pb.js");
const field_mask_pb_js_1 = require("./google/protobuf/field_mask_pb.js");
const struct_pb_js_1 = require("./google/protobuf/struct_pb.js");
const enum_js_1 = require("./private/enum.js");
const wrappers_pb_js_1 = require("./google/protobuf/wrappers_pb.js");
const descriptor_pb_js_1 = require("./google/protobuf/descriptor_pb.js");
const create_descriptor_set_js_1 = require("./create-descriptor-set.js");
// well-known message types with specialized JSON representation
const wkMessages = [
    any_pb_js_1.Any,
    duration_pb_js_1.Duration,
    empty_pb_js_1.Empty,
    field_mask_pb_js_1.FieldMask,
    struct_pb_js_1.Struct,
    struct_pb_js_1.Value,
    struct_pb_js_1.ListValue,
    timestamp_pb_js_1.Timestamp,
    duration_pb_js_1.Duration,
    wrappers_pb_js_1.DoubleValue,
    wrappers_pb_js_1.FloatValue,
    wrappers_pb_js_1.Int64Value,
    wrappers_pb_js_1.Int32Value,
    wrappers_pb_js_1.UInt32Value,
    wrappers_pb_js_1.UInt64Value,
    wrappers_pb_js_1.BoolValue,
    wrappers_pb_js_1.StringValue,
    wrappers_pb_js_1.BytesValue,
];
// well-known enum types with specialized JSON representation
const wkEnums = [(0, enum_js_1.getEnumType)(struct_pb_js_1.NullValue)];
/**
 * Create a registry from a set of descriptors. The types returned by this
 * registry behave exactly like types from generated code.
 *
 * This function accepts google.protobuf.FileDescriptorSet in serialized or
 * deserialized form. Alternatively, it also accepts a DescriptorSet (see
 * createDescriptorSet()).
 *
 * By default, all well-known types with a specialized JSON representation
 * are replaced with their generated counterpart in this package.
 */
function createRegistryFromDescriptors(input, replaceWkt = true) {
    const set = input instanceof Uint8Array || input instanceof descriptor_pb_js_1.FileDescriptorSet
        ? (0, create_descriptor_set_js_1.createDescriptorSet)(input)
        : input;
    const enums = new Map();
    const messages = new Map();
    const extensions = new Map();
    const extensionsByExtendee = new Map();
    const services = {};
    if (replaceWkt) {
        for (const mt of wkMessages) {
            messages.set(mt.typeName, mt);
        }
        for (const et of wkEnums) {
            enums.set(et.typeName, et);
        }
    }
    return {
        /**
         * May raise an error on invalid descriptors.
         */
        findEnum(typeName) {
            const existing = enums.get(typeName);
            if (existing) {
                return existing;
            }
            const desc = set.enums.get(typeName);
            if (!desc) {
                return undefined;
            }
            const runtime = desc.file.syntax == "proto3" ? proto3_js_1.proto3 : proto2_js_1.proto2;
            const type = runtime.makeEnumType(typeName, desc.values.map((u) => ({
                no: u.number,
                name: u.name,
                localName: (0, names_js_1.localName)(u),
            })), {});
            enums.set(typeName, type);
            return type;
        },
        /**
         * May raise an error on invalid descriptors.
         */
        findMessage(typeName) {
            const existing = messages.get(typeName);
            if (existing) {
                return existing;
            }
            const desc = set.messages.get(typeName);
            if (!desc) {
                return undefined;
            }
            const runtime = desc.file.syntax == "proto3" ? proto3_js_1.proto3 : proto2_js_1.proto2;
            const fields = [];
            const type = runtime.makeMessageType(typeName, () => fields, {
                localName: (0, names_js_1.localName)(desc),
            });
            messages.set(typeName, type);
            for (const field of desc.fields) {
                const fieldInfo = makeFieldInfo(field, this);
                fields.push(fieldInfo);
            }
            return type;
        },
        /**
         * May raise an error on invalid descriptors.
         */
        findService(typeName) {
            const existing = services[typeName];
            if (existing) {
                return existing;
            }
            const desc = set.services.get(typeName);
            if (!desc) {
                return undefined;
            }
            const methods = {};
            for (const method of desc.methods) {
                const I = this.findMessage(method.input.typeName);
                const O = this.findMessage(method.output.typeName);
                (0, assert_js_1.assert)(I, `message "${method.input.typeName}" for ${method.toString()} not found`);
                (0, assert_js_1.assert)(O, `output message "${method.output.typeName}" for ${method.toString()} not found`);
                methods[(0, names_js_1.localName)(method)] = {
                    name: method.name,
                    I,
                    O,
                    kind: method.methodKind,
                    idempotency: method.idempotency,
                    // We do not surface options at this time
                    // options: {},
                };
            }
            return (services[typeName] = {
                typeName: desc.typeName,
                methods,
            });
        },
        /**
         * May raise an error on invalid descriptors.
         */
        findExtensionFor(typeName, no) {
            var _a;
            if (!set.messages.has(typeName)) {
                return undefined;
            }
            let extensionsByNo = extensionsByExtendee.get(typeName);
            if (!extensionsByNo) {
                // maintain a lookup for extension desc by number
                extensionsByNo = new Map();
                extensionsByExtendee.set(typeName, extensionsByNo);
                for (const desc of set.extensions.values()) {
                    if (desc.extendee.typeName == typeName) {
                        extensionsByNo.set(desc.number, desc);
                    }
                }
            }
            const desc = (_a = extensionsByExtendee.get(typeName)) === null || _a === void 0 ? void 0 : _a.get(no);
            return desc ? this.findExtension(desc.typeName) : undefined;
        },
        /**
         * May raise an error on invalid descriptors.
         */
        findExtension(typeName) {
            const existing = extensions.get(typeName);
            if (existing) {
                return existing;
            }
            const desc = set.extensions.get(typeName);
            if (!desc) {
                return undefined;
            }
            const extendee = this.findMessage(desc.extendee.typeName);
            (0, assert_js_1.assert)(extendee, `message "${desc.extendee.typeName}" for ${desc.toString()} not found`);
            const runtime = desc.file.syntax == "proto3" ? proto3_js_1.proto3 : proto2_js_1.proto2;
            const ext = runtime.makeExtension(typeName, extendee, makeFieldInfo(desc, this));
            extensions.set(typeName, ext);
            return ext;
        },
    };
}
exports.createRegistryFromDescriptors = createRegistryFromDescriptors;
function makeFieldInfo(desc, resolver) {
    switch (desc.fieldKind) {
        case "map":
            (0, assert_js_1.assert)(desc.kind == "field"); // maps are not allowed for extensions
            return makeMapFieldInfo(desc, resolver);
        case "message":
            return makeMessageFieldInfo(desc, resolver);
        case "enum": {
            const fi = makeEnumFieldInfo(desc, resolver);
            fi.default = desc.getDefaultValue();
            return fi;
        }
        case "scalar": {
            const fi = makeScalarFieldInfo(desc);
            fi.default = desc.getDefaultValue();
            return fi;
        }
    }
}
function makeMapFieldInfo(field, resolver) {
    const base = {
        kind: "map",
        no: field.number,
        name: field.name,
        jsonName: field.jsonName,
        K: field.mapKey,
    };
    if (field.mapValue.message) {
        const messageType = resolver.findMessage(field.mapValue.message.typeName);
        (0, assert_js_1.assert)(messageType, `message "${field.mapValue.message.typeName}" for ${field.toString()} not found`);
        return Object.assign(Object.assign({}, base), { V: {
                kind: "message",
                T: messageType,
            } });
    }
    if (field.mapValue.enum) {
        const enumType = resolver.findEnum(field.mapValue.enum.typeName);
        (0, assert_js_1.assert)(enumType, `enum "${field.mapValue.enum.typeName}" for ${field.toString()} not found`);
        return Object.assign(Object.assign({}, base), { V: {
                kind: "enum",
                T: enumType,
            } });
    }
    return Object.assign(Object.assign({}, base), { V: {
            kind: "scalar",
            T: field.mapValue.scalar,
        } });
}
function makeScalarFieldInfo(field) {
    // We are creating _partial_ field info here, so we omit long type bigint,
    // which is the default.
    const longType = field.longType == field_js_1.LongType.STRING
        ? { L: field_js_1.LongType.STRING }
        : {};
    const base = Object.assign({ kind: "scalar", no: field.number, name: field.name, jsonName: field.jsonName, T: field.scalar }, longType);
    if (field.repeated) {
        return Object.assign(Object.assign({}, base), { repeated: true, packed: field.packed, oneof: undefined, T: field.scalar });
    }
    if (field.oneof) {
        return Object.assign(Object.assign({}, base), { oneof: field.oneof.name });
    }
    if (field.optional) {
        return Object.assign(Object.assign({}, base), { opt: true });
    }
    return base;
}
function makeMessageFieldInfo(field, resolver) {
    const messageType = resolver.findMessage(field.message.typeName);
    (0, assert_js_1.assert)(messageType, `message "${field.message.typeName}" for ${field.toString()} not found`);
    const base = {
        kind: "message",
        no: field.number,
        name: field.name,
        jsonName: field.jsonName,
        T: messageType,
        delimited: field.proto.type == descriptor_pb_js_1.FieldDescriptorProto_Type.GROUP,
    };
    if (field.repeated) {
        return Object.assign(Object.assign({}, base), { repeated: true, packed: field.packed, oneof: undefined });
    }
    if (field.oneof) {
        return Object.assign(Object.assign({}, base), { oneof: field.oneof.name });
    }
    if (field.optional) {
        return Object.assign(Object.assign({}, base), { opt: true });
    }
    return base;
}
function makeEnumFieldInfo(field, resolver) {
    const enumType = resolver.findEnum(field.enum.typeName);
    (0, assert_js_1.assert)(enumType, `enum "${field.enum.typeName}" for ${field.toString()} not found`);
    const base = {
        kind: "enum",
        no: field.number,
        name: field.name,
        jsonName: field.jsonName,
        T: enumType,
    };
    if (field.repeated) {
        return Object.assign(Object.assign({}, base), { repeated: true, packed: field.packed, oneof: undefined });
    }
    if (field.oneof) {
        return Object.assign(Object.assign({}, base), { oneof: field.oneof.name });
    }
    if (field.optional) {
        return Object.assign(Object.assign({}, base), { opt: true });
    }
    return base;
}
