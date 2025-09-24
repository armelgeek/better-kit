import { Resource as RaResource, ResourceProps } from "ra-core";

export const Resource = (props: ResourceProps) => {
	return <RaResource {...props} />;
};

export type { ResourceProps };