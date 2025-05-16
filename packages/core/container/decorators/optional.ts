import { container } from "../container";

/**
 * Marca una dependencia como opcional.
 * Puedes pasar un valor literal o una función que retorne un valor de fallback.
 * Ejemplos:
 *  - @Optional()                      // undefined si no se encuentra
 *  - @Optional('default string')     // fallback literal
 *  - @Optional(() => new Mock())     // fallback dinámico
 */
export function Optional(fallback?: (() => any) | any): ParameterDecorator {
	return (target, _propertyKey, index) => {
		container.setParamOptional(target, index, fallback);
	};
}
