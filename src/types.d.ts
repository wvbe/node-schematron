export type FontoxpathOptions = {
	moduleImports: { [prefix: string]: string };
	namespaceResolver: (prefix?: string | null) => string | null;
	debug?: boolean;
};
