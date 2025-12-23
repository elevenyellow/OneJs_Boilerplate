import { Controller, Get } from '@OneJs/server'
import { UseAuth, Roles } from '@OneJs/core'
import type { Context } from 'elysia'

@Controller('/reports')
export class ReportsController {

    @UseAuth()           // 1. Requerimos autenticación
    @Roles('admin')      // 2. Solo permitimos el rol 'admin'
    @Get('/financial')
    async getFinancialReports(context: Context) {
        // Si llegamos aquí, el usuario está autenticado y es admin
        // El usuario está disponible en: context.store.user
        const { store: { user } } = context
        console.log(user)


        return {
            generatedBy: user.email,
            data: [/* ... */]
        }
    }

    @UseAuth()
    @Roles('admin', 'staff') // Múltiples roles permitidos
    @Get('/general')
    async getGeneralReports() {
        return { message: 'Acceso permitido para admin y staff' }
    }
}