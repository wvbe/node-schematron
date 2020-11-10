export class Namespace {
	prefix: string;
	uri: string;

	constructor(prefix: string, uri: string) {
		this.prefix = prefix;
		this.uri = uri;
	}

	static QUERY = `map {
		"prefix": @prefix/string(),
		"uri": @uri/string()
	}`;

	static fromJson(json: JsonNamespace): Namespace {
		return new Namespace(json.prefix, json.uri);
	}
}

export type JsonNamespace = {
	prefix: string;
	uri: string;
};
