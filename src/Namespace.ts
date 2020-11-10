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

	static fromJson(json: NamespaceJson): Namespace {
		return new Namespace(json.prefix, json.uri);
	}
}

export type NamespaceJson = {
	prefix: string;
	uri: string;
};
