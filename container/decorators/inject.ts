import { container } from "../container";

/**
 * Decorador que especifica el tipo de dependencia a inyectar en un parámetro de constructor.
 * Puede ser una clase concreta o un token (interfaz/símbolo).
 */
export function Inject(token: any): ParameterDecorator {
	return (target, _propertyKey, index) => {
		container.setParamType(target, index, token);
	};
}
