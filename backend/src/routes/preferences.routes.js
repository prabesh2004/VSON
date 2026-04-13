import { Router } from 'express'
import { getPreferences, putPreferences } from '../controllers/preferences.controller.js'

const preferencesRouter = Router()

preferencesRouter.get('/preferences/:id', getPreferences)
preferencesRouter.put('/preferences/:id', putPreferences)

export default preferencesRouter
