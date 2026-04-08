import { Context } from 'elysia'
import { createSuccessResponse } from '../types/response'

export function responseMiddleware() {
  return async (context: Context) => {
    // Log the incoming request
    console.log('Request:', {
      method: context.request.method,
      url: context.request.url,
      headers: Object.fromEntries(context.request.headers.entries()),
    })

    // Store the original response
    const originalResponse = context.body

    // If the response is already formatted, return it as is
    if (
      originalResponse &&
      typeof originalResponse === 'object' &&
      'success' in originalResponse
    ) {
      console.log('Response already formatted:', originalResponse)
      return originalResponse
    }

    // Format the response
    const formattedResponse = createSuccessResponse(originalResponse)
    console.log('Formatted response:', formattedResponse)

    // Set the response and return it
    context.body = formattedResponse
    return formattedResponse
  }
}
